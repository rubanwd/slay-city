/**
 * Image model used for all admin AI art (district backgrounds, location
 * icons). Gemini's image model renders stylised illustrated scenes well and
 * returns them inline as data URLs, which is what the admin preview needs
 * before anything is committed to storage.
 */
const OPENROUTER_MODEL = "google/gemini-2.5-flash-image";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/** Image generation is slow; fail loudly rather than hanging the admin's form. */
const REQUEST_TIMEOUT_MS = 90_000;

export type OpenRouterImageResult =
  | { ok: true; dataUrl: string }
  | { ok: false; error: string };

/** The subset of the OpenRouter response this helper reads. */
interface OpenRouterImageResponse {
  choices?: {
    message?: {
      images?: { image_url?: { url?: string } }[];
    };
  }[];
  error?: { message?: string };
}

/**
 * Sends one prompt to the OpenRouter image model and returns the generated
 * image as a data URL. Shared by the admin generation actions — the caller is
 * responsible for auth (requireAdmin) and input validation.
 */
export async function requestOpenRouterImage(prompt: string): Promise<OpenRouterImageResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Image generation is not configured on this server." };
  }

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

  return { ok: true, dataUrl };
}
