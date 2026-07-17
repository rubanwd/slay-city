"use server";

import { createClient } from "@/lib/supabase/server";

import {
  buildMapBackgroundPrompt,
  type MapBackgroundLocation,
  type MapBackgroundPromptInput,
} from "./mapBackgroundPrompt";
import { requestOpenRouterImage } from "./openRouterImage";
import { requireAdmin } from "./requireAdmin";

const MAX_EXTRA_INSTRUCTIONS = 1000;
const MAX_LOCATIONS = 30;

export type GenerateMapBackgroundResult =
  | { ok: true; dataUrl: string; prompt: string }
  | { ok: false; error: string };

/**
 * Generates a district map background via OpenRouter and returns it as a data
 * URL for preview. Nothing is uploaded or saved here — the admin picks a
 * candidate first, and the client then uploads the chosen one to storage.
 *
 * The API key stays on the server. AGENTS.md routes AI calls through Supabase
 * Edge Functions; this one runs in a Next.js server action instead, matching
 * the other admin content actions in ./actions.ts and keeping the key in
 * `OPENROUTER_API_KEY` (Vercel env var). Deviation agreed with the project owner.
 */
export async function generateMapBackground(
  input: MapBackgroundPromptInput
): Promise<GenerateMapBackgroundResult> {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin.ok) return { ok: false, error: admin.error };

  const districtName = String(input.districtName ?? "").trim();
  if (!districtName) {
    return { ok: false, error: "Give the district a name before generating a background." };
  }

  const locations: MapBackgroundLocation[] = (input.locations ?? [])
    .slice(0, MAX_LOCATIONS)
    .map((loc) => ({ name: String(loc.name ?? ""), description: loc.description ?? null }));

  const extraInstructions = String(input.extraInstructions ?? "").slice(0, MAX_EXTRA_INSTRUCTIONS);

  const prompt = buildMapBackgroundPrompt({
    districtName,
    districtDescription: input.districtDescription ?? null,
    locations,
    extraInstructions,
  });

  const result = await requestOpenRouterImage(prompt);
  if (!result.ok) return result;

  return { ok: true, dataUrl: result.dataUrl, prompt };
}
