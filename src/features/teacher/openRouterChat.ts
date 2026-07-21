/**
 * Text (JSON) generation via OpenRouter, the sibling of the admin
 * `openRouterImage` helper. Used to draft vocabulary word sets from a topic.
 * The API key lives only on the server (never shipped to the browser); callers
 * are responsible for auth (requireTeacher) and input validation.
 */
const OPENROUTER_MODEL = process.env.OPENROUTER_TEXT_MODEL || "google/gemini-2.5-flash";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/** Text generation is slow; fail loudly rather than hanging the teacher's form. */
const REQUEST_TIMEOUT_MS = 60_000;

export type OpenRouterChatResult = { ok: true; content: string } | { ok: false; error: string };

interface OpenRouterChatResponse {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
}

/**
 * Sends one prompt to the OpenRouter chat model and returns the raw text
 * content of the first choice. The caller parses/validates the payload.
 */
export async function requestOpenRouterJson(prompt: string): Promise<OpenRouterChatResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "AI generation is not configured on this server." };
  }

  let response: Response;
  try {
    response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "SLAY CITY Teacher",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      return { ok: false, error: "The AI model took too long. Try again." };
    }
    return { ok: false, error: "Could not reach the AI model. Check your connection." };
  }

  let body: OpenRouterChatResponse;
  try {
    body = (await response.json()) as OpenRouterChatResponse;
  } catch {
    return { ok: false, error: `AI model returned an unreadable response (${response.status}).` };
  }

  if (!response.ok) {
    return { ok: false, error: body.error?.message ?? `AI model error (${response.status}).` };
  }

  const content = body.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    return { ok: false, error: "The model returned no content. Try again." };
  }

  return { ok: true, content };
}

/**
 * Extracts a JSON object from a model response, tolerating markdown code
 * fences or leading/trailing prose the model may add despite instructions.
 * Returns `null` when nothing parseable is found.
 */
export function extractJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}
