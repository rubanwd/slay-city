"use client";

import { SlayButton } from "@/components/ui";
import type { Json } from "@/types/database";

import AnalogyTask from "./AnalogyTask";
import AntonymMatchTask from "./AntonymMatchTask";
import BubblePopTask from "./BubblePopTask";
import CategorySortTask from "./CategorySortTask";
import CauseEffectTask from "./CauseEffectTask";
import ClockReadingTask from "./ClockReadingTask";
import CountingGameTask from "./CountingGameTask";
import CrosswordTask from "./CrosswordTask";
import DialogueChoiceTask from "./DialogueChoiceTask";
import EmojiDecodeTask from "./EmojiDecodeTask";
import FillBlankTask from "./FillBlankTask";
import FlashcardsTask from "./FlashcardsTask";
import HangmanTask from "./HangmanTask";
import LetterFillTask from "./LetterFillTask";
import MatchingTask from "./MatchingTask";
import MemoryCardsTask from "./MemoryCardsTask";
import OddOneOutTask from "./OddOneOutTask";
import PictureRevealTask from "./PictureRevealTask";
import QuizTask from "./QuizTask";
import ReactionTapTask from "./ReactionTapTask";
import RhymeMatchTask from "./RhymeMatchTask";
import SentenceBuilderTask from "./SentenceBuilderTask";
import SimonSequenceTask from "./SimonSequenceTask";
import SizeOrderTask from "./SizeOrderTask";
import SnakeGameTask from "./SnakeGameTask";
import SpellingBeeTask from "./SpellingBeeTask";
import SpotTheDifferenceTask from "./SpotTheDifferenceTask";
import StorySequencingTask from "./StorySequencingTask";
import TrueFalseTask from "./TrueFalseTask";
import VocabularyTask from "./VocabularyTask";
import WordScrambleTask from "./WordScrambleTask";
import WordSearchTask from "./WordSearchTask";
import {
  parseAnalogyContent,
  parseAntonymMatchContent,
  parseBubblePopContent,
  parseCategorySortContent,
  parseCauseEffectContent,
  parseClockReadingContent,
  parseCountingGameContent,
  parseCrosswordContent,
  parseDialogueChoiceContent,
  parseEmojiDecodeContent,
  parseFillBlankContent,
  parseFlashcardsContent,
  parseHangmanContent,
  parseLetterFillContent,
  parseMatchingContent,
  parseMemoryCardsContent,
  parseOddOneOutContent,
  parsePictureRevealContent,
  parseQuizContent,
  parseReactionTapContent,
  parseRhymeMatchContent,
  parseSentenceBuilderContent,
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
  type MissionTaskType,
} from "./types";

export interface TaskRunnerProps {
  taskType: MissionTaskType;
  /** Raw JSONB content, parsed here by the same parser the type uses everywhere. */
  content: Json;
  /**
   * Called when the task is done. Most task types report full credit
   * implicitly; a task that can be moved on from early (like the Snake game)
   * passes a 0–1 score for how much of it was actually completed.
   */
  onComplete: (score?: number) => void;
  actionLabel: string;
}

/**
 * Parses a task's JSONB content and renders the matching gameplay component,
 * falling back to a skip card when the type is unknown or the content is
 * malformed. Shared by the live mission runner and the admin task-type tester so
 * both play a task exactly the same way.
 */
export default function TaskRunner({ taskType, content, onComplete, actionLabel }: TaskRunnerProps) {
  const rendered = renderTaskByType(taskType, content, onComplete, actionLabel);
  return rendered ?? <UnsupportedTask onComplete={onComplete} actionLabel={actionLabel} />;
}

/**
 * Returns a task's gameplay component, or `null` when the type is unknown or the
 * content is malformed (the caller then shows a skip card). Each branch narrows
 * on `taskType` and bails on a failed parse so a single bad task never blocks the
 * whole mission run.
 */
