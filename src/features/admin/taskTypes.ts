import type { MissionTaskType } from "@/features/mission/types";

export type { MissionTaskType };
export { taskTypeLabel } from "@/features/mission/types";

/** Selectable task types, in the order they appear in the admin dropdowns. */
export const TASK_TYPES: MissionTaskType[] = [
  "vocabulary",
  "matching",
  "listening",
  "quiz",
  "snake_game",
  "word_scramble",
  "hangman",
  "bubble_pop",
  "memory_cards",
  "emoji_decode",
  "word_search",
  "crossword",
  "category_sort",
  "odd_one_out",
  "sentence_builder",
  "fill_blank",
  "spelling_bee",
  "true_false",
  "flashcards",
  "story_sequencing",
  "counting_game",
  "math_challenge",
  "simon_sequence",
  "reaction_tap",
  "picture_reveal",
  "rhyme_match",
  "number_pattern",
  "compare_size",
  "letter_fill",
  "dialogue_choice",
];
