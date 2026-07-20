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
  counting_game: "Counting Game",
  math_challenge: "Math Challenge",
  simon_sequence: "Simon Sequence",
  reaction_tap: "Speed Tap",
  picture_reveal: "Picture Reveal",
  rhyme_match: "Rhyme Match",
  number_pattern: "Pattern Puzzle",
  compare_size: "Bigger or Smaller",
  letter_fill: "Missing Letters",
  dialogue_choice: "Pick the Reply",
};

export function taskTypeLabel(taskType: MissionTaskType): string {
  return TASK_TYPE_LABELS[taskType] ?? taskType;
}

/** Short "how to play" text shown in the mission header's info tooltip, per type. */
const TASK_INSTRUCTIONS: Record<MissionTaskType, string> = {
  vocabulary: "Read the word, its translation, and the example sentence. Tap Next when you're ready.",
  matching: "Tap a word, then tap the picture or translation that goes with it. Match every pair to finish.",
  listening: "Listen to the audio, then answer the prompt. Tap Next to continue.",
  quiz: "Read the question and tap the answer you think is correct.",
  snake_game:
    "Use the arrows to steer the snake. Eat the letters in the word's order and avoid your own tail — you can pass through the edges.",
  word_scramble:
    "Tap the letters in the right order to spell the word. Tap a placed letter to send it back.",
  hangman:
    "Tap letters to guess the hidden word. Six wrong guesses ends the round and restarts it.",
  bubble_pop: "Tap every correct bubble and avoid the wrong ones. Pop them all to finish.",
  memory_cards:
    "Flip two cards at a time to find matching pairs. Matched pairs stay face-up until you find them all.",
  emoji_decode: "Read the emoji clue and tap the word it spells out.",
  word_search:
    "Find each word from the list. Tap its first letter, then its last letter — words run across, down, or diagonally, in any direction.",
  crossword:
    "Read the Across and Down clues and type a letter into each square, then tap Check.",
  category_sort:
    "Tap a word to pick it up, then tap the group it belongs to. Sort every word to finish.",
  odd_one_out: "Tap the one word that doesn't belong with the others.",
  sentence_builder:
    "Tap the words in the right order to build the sentence. Tap a placed word to send it back.",
  fill_blank: "Fill the gap in the sentence — tap the right word or type it — then tap Check.",
  spelling_bee: "Tap the speaker to hear the word, then type its spelling and tap Check.",
  true_false: "Decide whether the statement is true or false, then tap your answer.",
  flashcards: "Tap a card to flip it and see the answer. Step through every card to finish.",
  story_sequencing:
    "Use the up and down arrows to put the steps in the right order, then tap Check.",
  counting_game: "Count the objects, then tap the number that matches.",
  math_challenge: "Solve the equation and tap the correct answer.",
  simon_sequence: "Watch the tiles light up, then tap them back in the same order.",
  reaction_tap: "Tap every correct word before the timer runs out — avoid the wrong ones.",
  picture_reveal: "Tap Reveal to see more of the picture, then tap what it shows.",
  rhyme_match: "Tap the word that rhymes with the word shown.",
  number_pattern: "Figure out the pattern and tap what comes next.",
  compare_size: "Read the prompt and tap the correct one of the two.",
  letter_fill: "Tap the missing letters, in order, to complete the word.",
  dialogue_choice: "Read the line, then tap the best reply.",
};

