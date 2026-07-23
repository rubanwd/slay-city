export interface TaskImagePromptInput {
  /** The word or answer the picture should depict, e.g. "Airport". */
  subject: string;
  /** Optional extra context, e.g. the mission topic or a translation. */
  context?: string | null;
  /** Free-form extra requirements typed by the admin. */
  extraInstructions?: string | null;
}

/** Collapses whitespace and trims — model input should not carry form artefacts. */
function clean(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

/**
 * Builds the OpenRouter prompt for a task's illustration (vocabulary card,
 * quiz picture, picture-reveal, flashcard, etc.). Aims for a bright, single
 * subject that reads instantly for young English learners — the twin of
 * {@link buildLocationIconPrompt}, but flashcard-style rather than map art.
 */
export function buildTaskImagePrompt(input: TaskImagePromptInput): string {
  const subject = clean(input.subject) || "the word";
  const context = clean(input.context);
  const extra = clean(input.extraInstructions);

  const lines = [
    `A bright, friendly illustration of "${subject}" for a children's English-learning flashcard.`,
    context ? `Context: ${context}.` : "",
    "One clear subject, centred, filling most of the frame, on a simple soft solid background.",
    "Style: cheerful rounded kids' cartoon, bold clean shapes, vibrant flat colours, soft shading.",
    "No text, letters, numbers, words, speech bubbles, watermarks, borders or UI.",
    extra ? `Extra art direction: ${extra}.` : "",
  ];

  return lines.filter(Boolean).join("\n");
}
