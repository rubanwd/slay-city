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

const TASK_TYPE_LABELS: Record<MissionTaskType, string> = {
  vocabulary: "Vocabulary",
  matching: "Matching",
  listening: "Listening",
  quiz: "Quiz",
  snake_game: "Play Snake Game",
  word_scramble: "Word Scramble",
  hangman: "Hangman",
  bubble_pop: "Bubble Pop",
  memory_cards: "Memory Cards",
  emoji_decode: "Emoji Decode",
  word_search: "Word Search",
  crossword: "Crossword",
  category_sort: "Category Sort",
  odd_one_out: "Odd One Out",
  sentence_builder: "Sentence Builder",
  fill_blank: "Fill in the Blank",
  spelling_bee: "Spelling Bee",
  true_false: "True or False",
  flashcards: "Flashcards",
  story_sequencing: "Story Sequencing",
};

export function taskTypeLabel(taskType: MissionTaskType): string {
  return TASK_TYPE_LABELS[taskType] ?? taskType;
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

function asNumber(value: Json | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asBoolean(value: Json | undefined): boolean {
  return value === true;
}

function asStringArray(value: Json | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
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

/* ── New task type content shapes & parsers ────────────────────────────────── */

export interface WordScrambleContent {
  word: string;
  translation: string | null;
  hint: string | null;
  imageUrl: string | null;
}

export function parseWordScrambleContent(content: Json): WordScrambleContent | null {
  if (!isRecord(content)) return null;
  const raw = asString(content.word);
  const word = raw?.trim().toUpperCase();
  if (!word) return null;
  return {
    word,
    translation: asString(content.translation),
    hint: asString(content.hint),
    imageUrl: asString(content.imageUrl ?? content.image_url),
  };
}

export interface HangmanContent {
  word: string;
  hint: string | null;
  translation: string | null;
}

export function parseHangmanContent(content: Json): HangmanContent | null {
  if (!isRecord(content)) return null;
  const raw = asString(content.word);
  const word = raw?.trim().toUpperCase();
  if (!word || !/[A-Z]/.test(word)) return null;
  return {
    word,
    hint: asString(content.hint),
    translation: asString(content.translation),
  };
}

export interface BubblePopContent {
  prompt: string;
  correct: string[];
  distractors: string[];
}

export function parseBubblePopContent(content: Json): BubblePopContent | null {
  if (!isRecord(content)) return null;
  const correct = asStringArray(content.correct).map((s) => s.trim()).filter(Boolean);
  if (correct.length === 0) return null;
  return {
    prompt: asString(content.prompt) ?? "Pop the correct bubbles",
    correct,
    distractors: asStringArray(content.distractors).map((s) => s.trim()).filter(Boolean),
  };
}

export type MemoryMode = "word-to-translation" | "word-to-image";

export interface MemoryPair {
  id: string;
  word: string;
  /** Image URL when mode is `word-to-image`, otherwise the translation text. */
  match: string;
}

export interface MemoryCardsContent {
  prompt: string;
  mode: MemoryMode;
  pairs: MemoryPair[];
}

export function parseMemoryCardsContent(content: Json): MemoryCardsContent | null {
  if (!isRecord(content)) return null;
  const rawPairs = content.pairs;
  if (!Array.isArray(rawPairs)) return null;

  const pairs: MemoryPair[] = [];
  rawPairs.forEach((raw, index) => {
    if (!isRecord(raw)) return;
    const word = asString(raw.word);
    const match = asString(raw.match);
    if (!word || !match) return;
    pairs.push({ id: asString(raw.id) ?? String(index), word, match });
  });
  if (pairs.length < 2) return null;

  const mode: MemoryMode =
    content.mode === "word-to-image" ? "word-to-image" : "word-to-translation";

  return { prompt: asString(content.prompt) ?? "Find the pairs", mode, pairs };
}

export interface EmojiDecodeContent {
  emojis: string;
  options: string[];
  correctIndex: number;
  translation: string | null;
}

export function parseEmojiDecodeContent(content: Json): EmojiDecodeContent | null {
  if (!isRecord(content)) return null;
  const emojis = asString(content.emojis);
  const options = asStringArray(content.options);
  if (!emojis || options.length < 2) return null;
  const correctIndex = asNumber(content.correctIndex ?? content.correct_index) ?? -1;
  if (correctIndex < 0 || correctIndex >= options.length) return null;
  return { emojis, options, correctIndex, translation: asString(content.translation) };
}

export interface WordSearchContent {
  prompt: string;
  words: string[];
  size: number;
}

export function parseWordSearchContent(content: Json): WordSearchContent | null {
  if (!isRecord(content)) return null;
  const words = asStringArray(content.words)
    .map((w) => w.replace(/\s+/g, "").toUpperCase())
    .filter((w) => w.length >= 2);
  if (words.length === 0) return null;
  const longest = words.reduce((max, w) => Math.max(max, w.length), 0);
  const rawSize = asNumber(content.size) ?? longest + 2;
  const size = Math.min(14, Math.max(longest, Math.round(rawSize)));
  return { prompt: asString(content.prompt) ?? "Find the hidden words", words, size };
}

export type CrosswordDirection = "across" | "down";

export interface CrosswordEntry {
  answer: string;
  clue: string;
  row: number;
  col: number;
  direction: CrosswordDirection;
}

export interface CrosswordContent {
  prompt: string;
  entries: CrosswordEntry[];
}

export function parseCrosswordContent(content: Json): CrosswordContent | null {
  if (!isRecord(content)) return null;
  const rawEntries = content.entries;
  if (!Array.isArray(rawEntries)) return null;

  const entries: CrosswordEntry[] = [];
  rawEntries.forEach((raw) => {
    if (!isRecord(raw)) return;
    const answer = asString(raw.answer)?.replace(/\s+/g, "").toUpperCase();
    const clue = asString(raw.clue);
    const row = asNumber(raw.row);
    const col = asNumber(raw.col);
    const direction: CrosswordDirection = raw.direction === "down" ? "down" : "across";
    if (!answer || !clue || row === null || col === null || row < 0 || col < 0) return;
    entries.push({ answer, clue, row: Math.round(row), col: Math.round(col), direction });
  });
  if (entries.length === 0) return null;

  return { prompt: asString(content.prompt) ?? "Solve the crossword", entries };
}

export interface CategorySortItem {
  text: string;
  categoryIndex: number;
}

export interface CategorySortContent {
  prompt: string;
  categories: string[];
  items: CategorySortItem[];
}

export function parseCategorySortContent(content: Json): CategorySortContent | null {
  if (!isRecord(content)) return null;
  const categories = asStringArray(content.categories).map((c) => c.trim()).filter(Boolean);
  if (categories.length < 2) return null;

  const rawItems = content.items;
  if (!Array.isArray(rawItems)) return null;
  const items: CategorySortItem[] = [];
  rawItems.forEach((raw) => {
    if (!isRecord(raw)) return;
    const text = asString(raw.text);
    const categoryIndex = asNumber(raw.categoryIndex ?? raw.category_index);
    if (!text || categoryIndex === null) return;
    if (categoryIndex < 0 || categoryIndex >= categories.length) return;
    items.push({ text, categoryIndex: Math.round(categoryIndex) });
  });
  if (items.length === 0) return null;

  return { prompt: asString(content.prompt) ?? "Sort into the right group", categories, items };
}

export interface OddOneOutContent {
  prompt: string;
  words: string[];
  oddIndex: number;
}

export function parseOddOneOutContent(content: Json): OddOneOutContent | null {
  if (!isRecord(content)) return null;
  const words = asStringArray(content.words).map((w) => w.trim()).filter(Boolean);
  if (words.length < 3) return null;
  const oddIndex = asNumber(content.oddIndex ?? content.odd_index) ?? -1;
  if (oddIndex < 0 || oddIndex >= words.length) return null;
  return { prompt: asString(content.prompt) ?? "Which one doesn't belong?", words, oddIndex };
}

export interface SentenceBuilderContent {
  prompt: string;
  words: string[];
  translation: string | null;
}

export function parseSentenceBuilderContent(content: Json): SentenceBuilderContent | null {
  if (!isRecord(content)) return null;
  const words = asStringArray(content.words).map((w) => w.trim()).filter(Boolean);
  if (words.length < 2) return null;
  return {
    prompt: asString(content.prompt) ?? "Put the words in order",
    words,
    translation: asString(content.translation),
  };
}

export interface FillBlankContent {
  sentence: string;
  answer: string;
  options: string[];
  translation: string | null;
}

export function parseFillBlankContent(content: Json): FillBlankContent | null {
  if (!isRecord(content)) return null;
  const sentence = asString(content.sentence);
  const answer = asString(content.answer)?.trim();
  if (!sentence || !answer) return null;
  return {
    sentence,
    answer,
    options: asStringArray(content.options).map((o) => o.trim()).filter(Boolean),
    translation: asString(content.translation),
  };
}

export interface SpellingBeeContent {
  word: string;
  audioUrl: string | null;
  translation: string | null;
  prompt: string;
}

export function parseSpellingBeeContent(content: Json): SpellingBeeContent | null {
  if (!isRecord(content)) return null;
  const word = asString(content.word)?.trim();
  if (!word) return null;
  return {
    word,
    audioUrl: asString(content.audioUrl ?? content.audio_url),
    translation: asString(content.translation),
    prompt: asString(content.prompt) ?? "Listen and spell the word",
  };
}

export interface TrueFalseContent {
  statement: string;
  isTrue: boolean;
  imageUrl: string | null;
}

export function parseTrueFalseContent(content: Json): TrueFalseContent | null {
  if (!isRecord(content)) return null;
  const statement = asString(content.statement);
  if (!statement) return null;
  return {
    statement,
    isTrue: asBoolean(content.isTrue ?? content.is_true),
    imageUrl: asString(content.imageUrl ?? content.image_url),
  };
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  imageUrl: string | null;
}

export interface FlashcardsContent {
  prompt: string;
  cards: Flashcard[];
}

export function parseFlashcardsContent(content: Json): FlashcardsContent | null {
  if (!isRecord(content)) return null;
  const rawCards = content.cards;
  if (!Array.isArray(rawCards)) return null;
  const cards: Flashcard[] = [];
  rawCards.forEach((raw, index) => {
    if (!isRecord(raw)) return;
    const front = asString(raw.front);
    const back = asString(raw.back);
    if (!front || !back) return;
    cards.push({
      id: asString(raw.id) ?? String(index),
      front,
      back,
      imageUrl: asString(raw.imageUrl ?? raw.image_url),
    });
  });
  if (cards.length === 0) return null;
  return { prompt: asString(content.prompt) ?? "Flip through the cards", cards };
}

export interface StoryStep {
  id: string;
  text: string;
  imageUrl: string | null;
}

export interface StorySequencingContent {
  prompt: string;
  steps: StoryStep[];
}

export function parseStorySequencingContent(content: Json): StorySequencingContent | null {
  if (!isRecord(content)) return null;
  const rawSteps = content.steps;
  if (!Array.isArray(rawSteps)) return null;
  const steps: StoryStep[] = [];
  rawSteps.forEach((raw, index) => {
    if (!isRecord(raw)) return;
    const text = asString(raw.text);
    if (!text) return;
    steps.push({
      id: asString(raw.id) ?? String(index),
      text,
      imageUrl: asString(raw.imageUrl ?? raw.image_url),
    });
  });
  if (steps.length < 2) return null;
  return { prompt: asString(content.prompt) ?? "Put the story in order", steps };
}
