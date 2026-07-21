/**
 * Image model used for vocabulary flashcards. FLUX.1 [schnell] on Together AI
 * is a few-step distilled model that renders clean, kid-friendly flat
 * illustrations at a fraction of the cost of the Gemini image model the admin
 * scene art uses (~$0.003 vs ~$0.039 per image). The generation action caches
 * the result per word, so most words never hit this at all.
 */
const TOGETHER_MODEL = "black-forest-labs/FLUX.1-schnell";
const TOGETHER_URL = "https://api.together.xyz/v1/images/generations";

/** Square output — displayed as a flashcard thumbnail, so 1024² is plenty. */
const IMAGE_SIZE = 1024;
/** FLUX schnell is a distilled few-step model; 4 steps is its sweet spot. */
const STEPS = 4;

/** Image generation is slow; fail loudly rather than hanging the teacher's form. */
const REQUEST_TIMEOUT_MS = 60_000;

export type TogetherImageResult =
  | { ok: true; dataUrl: string }
  | { ok: false; error: string };

/** The subset of the Together images response this helper reads. */
interface TogetherImageResponse {
  data?: { b64_json?: string; url?: string }[];
  error?: { message?: string } | string;
}

function errorMessage(body: TogetherImageResponse, status: number): string {
  if (typeof body.error === "string") return body.error;
  return body.error?.message ?? `Image model error (${status}).`;
}

/** Fetches a returned image URL and re-encodes it as a data URL for upload. */
async function urlToDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "image/png";
    const buffer = Buffer.from(await res.arrayBuffer());
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * Sends one prompt to Together's FLUX schnell model and returns the generated
 * image as a data URL. Requests base64 directly; falls back to fetching a
 * returned URL if the account is configured to return links. The caller is
 * responsible for auth and for persisting the image.
 */
export async function requestFluxImage(prompt: string): Promise<TogetherImageResult> {
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Image generation is not configured on this server." };
  }

  let response: Response;
  try {
    response = await fetch(TOGETHER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: TOGETHER_MODEL,
        prompt,
        width: IMAGE_SIZE,
        height: IMAGE_SIZE,
        steps: STEPS,
        n: 1,
        response_format: "b64_json",
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      return { ok: false, error: "The image model took too long. Try again." };
    }
    return { ok: false, error: "Could not reach the image model. Check your connection." };
  }

  let body: TogetherImageResponse;
  try {
    body = (await response.json()) as TogetherImageResponse;
  } catch {
    return { ok: false, error: `Image model returned an unreadable response (${response.status}).` };
  }

  if (!response.ok) {
    return { ok: false, error: errorMessage(body, response.status) };
  }

  const first = body.data?.[0];
  if (first?.b64_json) {
    return { ok: true, dataUrl: `data:image/png;base64,${first.b64_json}` };
  }
  if (first?.url) {
    const dataUrl = await urlToDataUrl(first.url);
    if (dataUrl) return { ok: true, dataUrl };
  }
  return { ok: false, error: "The model did not return an image. Try regenerating." };
}
