#!/usr/bin/env node
/**
 * Backfill AI illustrations for every image-capable mission task.
 *
 * Walks all `mission_tasks` of image-capable types, and for each EMPTY image
 * slot generates a picture with OpenRouter (same model + prompt style as the
 * app's `TaskImageField`), uploads it to the public `content/tasks` bucket, and
 * writes the URL back into the task's JSON content.
 *
 * Deduplication — the whole cost optimisation — mirrors the app's
 * `vocab_image_cache` / `task_image_cache` read-through: one image per
 * normalized subject. A subject already in `task_image_cache` (or generated
 * earlier in this run) is reused for free instead of regenerating. Common words
 * like "cat", "apple", "school" are therefore only ever generated once.
 *
 * This is a one-off backfill run outside the Next app, so it needs elevated
 * credentials that the browser never gets:
 *
 *   SUPABASE_URL              (or NEXT_PUBLIC_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY (bypasses RLS to read/update tasks + storage)
 *   OPENROUTER_API_KEY        (paid image generation)
 *
 * Usage:
 *   node scripts/backfill-task-images.mjs [options]
 *
 * Options:
 *   --dry-run          Report what would be generated; no API calls, no writes.
 *   --limit N          Process at most N tasks (after filtering).
 *   --only t1,t2       Restrict to these task types (default: all image types).
 *   --delay MS         Pause between generations (default 600).
 *   --force            Ignore the cache and regenerate every slot.
 *   --model NAME       Override the OpenRouter image model.
 */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

/* ── Config / args ─────────────────────────────────────────────────────────── */

const IMAGE_TYPES = [
  "vocabulary",
  "quiz",
  "true_false",
  "word_scramble",
  "picture_reveal",
  "flashcards",
  "matching", // only word-to-image mode carries images
];

const args = process.argv.slice(2);
const hasFlag = (name) => args.includes(name);
const flagValue = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : fallback;
};

