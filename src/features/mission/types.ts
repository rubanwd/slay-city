import type { Database, Json } from "@/types/database";

/* ── Row & enum aliases ───────────────────────────────────────────────────── */
export type MissionTaskType = Database["public"]["Enums"]["mission_task_type"];

/**
 * The subset of a `mission_tasks` row the client needs to run a task.
 * Kept intentionally serializable so it can cross the server → client boundary.
 */
export interface MissionTaskViewModel {
  id: string;
  taskType: MissionTaskType;
  orderIndex: number;
  content: Json;
}

export interface MissionViewModel {
  id: string;
  title: string;
  description: string | null;
  xpReward: number;
  coinReward: number;
}

/* ── Task content shapes (parsed from `mission_tasks.content` JSONB) ───────── */

export interface VocabularyContent {
  word: string;
  translation: string;
  imageUrl: string | null;
  exampleSentence: string | null;
}

export type MatchingMode = "word-to-image" | "word-to-translation";

export interface MatchingPair {
  id: string;
  word: string;
  /** An image URL when mode is `word-to-image`, otherwise the translation text. */
  match: string;
}

export interface MatchingContent {
  prompt: string;
  mode: MatchingMode;
  pairs: MatchingPair[];
}

export interface QuizContent {
  question: string;
  imageUrl: string | null;
  options: string[];
  correctIndex: number;
}

export interface SnakeGameContent {
  /** Normalized to uppercase with whitespace stripped — one grid letter per char. */
  word: string;
  translation: string | null;
  prompt: string;
}

/* ── Defensive parsers ─────────────────────────────────────────────────────
 * `content` is untyped JSONB, so authored data may be malformed. Each parser
 * returns a well-formed value or `null`, and callers render a safe fallback
 * when parsing fails rather than crashing the mission run.
 * ───────────────────────────────────────────────────────────────────────── */

function isRecord(value: Json): value is { [key: string]: Json } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: Json | undefined): string | null {
  return typeof value === "string" ? value : null;
}

export function parseVocabularyContent(content: Json): VocabularyContent | null {
  if (!isRecord(content)) return null;
  const word = asString(content.word);
  const translation = asString(content.translation);
  if (!word || !translation) return null;
  return {
    word,
    translation,
    imageUrl: asString(content.imageUrl ?? content.image_url),
    exampleSentence: asString(content.exampleSentence ?? content.example_sentence),
  };
}

export function parseMatchingContent(content: Json): MatchingContent | null {
  if (!isRecord(content)) return null;
  const rawPairs = content.pairs;
  if (!Array.isArray(rawPairs) || rawPairs.length === 0) return null;

  const pairs: MatchingPair[] = [];
  rawPairs.forEach((raw, index) => {
    if (!isRecord(raw)) return;
    const word = asString(raw.word);
    const match = asString(raw.match);
    if (!word || !match) return;
    pairs.push({ id: asString(raw.id) ?? String(index), word, match });
  });
  if (pairs.length === 0) return null;

  const mode: MatchingMode =
    content.mode === "word-to-image" ? "word-to-image" : "word-to-translation";

  return {
    prompt: asString(content.prompt) ?? "Match the pairs",
    mode,
    pairs,
  };
}

export function parseQuizContent(content: Json): QuizContent | null {
  if (!isRecord(content)) return null;
  const question = asString(content.question);
  const rawOptions = content.options;
  if (!question || !Array.isArray(rawOptions)) return null;

  const options = rawOptions.filter((o): o is string => typeof o === "string");
  if (options.length < 2) return null;

  const correctIndex =
    typeof content.correctIndex === "number"
      ? content.correctIndex
      : typeof content.correct_index === "number"
        ? content.correct_index
        : -1;
  if (correctIndex < 0 || correctIndex >= options.length) return null;

  return {
    question,
    imageUrl: asString(content.imageUrl ?? content.image_url),
    options,
    correctIndex,
  };
}

export function parseSnakeGameContent(content: Json): SnakeGameContent | null {
  if (!isRecord(content)) return null;
  const rawWord = asString(content.word);
  if (!rawWord) return null;

  const word = rawWord.replace(/\s+/g, "").toUpperCase();
  if (word.length === 0) return null;

  return {
    word,
    translation: asString(content.translation),
    prompt: asString(content.prompt) ?? "Collect the letters in order",
  };
}
