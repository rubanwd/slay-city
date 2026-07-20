import {
  parseAnalogyContent,
  parseAntonymMatchContent,
  parseBubblePopContent,
  parseCategorySortContent,
  parseCauseEffectContent,
  parseClockReadingContent,
  parseColorMixingContent,
  parseCompareSizeContent,
  parseCountingGameContent,
  parseCrosswordContent,
  parseDialogueChoiceContent,
  parseDigitSpanContent,
  parseEmojiDecodeContent,
  parseEmotionMatchContent,
  parseFillBlankContent,
  parseFlashcardsContent,
  parseHangmanContent,
  parseLetterFillContent,
  parseMathChallengeContent,
  parseMatchingContent,
  parseMemoryCardsContent,
  parseNumberPatternContent,
  parseOddOneOutContent,
  parsePictureRevealContent,
  parseQuizContent,
  parseReactionTapContent,
  parseRhymeMatchContent,
  parseSentenceBuilderContent,
  parseShapeMatchContent,
  parseSimonSequenceContent,
  parseSizeOrderContent,
  parseSnakeGameContent,
  parseSpellingBeeContent,
  parseSpotTheDifferenceContent,
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
import {
  AnalogyEditor,
  AntonymMatchEditor,
  CauseEffectEditor,
  ClockReadingEditor,
  ColorMixingEditor,
  DigitSpanEditor,
  EmotionMatchEditor,
  ShapeMatchEditor,
  SizeOrderEditor,
  SpotTheDifferenceEditor,
} from "./cognitiveEditors";
import type { TaskEditorProps } from "./fields";
import {
  CompareSizeEditor,
  CountingGameEditor,
  DialogueChoiceEditor,
  LetterFillEditor,
  MathChallengeEditor,
  NumberPatternEditor,
  PictureRevealEditor,
  ReactionTapEditor,
  RhymeMatchEditor,
  SimonSequenceEditor,
} from "./moreEditors";
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
  counting_game: { Editor: CountingGameEditor, parse: parseCountingGameContent },
  math_challenge: { Editor: MathChallengeEditor, parse: parseMathChallengeContent },
  simon_sequence: { Editor: SimonSequenceEditor, parse: parseSimonSequenceContent },
  reaction_tap: { Editor: ReactionTapEditor, parse: parseReactionTapContent },
  picture_reveal: { Editor: PictureRevealEditor, parse: parsePictureRevealContent },
  rhyme_match: { Editor: RhymeMatchEditor, parse: parseRhymeMatchContent },
  number_pattern: { Editor: NumberPatternEditor, parse: parseNumberPatternContent },
  compare_size: { Editor: CompareSizeEditor, parse: parseCompareSizeContent },
  letter_fill: { Editor: LetterFillEditor, parse: parseLetterFillContent },
  dialogue_choice: { Editor: DialogueChoiceEditor, parse: parseDialogueChoiceContent },
  shape_match: { Editor: ShapeMatchEditor, parse: parseShapeMatchContent },
  color_mixing: { Editor: ColorMixingEditor, parse: parseColorMixingContent },
  digit_span: { Editor: DigitSpanEditor, parse: parseDigitSpanContent },
  emotion_match: { Editor: EmotionMatchEditor, parse: parseEmotionMatchContent },
  cause_effect: { Editor: CauseEffectEditor, parse: parseCauseEffectContent },
  analogy: { Editor: AnalogyEditor, parse: parseAnalogyContent },
  antonym_match: { Editor: AntonymMatchEditor, parse: parseAntonymMatchContent },
  size_order: { Editor: SizeOrderEditor, parse: parseSizeOrderContent },
  spot_the_difference: { Editor: SpotTheDifferenceEditor, parse: parseSpotTheDifferenceContent },
  clock_reading: { Editor: ClockReadingEditor, parse: parseClockReadingContent },
};

export type { TaskEditorProps };