const DRY_RUN = hasFlag("--dry-run");
const FORCE = hasFlag("--force");
const LIMIT = Number(flagValue("--limit", "0")) || 0;
const DELAY_MS = Number(flagValue("--delay", "600")) || 0;
const ONLY = flagValue("--only", "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const MODEL = flagValue("--model", "google/gemini-2.5-flash-image");
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 90_000;

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const types = (ONLY.length ? ONLY : IMAGE_TYPES).filter((t) => IMAGE_TYPES.includes(t));

function fail(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

if (!SUPABASE_URL || !SERVICE_KEY) {
  fail("Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.");
}
if (!DRY_RUN && !OPENROUTER_API_KEY) {
  fail("Set OPENROUTER_API_KEY (or pass --dry-run to preview without generating).");
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── Helpers shared with the app (kept in sync by hand) ────────────────────── */

/** Cache key: canonical subject form. Mirrors normalizeWordKey in the app. */
function normalizeWordKey(word) {
  return String(word ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Mirrors buildTaskImagePrompt in features/admin/taskImagePrompt.ts. */
function buildTaskImagePrompt(subject, context) {
  const clean = (v) => String(v ?? "").replace(/\s+/g, " ").trim();
  const s = clean(subject) || "the word";
  const c = clean(context);
  return [
    `A bright, friendly illustration of "${s}" for a children's English-learning flashcard.`,
    c ? `Context: ${c}.` : "",
    "One clear subject, centred, filling most of the frame, on a simple soft solid background.",
    "Style: cheerful rounded kids' cartoon, bold clean shapes, vibrant flat colours, soft shading.",
    "No text, letters, numbers, words, speech bubbles, watermarks, borders or UI.",
  ]
    .filter(Boolean)
    .join("\n");
}

/** POSTs one prompt to OpenRouter and returns a data URL. Mirrors requestOpenRouterImage. */
async function requestOpenRouterImage(prompt) {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "X-Title": "SLAY CITY",
    },
    body: JSON.stringify({ model: MODEL, modalities: ["image", "text"], messages: [{ role: "user", content: prompt }] }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.message ?? `Image model error (${res.status}).`);
  const url = body?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!url) throw new Error("The model did not return an image.");
  if (url.startsWith("data:image/")) return url;
  // Some models return a hosted URL — fetch and re-encode as a data URL.
  const imgRes = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!imgRes.ok) throw new Error("The model returned an unreachable image URL.");
  const contentType = imgRes.headers.get("content-type") ?? "image/png";
  const buf = Buffer.from(await imgRes.arrayBuffer());
  return `data:${contentType};base64,${buf.toString("base64")}`;
}

/** Uploads a data URL to content/tasks and returns the public URL. */
async function uploadDataUrl(dataUrl) {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/s.exec(dataUrl);
  if (!match) throw new Error("Unreadable generated image.");
  const contentType = match[1];
  const buffer = Buffer.from(match[2], "base64");
  const ext = contentType === "image/jpeg" ? "jpg" : contentType === "image/webp" ? "webp" : "png";
  const path = `tasks/${randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("content").upload(path, buffer, { contentType, upsert: false });
  if (error) throw error;
  return supabase.storage.from("content").getPublicUrl(path).data.publicUrl;
}

/* ── Image-slot extraction per task type ───────────────────────────────────── */

const hasUrl = (v) => typeof v === "string" && v.trim().length > 0;

/** Returns [{ subject, filled, apply(url) }] for a task's image slots. */
function slotsFor(taskType, content) {
  if (!content || typeof content !== "object") return [];
  const single = (subject) => [
    { subject, filled: hasUrl(content.imageUrl), apply: (url) => (content.imageUrl = url) },
  ];

  switch (taskType) {
    case "vocabulary":
    case "word_scramble":
      return single(content.word);
    case "quiz":
    case "picture_reveal": {
      const options = Array.isArray(content.options) ? content.options : [];
      const subject = options[content.correctIndex]?.trim?.() || content.question || "";
      return single(subject);
    }
    case "true_false": {
      // Seed statements read: “Word” means “переклад”. — take the first quoted term.
      const m = /[“"']([^“”"']+)[”"']/.exec(String(content.statement ?? ""));
      const subject = m ? m[1] : String(content.statement ?? "").split(/\s+/)[0] || "";
      return single(subject);
    }
    case "flashcards": {
      const cards = Array.isArray(content.cards) ? content.cards : [];
      return cards.map((card) => ({
        subject: card?.front ?? "",
        filled: hasUrl(card?.imageUrl),
        apply: (url) => (card.imageUrl = url),
      }));
    }
    case "matching": {
      if (content.mode !== "word-to-image") return [];
      const pairs = Array.isArray(content.pairs) ? content.pairs : [];
      return pairs.map((pair) => ({
        subject: pair?.word ?? "",
        filled: hasUrl(pair?.match),
        apply: (url) => (pair.match = url),
      }));
    }
    default:
      return [];
  }
}

/* ── Main ──────────────────────────────────────────────────────────────────── */

async function loadCache() {
  const map = new Map();
  const { data, error } = await supabase.from("task_image_cache").select("word_key, image_url");
  if (error) {
    console.warn(`⚠ Could not read task_image_cache (${error.message}); starting empty.`);
    return map;
  }
  for (const row of data ?? []) map.set(row.word_key, row.image_url);
  return map;
}

async function fetchTasks() {
  const all = [];
  const pageSize = 500;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("mission_tasks")
      .select("id, task_type, content")
      .in("task_type", types)
      .order("id")
      .range(from, from + pageSize - 1);
    if (error) fail(`Reading mission_tasks failed: ${error.message}`);
    all.push(...data);
    if (data.length < pageSize) break;
  }
  return all;
}

async function resolveImage(subject, cache) {
  const key = normalizeWordKey(subject);
  if (!key) return null;
  if (!FORCE && cache.has(key)) return { url: cache.get(key), fromCache: true };
  if (DRY_RUN) {
    cache.set(key, `__DRY__:${key}`); // reserve so we don't double-count in a dry run
    return { url: null, fromCache: false, dry: true };
  }
  const dataUrl = await requestOpenRouterImage(buildTaskImagePrompt(subject));
  const url = await uploadDataUrl(dataUrl);
  cache.set(key, url);
  const { error } = await supabase
    .from("task_image_cache")
    .upsert({ word_key: key, image_url: url, updated_at: new Date().toISOString() }, { onConflict: "word_key" });
  if (error) console.warn(`⚠ task_image_cache upsert failed for "${key}": ${error.message}`);
  return { url, fromCache: false };
}

async function main() {
  console.log(
    `SLAY CITY — task image backfill${DRY_RUN ? " (DRY RUN)" : ""}\n` +
      `  types:  ${types.join(", ")}\n` +
      `  model:  ${MODEL}\n` +
      `  cache:  task_image_cache (reuse ${FORCE ? "OFF (--force)" : "ON"})\n`
  );

  const cache = await loadCache();
  console.log(`Loaded ${cache.size} cached subject(s).`);

  let tasks = await fetchTasks();
  console.log(`Found ${tasks.length} image-capable task(s).`);
  if (LIMIT) tasks = tasks.slice(0, LIMIT);

  const stats = { scanned: 0, slots: 0, empty: 0, cached: 0, generated: 0, updated: 0, errors: 0 };
  const uniqueGenerated = new Set();

  for (const task of tasks) {
    stats.scanned++;
    const content = task.content;
    const slots = slotsFor(task.task_type, content);
    let changed = false;

    for (const slot of slots) {
      stats.slots++;
      if (slot.filled) continue;
      if (!String(slot.subject ?? "").trim()) continue;
      stats.empty++;
      try {
        const result = await resolveImage(slot.subject, cache);
        if (!result) continue;
        if (result.fromCache) {
          stats.cached++;
          slot.apply(result.url);
          changed = true;
        } else if (result.dry) {
          uniqueGenerated.add(normalizeWordKey(slot.subject));
        } else {
          stats.generated++;
          uniqueGenerated.add(normalizeWordKey(slot.subject));
          slot.apply(result.url);
          changed = true;
          if (DELAY_MS) await sleep(DELAY_MS);
        }
      } catch (err) {
        stats.errors++;
        console.warn(`⚠ "${slot.subject}" (task ${task.id}): ${err.message}`);
      }
    }

    if (changed && !DRY_RUN) {
      const { error } = await supabase.from("mission_tasks").update({ content }).eq("id", task.id);
      if (error) {
        stats.errors++;
        console.warn(`⚠ Update failed for task ${task.id}: ${error.message}`);
      } else {
        stats.updated++;
      }
    }

    if (stats.scanned % 50 === 0) {
      console.log(
        `  …${stats.scanned}/${tasks.length} tasks — generated ${stats.generated}, reused ${stats.cached}`
      );
    }
  }

  console.log("\n── Summary ─────────────────────────────");
  console.log(`  tasks scanned:        ${stats.scanned}`);
  console.log(`  image slots:          ${stats.slots}`);
  console.log(`  empty slots:          ${stats.empty}`);
  if (DRY_RUN) {
    console.log(`  would generate:       ${uniqueGenerated.size} unique subject(s)`);
    console.log(`  (reused from cache:   ${stats.cached})`);
  } else {
    console.log(`  reused from cache:    ${stats.cached}`);
    console.log(`  generated (unique):   ${uniqueGenerated.size}`);
    console.log(`  generated (slots):    ${stats.generated}`);
    console.log(`  tasks updated:        ${stats.updated}`);
  }
  console.log(`  errors:               ${stats.errors}`);
  console.log("────────────────────────────────────────\n");
}

main().catch((err) => fail(err.stack || String(err)));
