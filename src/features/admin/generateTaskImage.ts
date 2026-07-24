"use server";

import { createClient } from "@/lib/supabase/server";

import { requestOpenRouterImage } from "./openRouterImage";
import { requireAdmin } from "./requireAdmin";
import { buildTaskImagePrompt, type TaskImagePromptInput } from "./taskImagePrompt";

const MAX_EXTRA_INSTRUCTIONS = 1000;

export type GenerateTaskImageResult =
  | { ok: true; dataUrl: string; prompt: string }
  | { ok: false; error: string };

/**
 * Generates a task illustration via OpenRouter and returns it as a data URL for
 * preview. Nothing is uploaded or saved here — the admin picks a candidate and
 * the client then uploads the chosen one to storage (same flow as
 * {@link generateLocationIcon}).
 */
export async function generateTaskImage(
  input: TaskImagePromptInput
): Promise<GenerateTaskImageResult> {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin.ok) return { ok: false, error: admin.error };

  const subject = String(input.subject ?? "").trim();
  if (!subject) {
    return { ok: false, error: "Fill in the word or answer first — the picture is built from it." };
  }

  const prompt = buildTaskImagePrompt({
    subject,
    context: input.context ?? null,
    extraInstructions: String(input.extraInstructions ?? "").slice(0, MAX_EXTRA_INSTRUCTIONS),
  });

  const result = await requestOpenRouterImage(prompt);
  if (!result.ok) return result;

  return { ok: true, dataUrl: result.dataUrl, prompt };
}