export function taskTypeInstructions(taskType: MissionTaskType): string {
  return TASK_INSTRUCTIONS[taskType] ?? "";
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

function asNumberArray(value: Json | undefined): number[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
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

/* ── Second wave of new task type content shapes & parsers ─────────────────── */

export interface CountingGameContent {
  prompt: string;
  emoji: string;
  count: number;
  options: number[];
}

export function parseCountingGameContent(content: Json): CountingGameContent | null {
  if (!isRecord(content)) return null;
  const emoji = asString(content.emoji);
  const rawCount = asNumber(content.count);
  if (!emoji || rawCount === null) return null;
  const count = Math.round(rawCount);
  if (count < 1 || count > 30) return null;

  const options = Array.from(new Set(asNumberArray(content.options).map((n) => Math.round(n))));
  if (!options.includes(count)) options.push(count);
  if (options.length < 2) return null;

  return { prompt: asString(content.prompt) ?? "How many do you see?", emoji, count, options };
}

export interface MathChallengeContent {
  question: string;
  options: string[];
  correctIndex: number;
}

export function parseMathChallengeContent(content: Json): MathChallengeContent | null {
  if (!isRecord(content)) return null;
  const question = asString(content.question);
  const options = asStringArray(content.options);
  if (!question || options.length < 2) return null;

  const correctIndex =
    asNumber(content.correctIndex ?? content.correct_index) ?? -1;
  if (correctIndex < 0 || correctIndex >= options.length) return null;

  return { question, options, correctIndex };
}

export interface SimonSequenceContent {
  prompt: string;
  colors: string[];
  sequence: number[];
}

export function parseSimonSequenceContent(content: Json): SimonSequenceContent | null {
  if (!isRecord(content)) return null;
  const colors = asStringArray(content.colors).map((c) => c.trim()).filter(Boolean);
  if (colors.length < 2) return null;

  const sequence = asNumberArray(content.sequence)
    .map((n) => Math.round(n))
    .filter((n) => n >= 0 && n < colors.length);
  if (sequence.length < 2) return null;

  return {
    prompt: asString(content.prompt) ?? "Watch, then repeat the pattern",
    colors,
    sequence,
  };
}

export interface ReactionTapContent {
  prompt: string;
  correct: string[];
  distractors: string[];
  roundSeconds: number;
}

export function parseReactionTapContent(content: Json): ReactionTapContent | null {
  if (!isRecord(content)) return null;
  const correct = asStringArray(content.correct).map((s) => s.trim()).filter(Boolean);
  if (correct.length === 0) return null;

  const rawSeconds = asNumber(content.roundSeconds ?? content.round_seconds) ?? 15;
  const roundSeconds = Math.min(60, Math.max(5, Math.round(rawSeconds)));

  return {
    prompt: asString(content.prompt) ?? "Tap every correct word before time runs out!",
    correct,
    distractors: asStringArray(content.distractors).map((s) => s.trim()).filter(Boolean),
    roundSeconds,
  };
}

export interface PictureRevealContent {
  prompt: string;
  imageUrl: string;
  options: string[];
  correctIndex: number;
}

export function parsePictureRevealContent(content: Json): PictureRevealContent | null {
  if (!isRecord(content)) return null;
  const imageUrl = asString(content.imageUrl ?? content.image_url);
  const options = asStringArray(content.options);
  if (!imageUrl || options.length < 2) return null;

  const correctIndex = asNumber(content.correctIndex ?? content.correct_index) ?? -1;
  if (correctIndex < 0 || correctIndex >= options.length) return null;

  return {
    prompt: asString(content.prompt) ?? "What's in the picture?",
    imageUrl,
    options,
    correctIndex,
  };
}

export interface RhymeMatchContent {
  prompt: string;
  targetWord: string;
  options: string[];
  correctIndex: number;
}

export function parseRhymeMatchContent(content: Json): RhymeMatchContent | null {
  if (!isRecord(content)) return null;
  const targetWord = asString(content.targetWord ?? content.target_word)?.trim();
  const options = asStringArray(content.options);
  if (!targetWord || options.length < 2) return null;

  const correctIndex = asNumber(content.correctIndex ?? content.correct_index) ?? -1;
  if (correctIndex < 0 || correctIndex >= options.length) return null;

  return {
    prompt: asString(content.prompt) ?? `Which word rhymes with "${targetWord}"?`,
    targetWord,
    options,
    correctIndex,
  };
}

export interface NumberPatternContent {
  prompt: string;
  sequence: string[];
  blankIndex: number;
  options: string[];
  correctIndex: number;
}

export function parseNumberPatternContent(content: Json): NumberPatternContent | null {
  if (!isRecord(content)) return null;
  const sequence = asStringArray(content.sequence);
  if (sequence.length < 3) return null;

  const rawBlank = asNumber(content.blankIndex ?? content.blank_index);
  if (rawBlank === null) return null;
  const blankIndex = Math.round(rawBlank);
  if (blankIndex < 0 || blankIndex >= sequence.length) return null;

  const options = asStringArray(content.options);
  if (options.length < 2) return null;

  const correctIndex = asNumber(content.correctIndex ?? content.correct_index) ?? -1;
  if (correctIndex < 0 || correctIndex >= options.length) return null;

  return { prompt: asString(content.prompt) ?? "What comes next?", sequence, blankIndex, options, correctIndex };
}

export interface CompareSizeContent {
  prompt: string;
  optionA: string;
  optionB: string;
  imageUrlA: string | null;
  imageUrlB: string | null;
  correctOption: "a" | "b";
}

export function parseCompareSizeContent(content: Json): CompareSizeContent | null {
  if (!isRecord(content)) return null;
  const optionA = asString(content.optionA ?? content.option_a)?.trim();
  const optionB = asString(content.optionB ?? content.option_b)?.trim();
  if (!optionA || !optionB) return null;

  const rawCorrect = content.correctOption ?? content.correct_option;
  if (rawCorrect !== "a" && rawCorrect !== "b") return null;

  return {
    prompt: asString(content.prompt) ?? "Tap the correct one",
    optionA,
    optionB,
    imageUrlA: asString(content.imageUrlA ?? content.image_url_a),
    imageUrlB: asString(content.imageUrlB ?? content.image_url_b),
    correctOption: rawCorrect,
  };
}

export interface LetterFillContent {
  word: string;
  hint: string | null;
  translation: string | null;
}

export function parseLetterFillContent(content: Json): LetterFillContent | null {
  if (!isRecord(content)) return null;
  const raw = asString(content.word);
  const word = raw?.trim().toUpperCase();
  if (!word || word.length < 3 || !/[A-Z]/.test(word)) return null;
  return {
    word,
    hint: asString(content.hint),
    translation: asString(content.translation),
  };
}

export interface DialogueChoiceContent {
  prompt: string;
  speaker: string | null;
  options: string[];
  correctIndex: number;
  translation: string | null;
}

export function parseDialogueChoiceContent(content: Json): DialogueChoiceContent | null {
  if (!isRecord(content)) return null;
  const prompt = asString(content.prompt);
  const options = asStringArray(content.options);
  if (!prompt || options.length < 2) return null;

  const correctIndex = asNumber(content.correctIndex ?? content.correct_index) ?? -1;
  if (correctIndex < 0 || correctIndex >= options.length) return null;

  return {
    prompt,
    speaker: asString(content.speaker),
    options,
    correctIndex,
    translation: asString(content.translation),
  };
}