function renderTaskByType(
  taskType: MissionTaskType,
  rawContent: Json,
  onComplete: (score?: number) => void,
  actionLabel: string
): React.ReactElement | null {
  const props = { onComplete, actionLabel };
  switch (taskType) {
    case "vocabulary": {
      const content = parseVocabularyContent(rawContent);
      return content ? <VocabularyTask content={content} {...props} /> : null;
    }
    case "matching": {
      const content = parseMatchingContent(rawContent);
      return content ? <MatchingTask content={content} {...props} /> : null;
    }
    case "quiz": {
      const content = parseQuizContent(rawContent);
      return content ? <QuizTask content={content} {...props} /> : null;
    }
    case "snake_game": {
      const content = parseSnakeGameContent(rawContent);
      return content ? <SnakeGameTask content={content} {...props} /> : null;
    }
    case "word_scramble": {
      const content = parseWordScrambleContent(rawContent);
      return content ? <WordScrambleTask content={content} {...props} /> : null;
    }
    case "hangman": {
      const content = parseHangmanContent(rawContent);
      return content ? <HangmanTask content={content} {...props} /> : null;
    }
    case "bubble_pop": {
      const content = parseBubblePopContent(rawContent);
      return content ? <BubblePopTask content={content} {...props} /> : null;
    }
    case "memory_cards": {
      const content = parseMemoryCardsContent(rawContent);
      return content ? <MemoryCardsTask content={content} {...props} /> : null;
    }
    case "emoji_decode": {
      const content = parseEmojiDecodeContent(rawContent);
      return content ? <EmojiDecodeTask content={content} {...props} /> : null;
    }
    case "word_search": {
      const content = parseWordSearchContent(rawContent);
      return content ? <WordSearchTask content={content} {...props} /> : null;
    }
    case "crossword": {
      const content = parseCrosswordContent(rawContent);
      return content ? <CrosswordTask content={content} {...props} /> : null;
    }
    case "category_sort": {
      const content = parseCategorySortContent(rawContent);
      return content ? <CategorySortTask content={content} {...props} /> : null;
    }
    case "odd_one_out": {
      const content = parseOddOneOutContent(rawContent);
      return content ? <OddOneOutTask content={content} {...props} /> : null;
    }
    case "sentence_builder": {
      const content = parseSentenceBuilderContent(rawContent);
      return content ? <SentenceBuilderTask content={content} {...props} /> : null;
    }
    case "fill_blank": {
      const content = parseFillBlankContent(rawContent);
      return content ? <FillBlankTask content={content} {...props} /> : null;
    }
    case "spelling_bee": {
      const content = parseSpellingBeeContent(rawContent);
      return content ? <SpellingBeeTask content={content} {...props} /> : null;
    }
    case "true_false": {
      const content = parseTrueFalseContent(rawContent);
      return content ? <TrueFalseTask content={content} {...props} /> : null;
    }
    case "flashcards": {
      const content = parseFlashcardsContent(rawContent);
      return content ? <FlashcardsTask content={content} {...props} /> : null;
    }
    case "story_sequencing": {
      const content = parseStorySequencingContent(rawContent);
      return content ? <StorySequencingTask content={content} {...props} /> : null;
    }
    case "counting_game": {
      const content = parseCountingGameContent(rawContent);
      return content ? <CountingGameTask content={content} {...props} /> : null;
    }
    case "simon_sequence": {
      const content = parseSimonSequenceContent(rawContent);
      return content ? <SimonSequenceTask content={content} {...props} /> : null;
    }
    case "reaction_tap": {
      const content = parseReactionTapContent(rawContent);
      return content ? <ReactionTapTask content={content} {...props} /> : null;
    }
    case "picture_reveal": {
      const content = parsePictureRevealContent(rawContent);
      return content ? <PictureRevealTask content={content} {...props} /> : null;
    }
    case "rhyme_match": {
      const content = parseRhymeMatchContent(rawContent);
      return content ? <RhymeMatchTask content={content} {...props} /> : null;
    }
    case "letter_fill": {
      const content = parseLetterFillContent(rawContent);
      return content ? <LetterFillTask content={content} {...props} /> : null;
    }
    case "dialogue_choice": {
      const content = parseDialogueChoiceContent(rawContent);
      return content ? <DialogueChoiceTask content={content} {...props} /> : null;
    }
    case "cause_effect": {
      const content = parseCauseEffectContent(rawContent);
      return content ? <CauseEffectTask content={content} {...props} /> : null;
    }
    case "analogy": {
      const content = parseAnalogyContent(rawContent);
      return content ? <AnalogyTask content={content} {...props} /> : null;
    }
    case "antonym_match": {
      const content = parseAntonymMatchContent(rawContent);
      return content ? <AntonymMatchTask content={content} {...props} /> : null;
    }
    case "size_order": {
      const content = parseSizeOrderContent(rawContent);
      return content ? <SizeOrderTask content={content} {...props} /> : null;
    }
    case "spot_the_difference": {
      const content = parseSpotTheDifferenceContent(rawContent);
      return content ? <SpotTheDifferenceTask content={content} {...props} /> : null;
    }
    case "clock_reading": {
      const content = parseClockReadingContent(rawContent);
      return content ? <ClockReadingTask content={content} {...props} /> : null;
    }
    default:
      return null;
  }
}

function UnsupportedTask({
  onComplete,
  actionLabel,
}: {
  onComplete: () => void;
  actionLabel: string;
}) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <p className="text-white/60">This task type isn&apos;t available yet — skip ahead.</p>
      <SlayButton variant="green" size="lg" className="w-full" onClick={onComplete}>
        {actionLabel}
      </SlayButton>
    </div>
  );
}
