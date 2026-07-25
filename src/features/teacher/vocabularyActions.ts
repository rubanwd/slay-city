"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requestOpenRouterImage } from "@/features/admin/openRouterImage";
import {
  buildVocabTest,
  clampWordCount,
  normalizeWordKey,
  parseGeneratedWords,
  type VocabDraftWord,
} from "@/features/homework/vocabulary";

import { extractJson, requestOpenRouterJson } from "./openRouterChat";
import { requireTeacher } from "./requireTeacher";
import { buildVocabularyPrompt, buildWordImagePrompt } from "./vocabularyPrompt";

/** Public storage bucket for content imagery (mirrors uploadContentImage). */
const CONTENT_BUCKET = "content";

/**
 * Image model for vocabulary flashcards, on OpenRouter (existing
 * `OPENROUTER_API_KEY`, no extra provider/key). Gemini's flash image model is
 * the sweet spot here: cheaper and faster in practice than gpt-5-image-mini
 * (which billed higher and was slow), and it renders clean kid-friendly
 * illustrations. The `vocab_image_cache` makes repeated words cost nothing.
 */
const VOCAB_IMAGE_MODEL = "google/gemini-2.5-flash-image";

const MAX_TASK_COUNT = 20;

/** A word as submitted for publishing — image already uploaded to storage by the client. */
export interface PublishWordInput {
  word: string;
  transcription: string | null;
  translation: string | null;
  imageUrl: string | null;
}

export type GenerateDraftResult =
  | { ok: true; words: VocabDraftWord[] }
  | { ok: false; error: string };

export type GenerateImageResult = { ok: true; imageUrl: string } | { ok: false; error: string };

export type VocabActionResult = { ok: true } | { ok: false; error: string };

/**
 * Confirms the caller is a teacher (or admin viewing-as) AND can see the topic
 * — RLS on `homework_topics` already limits SELECT to the owning teacher / an
 * admin, so a successful read is proof of ownership. Returns the topic's group
 * id (for revalidation) or an error.
 */
async function requireTopicAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  topicId: string
): Promise<{ ok: true; groupId: string } | { ok: false; error: string }> {
  const teacher = await requireTeacher(supabase);
  if (!teacher.ok) return { ok: false, error: teacher.error };

  const { data: topic } = await supabase
    .from("homework_topics")
    .select("id, group_id")
    .eq("id", topicId)
    .maybeSingle();

  if (!topic) return { ok: false, error: "Topic not found or not yours to edit." };
  return { ok: true, groupId: topic.group_id };
}

function revalidateTopic(groupId: string, topicId: string): void {
  revalidatePath(`/teacher/groups/${groupId}/topics/${topicId}`);
  revalidatePath(`/teacher/groups/${groupId}`);
  revalidatePath("/homework", "layout");
}

/* ── AI generation (no DB writes — the teacher reviews first) ───────────────── */

export interface GenerateDraftInput {
  topicId: string;
  topicTitle: string;
  topicDescription: string | null;
  extraInstructions: string | null;
  wordCount: number;
}

/**
 * Drafts a vocabulary word set from the topic via OpenRouter. Writes nothing —
 * the words come back for the teacher to review, generate images for, and
 * publish. Gated by topic ownership.
 */
export async function generateVocabularyDraft(input: GenerateDraftInput): Promise<GenerateDraftResult> {
  const supabase = await createClient();
  const access = await requireTopicAccess(supabase, input.topicId);
  if (!access.ok) return { ok: false, error: access.error };

  const prompt = buildVocabularyPrompt({
    topicTitle: input.topicTitle,
    topicDescription: input.topicDescription,
    extraInstructions: input.extraInstructions,
    wordCount: clampWordCount(input.wordCount),
  });

  const result = await requestOpenRouterJson(prompt);
  if (!result.ok) return { ok: false, error: result.error };

  const words = parseGeneratedWords(extractJson(result.content));
  if (words.length === 0) {
    return { ok: false, error: "The AI didn't return any usable words. Try again." };
  }

  return { ok: true, words };
}

export interface GenerateImageInput {
  topicId: string;
  word: string;
  imagePrompt: string | null;
  /**
   * Skip the shared cache and generate a fresh image (used by the manual "AI"
   * button when the word already has an image — i.e. the teacher wants a
   * different one). Auto-generation leaves this off so common words reuse the
   * library for free.
   */
  forceRegenerate?: boolean;
}

/** Decodes a `data:` image URL into raw bytes for a server-side storage upload. */
function decodeDataUrl(dataUrl: string): { bytes: Buffer; contentType: string; ext: string } | null {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/.exec(dataUrl);
  if (!match) return null;
  const contentType = match[1];
  const ext = contentType === "image/jpeg" ? "jpg" : contentType === "image/webp" ? "webp" : "png";
  return { bytes: Buffer.from(match[2], "base64"), contentType, ext };
}

/**
 * Uploads a generated image (as a data URL) to the public `content/homework`
 * folder from the server and returns its public URL. Uses the request-scoped
 * client so storage RLS sees the teacher/admin caller — same folder and trust
 * level as {@link uploadContentImage} on the client.
 */
async function uploadWordImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  dataUrl: string
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const decoded = decodeDataUrl(dataUrl);
  if (!decoded) return { ok: false, error: "The generated image was unreadable. Try again." };

  const path = `homework/${crypto.randomUUID()}.${decoded.ext}`;
  const { error } = await supabase.storage
    .from(CONTENT_BUCKET)
    .upload(path, decoded.bytes, { contentType: decoded.contentType, upsert: false });
  if (error) return { ok: false, error: error.message };

  const { data } = supabase.storage.from(CONTENT_BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}

