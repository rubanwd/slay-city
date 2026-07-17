"use server";

import { createClient } from "@/lib/supabase/server";

import { buildLocationIconPrompt, type LocationIconPromptInput } from "./locationIconPrompt";
import { requestOpenRouterImage } from "./openRouterImage";
import { requireAdmin } from "./requireAdmin";

const MAX_EXTRA_INSTRUCTIONS = 1000;

export type GenerateLocationIconResult =
  | { ok: true; dataUrl: string; prompt: string }
  | { ok: false; error: string };

/**
 * Generates a location map icon via OpenRouter and returns it as a data URL
 * for preview. Nothing is uploaded or saved here — the admin picks a candidate
 * first, and the client then uploads the chosen one to storage (same flow as
 * {@link generateMapBackground}).
 */
export async function generateLocationIcon(
  input: LocationIconPromptInput
): Promise<GenerateLocationIconResult> {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin.ok) return { ok: false, error: admin.error };

  const locationName = String(input.locationName ?? "").trim();
  if (!locationName) {
    return { ok: false, error: "Give the location a name before generating an icon." };
  }

  const prompt = buildLocationIconPrompt({
    districtName: String(input.districtName ?? "").trim(),
    locationName,
    locationDescription: input.locationDescription ?? null,
    extraInstructions: String(input.extraInstructions ?? "").slice(0, MAX_EXTRA_INSTRUCTIONS),
  });

  const result = await requestOpenRouterImage(prompt);
  if (!result.ok) return result;

  return { ok: true, dataUrl: result.dataUrl, prompt };
}
