"use server";

import { normalizeWordKey } from "@/features/homework/vocabulary";
import { createClient } from "@/lib/supabase/server";

import { requestOpenRouterImage } from "./openRouterImage";
import { requireAdmin } from "./requireAdmin";
import { buildTaskImagePrompt, type TaskImagePromptInput } from "./taskImagePrompt";

const MAX_EXTRA_INSTRUCTIONS = 1000;

export type GenerateTaskImageResult =
  | { ok: true; cached: true; imageUrl: string }
  | { ok: true; cached: false; dataUrl: string; prompt: string }
  | { ok: false; error: string };

/**
 * Resolves a task illustration for `subject`, reusing the shared
 * `task_image_cache` before paying for generation — the same read-through
 * approach as {@link generateWordImage}. On a cache hit the stored public URL
 * is returned ready to use (no upload). On a miss the model generates a fresh
 * image, returned as a data URL for preview; the client uploads the picked
 * candidate and records it via {@link recordTaskImage} so the next request for
 * the same subject is free. Skipping the cache is possible with
 * `forceRegenerate` (the admin's "Regenerate" button).
 */
export async function generateTaskImage(
  input: TaskImagePromptInput & { forceRegenerate?: boolean }
): Promise<GenerateTaskImageResult> {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin.ok) return { ok: false, error: admin.error };

  const subject = String(input.subject ?? "").trim();
  if (!subject) {
    return { ok: false, error: "Fill in the word or answer first — the picture is built from it." };
  }

  const key = normalizeWordKey(subject);

  // Read-through cache — reuse a generated image unless a fresh one is asked for.
  if (!input.forceRegenerate && key) {
    const { data: cached } = await supabase
      .from("task_image_cache")
      .select("image_url")
      .eq("word_key", key)
      .maybeSingle();
    if (cached?.image_url) return { ok: true, cached: true, imageUrl: cached.image_url };
  }

  const prompt = buildTaskImagePrompt({
    subject,
    context: input.context ?? null,
    extraInstructions: String(input.extraInstructions ?? "").slice(0, MAX_EXTRA_INSTRUCTIONS),
  });

  const result = await requestOpenRouterImage(prompt);
  if (!result.ok) return result;

  return { ok: true, cached: false, dataUrl: result.dataUrl, prompt };
}

/**
 * Records a freshly uploaded task image in the shared cache so later requests
 * for the same subject reuse it. Best-effort: a failure here doesn't fail the
 * admin's save — the image is already applied, the next request just regenerates.
 */
export async function recordTaskImage(subject: string, imageUrl: string): Promise<void> {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin.ok) return;

  const key = normalizeWordKey(subject);
  if (!key || !imageUrl) return;

  const { error } = await supabase
    .from("task_image_cache")
    .upsert({ word_key: key, image_url: imageUrl, updated_at: new Date().toISOString() }, { onConflict: "word_key" });
  if (error) console.warn("task_image_cache upsert failed:", error.message);
}
