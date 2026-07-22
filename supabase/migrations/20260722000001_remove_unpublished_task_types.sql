-- SLAY CITY — remove the task types that were never published.
--
-- Seven task types (listening, math_challenge, number_pattern, compare_size,
-- shape_match, color_mixing, emotion_match) were left unpublished and are being
-- dropped from the product entirely — gameplay components, admin editors, and
-- content parsers are all removed on the frontend. This migration finishes the
-- job in the database: it purges any rows still using these types and then
-- removes the values from the `mission_task_type` enum.
--
-- Postgres cannot drop a value from an enum in place, so the type is recreated
-- without the seven values and every column keyed on it is re-pointed at the new
-- type. There are no defaults, views, or function signatures on this enum, so a
-- straight rename → recreate → re-point → drop is safe.

-- 1. Purge every row using a removed type, across all tables keyed on the enum.
--    (mission_tasks reruns still complete cleanly; a mission just has fewer tasks.)
delete from public.mission_tasks
where task_type in (
  'listening', 'math_challenge', 'number_pattern', 'compare_size',
  'shape_match', 'color_mixing', 'emotion_match'
);

delete from public.task_type_templates
where task_type in (
  'listening', 'math_challenge', 'number_pattern', 'compare_size',
  'shape_match', 'color_mixing', 'emotion_match'
);

delete from public.homework_vocab_tasks
where task_type in (
  'listening', 'math_challenge', 'number_pattern', 'compare_size',
  'shape_match', 'color_mixing', 'emotion_match'
);

delete from public.homework_grammar_tasks
where task_type in (
  'listening', 'math_challenge', 'number_pattern', 'compare_size',
  'shape_match', 'color_mixing', 'emotion_match'
);

-- 2. Recreate the enum without the removed values.
alter type public.mission_task_type rename to mission_task_type__old;

create type public.mission_task_type as enum (
  'vocabulary',
  'matching',
  'quiz',
  'snake_game',
  'word_scramble',
  'hangman',
  'bubble_pop',
  'memory_cards',
  'emoji_decode',
  'word_search',
  'crossword',
  'category_sort',
  'odd_one_out',
  'sentence_builder',
  'fill_blank',
  'spelling_bee',
  'true_false',
  'flashcards',
  'story_sequencing',
  'counting_game',
  'simon_sequence',
  'reaction_tap',
  'picture_reveal',
  'rhyme_match',
  'letter_fill',
  'dialogue_choice',
  'digit_span',
  'cause_effect',
  'analogy',
  'antonym_match',
  'size_order',
  'spot_the_difference',
  'clock_reading'
);

-- 3. Re-point every column at the new type (text bridge maps by value).
alter table public.mission_tasks
  alter column task_type type public.mission_task_type
  using task_type::text::public.mission_task_type;

alter table public.task_type_templates
  alter column task_type type public.mission_task_type
  using task_type::text::public.mission_task_type;

alter table public.homework_vocab_tasks
  alter column task_type type public.mission_task_type
  using task_type::text::public.mission_task_type;

alter table public.homework_grammar_tasks
  alter column task_type type public.mission_task_type
  using task_type::text::public.mission_task_type;

-- 4. Drop the old type.
drop type public.mission_task_type__old;
