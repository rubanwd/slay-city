-- Adds 15 new mission task types. Each is a client-rendered mini-game or test
-- that runs off the task's JSONB `content`; reward/progress logic is unchanged
-- (still handled server-side by complete_mission). New enum values only — the
-- gameplay and admin editors live in the frontend.
alter type public.mission_task_type add value if not exists 'word_scramble';
alter type public.mission_task_type add value if not exists 'hangman';
alter type public.mission_task_type add value if not exists 'bubble_pop';
alter type public.mission_task_type add value if not exists 'memory_cards';
alter type public.mission_task_type add value if not exists 'emoji_decode';
alter type public.mission_task_type add value if not exists 'word_search';
alter type public.mission_task_type add value if not exists 'crossword';
alter type public.mission_task_type add value if not exists 'category_sort';
alter type public.mission_task_type add value if not exists 'odd_one_out';
alter type public.mission_task_type add value if not exists 'sentence_builder';
alter type public.mission_task_type add value if not exists 'fill_blank';
alter type public.mission_task_type add value if not exists 'spelling_bee';
alter type public.mission_task_type add value if not exists 'true_false';
alter type public.mission_task_type add value if not exists 'flashcards';
alter type public.mission_task_type add value if not exists 'story_sequencing';
