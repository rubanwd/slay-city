"use server";

import { createClient } from "@/lib/supabase/server";

import {
  buildMapBackgroundPrompt,
  type MapBackgroundLocation,
  type MapBackgroundPromptInput,
} from "./mapBackgroundPrompt";
import { requireAdmin } from "./requireAdmin";

/**
 * Image model used for district backgrounds. Gemini's image model renders
 * stylised illustrated scenes well and returns them inline as data URLs, which
 * is what the admin preview needs before anything is committed to storage.
 */
const OPENROUTER_MODEL = "google/gemini-2.5-flash-image";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/** Image generation is slow; fail loudly rather than hanging the admin's form. */
const REQUEST_TIMEOUT_MS = 90_000;

const MAX_EXTRA_INSTRUCTIONS = 1000;
const MAX_LOCATIONS = 30;

export type GenerateMapBackgroundResult =
  | { ok: true; dataUrl: string; prompt: string }
  | { ok: false; error: string };

/** The subset of the OpenRouter response this action reads. */
interface OpenRouterImageResponse {
  choices?: {
    message?: {
      images?: { image_url?: { url?: string } }[];
    };
  }[];
  error?: { message?: string };
}

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

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Image generation is not configured on this server." };
  }

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

  let response: Response;
  try {
    response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // Optional OpenRouter attribution headers.
        "X-Title": "SLAY CITY Admin",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        modalities: ["image", "text"],
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      return { ok: false, error: "The image model took too long. Try again." };
    }
    return { ok: false, error: "Could not reach the image model. Check your connection." };
  }

  let body: OpenRouterImageResponse;
  try {
    body = (await response.json()) as OpenRouterImageResponse;
  } catch {
    return { ok: false, error: `Image model returned an unreadable response (${response.status}).` };
  }

  if (!response.ok) {
    // Surface OpenRouter's own message (bad key, no credit, rate limit) — it is
    // the only thing that tells the admin how to fix the problem.
    return { ok: false, error: body.error?.message ?? `Image model error (${response.status}).` };
  }

  const dataUrl = body.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!dataUrl?.startsWith("data:image/")) {
    return { ok: false, error: "The model did not return an image. Try regenerating." };
  }

  return { ok: true, dataUrl, prompt };
}