/**
 * Returns a flashcard illustration URL for one word. Reads through the shared
 * `vocab_image_cache` first (unless `forceRegenerate`): a cache hit reuses an
 * already-generated image for free, which is the whole cost optimisation —
 * common vocabulary words are only ever generated once. On a miss it generates
 * via FLUX, uploads to shared storage, and records the URL in the cache for
 * every future topic that uses the word. Returns a public storage URL (not a
 * data URL), so the client sets it straight onto the word with no publish-time
 * upload.
 */
export async function generateWordImage(input: GenerateImageInput): Promise<GenerateImageResult> {
  const supabase = await createClient();
  const access = await requireTopicAccess(supabase, input.topicId);
  if (!access.ok) return { ok: false, error: access.error };

  const word = String(input.word ?? "").trim();
  if (!word) return { ok: false, error: "Give the word before generating an image." };

  const key = normalizeWordKey(word);

  // Read-through cache — reuse a generated image unless a fresh one is asked for.
  if (!input.forceRegenerate && key) {
    const { data: cached } = await supabase
      .from("vocab_image_cache")
      .select("image_url")
      .eq("word_key", key)
      .maybeSingle();
    if (cached?.image_url) return { ok: true, imageUrl: cached.image_url };
  }

  const result = await requestOpenRouterImage(
    buildWordImagePrompt(word, input.imagePrompt),
    VOCAB_IMAGE_MODEL
  );
  if (!result.ok) return { ok: false, error: result.error };

  const upload = await uploadWordImage(supabase, result.dataUrl);
  if (!upload.ok) return { ok: false, error: upload.error };

  // Populate/refresh the shared library. A cache write failure is non-fatal —
  // the teacher still gets their image; the next request just regenerates.
  if (key) {
    const { error: cacheErr } = await supabase
      .from("vocab_image_cache")
      .upsert(
        { word_key: key, image_url: upload.url, updated_at: new Date().toISOString() },
        { onConflict: "word_key" }
      );
    if (cacheErr) console.warn("vocab_image_cache upsert failed:", cacheErr.message);
  }

  return { ok: true, imageUrl: upload.url };
}

/* ── Publish (replace the topic's whole vocabulary set + rebuild its test) ──── */

export interface PublishVocabularyInput {
  topicId: string;
  words: PublishWordInput[];
  /** How many test tasks to build from the words. */
  taskCount: number;
  /**
   * Test variant the teacher previewed. Threaded into {@link buildVocabTest} so
   * the published test matches exactly what the teacher saw and regenerated.
   * Defaults to the canonical variant.
   */
  testSeed?: number;
}

/**
 * Replaces the topic's vocabulary words and rebuilds its test in one shot: any
 * existing words/tasks are deleted, the new words inserted, and a deterministic
 * test of `taskCount` tasks generated from them. Existing pass records are left
 * intact — a student who already passed stays passed.
 */
export async function publishVocabulary(input: PublishVocabularyInput): Promise<VocabActionResult> {
  const supabase = await createClient();
  const access = await requireTopicAccess(supabase, input.topicId);
  if (!access.ok) return { ok: false, error: access.error };

  const words = (input.words ?? [])
    .map((w) => ({
      word: String(w.word ?? "").trim(),
      transcription: String(w.transcription ?? "").trim() || null,
      translation: String(w.translation ?? "").trim(),
      imageUrl: String(w.imageUrl ?? "").trim() || null,
    }))
    .filter((w) => w.word && w.translation);

  if (words.length === 0) {
    return { ok: false, error: "Add at least one word with a translation before publishing." };
  }

  // Replace: clear the existing set, then insert the new one.
  const { error: delWordsErr } = await supabase
    .from("homework_vocab_words")
    .delete()
    .eq("topic_id", input.topicId);
  if (delWordsErr) return { ok: false, error: delWordsErr.message };

  const { error: delTasksErr } = await supabase
    .from("homework_vocab_tasks")
    .delete()
    .eq("topic_id", input.topicId);
  if (delTasksErr) return { ok: false, error: delTasksErr.message };

  const { error: insWordsErr } = await supabase.from("homework_vocab_words").insert(
    words.map((w, index) => ({
      topic_id: input.topicId,
      word: w.word,
      transcription: w.transcription,
      translation: w.translation,
      image_url: w.imageUrl,
      order_index: index,
    }))
  );
  if (insWordsErr) return { ok: false, error: insWordsErr.message };

  const taskCount = Math.min(MAX_TASK_COUNT, Math.max(0, Math.round(input.taskCount)));
  const tasks = buildVocabTest(
    words.map((w) => ({ word: w.word, translation: w.translation, imageUrl: w.imageUrl })),
    taskCount,
    input.testSeed ?? 0
  );

  if (tasks.length > 0) {
    const { error: insTasksErr } = await supabase.from("homework_vocab_tasks").insert(
      tasks.map((t) => ({
        topic_id: input.topicId,
        task_type: t.taskType,
        content: t.content,
        order_index: t.orderIndex,
      }))
    );
    if (insTasksErr) return { ok: false, error: insTasksErr.message };
  }

  revalidateTopic(access.groupId, input.topicId);
  return { ok: true };
}

/** Removes a topic's entire vocabulary set (words + test). */
export async function clearVocabulary(topicId: string): Promise<VocabActionResult> {
  const supabase = await createClient();
  const access = await requireTopicAccess(supabase, topicId);
  if (!access.ok) return { ok: false, error: access.error };

  const { error: wErr } = await supabase.from("homework_vocab_words").delete().eq("topic_id", topicId);
  if (wErr) return { ok: false, error: wErr.message };
  const { error: tErr } = await supabase.from("homework_vocab_tasks").delete().eq("topic_id", topicId);
  if (tErr) return { ok: false, error: tErr.message };

  revalidateTopic(access.groupId, topicId);
  return { ok: true };
}
