import {
  parseBubblePopContent,
  parseCategorySortContent,
  parseCrosswordContent,
  parseEmojiDecodeContent,
  parseFillBlankContent,
  parseFlashcardsContent,
  parseHangmanContent,
  parseMatchingContent,
  parseMemoryCardsContent,
  parseOddOneOutContent,
  parseQuizContent,
  parseSentenceBuilderContent,
  parseSnakeGameContent,
  parseSpellingBeeContent,
  parseStorySequencingContent,
  parseTrueFalseContent,
  parseVocabularyContent,
  parseWordScrambleContent,
  parseWordSearchContent,
} from "@/features/mission/types";
import type { MissionTaskType } from "@/features/mission/types";
import type { Json } from "@/types/database";

import {
  MatchingEditor,
  QuizEditor,
  SnakeGameEditor,
  VocabularyEditor,
} from "./coreEditors";
import {
  BubblePopEditor,
  EmojiDecodeEditor,
  OddOneOutEditor,
  TrueFalseEditor,
} from "./choiceEditors";
import type { TaskEditorProps } from "./fields";
import {
  CategorySortEditor,
  CrosswordEditor,
  MemoryCardsEditor,
  WordSearchEditor,
} from "./puzzleEditors";
import { FlashcardsEditor, StorySequencingEditor } from "./sequenceEditors";
import {
  FillBlankEditor,
  HangmanEditor,
  SentenceBuilderEditor,
  SpellingBeeEditor,
  WordScrambleEditor,
} from "./wordEditors";

export interface TaskEditorEntry {
  Editor: React.ComponentType<TaskEditorProps>;
  /** Returns non-null when `content` is valid for this type — drives the
   *  "start in raw mode" fallback when existing content can't be parsed. */
  parse: (content: Json) => unknown | null;
}

/**
 * Registry of guided content editors, keyed by task type. Any type absent here
 * (e.g. `listening`) has no guided form and falls back to the raw-JSON editor.
 */
export const TASK_EDITORS: Partial<Record<MissionTaskType, TaskEditorEntry>> = {
  vocabulary: { Editor: VocabularyEditor, parse: parseVocabularyContent },
  matching: { Editor: MatchingEditor, parse: parseMatchingContent },
  quiz: { Editor: QuizEditor, parse: parseQuizContent },
  snake_game: { Editor: SnakeGameEditor, parse: parseSnakeGameContent },
  word_scramble: { Editor: WordScrambleEditor, parse: parseWordScrambleContent },
  hangman: { Editor: HangmanEditor, parse: parseHangmanContent },
  bubble_pop: { Editor: BubblePopEditor, parse: parseBubblePopContent },
  memory_cards: { Editor: MemoryCardsEditor, parse: parseMemoryCardsContent },
  emoji_decode: { Editor: EmojiDecodeEditor, parse: parseEmojiDecodeContent },
  word_search: { Editor: WordSearchEditor, parse: parseWordSearchContent },
  crossword: { Editor: CrosswordEditor, parse: parseCrosswordContent },
  category_sort: { Editor: CategorySortEditor, parse: parseCategorySortContent },
  odd_one_out: { Editor: OddOneOutEditor, parse: parseOddOneOutContent },
  sentence_builder: { Editor: SentenceBuilderEditor, parse: parseSentenceBuilderContent },
  fill_blank: { Editor: FillBlankEditor, parse: parseFillBlankContent },
  spelling_bee: { Editor: SpellingBeeEditor, parse: parseSpellingBeeContent },
  true_false: { Editor: TrueFalseEditor, parse: parseTrueFalseContent },
  flashcards: { Editor: FlashcardsEditor, parse: parseFlashcardsContent },
  story_sequencing: { Editor: StorySequencingEditor, parse: parseStorySequencingContent },
};

export type { TaskEditorProps };
