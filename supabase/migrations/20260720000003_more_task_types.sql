-- Adds 10 more mission task types (counting, math, memory, timed reaction,
-- image reveal, rhyming, pattern completion, size comparison, letter fill-in,
-- and dialogue choice). Each is a client-rendered mini-game/test that runs off
-- the task's JSONB `content`; reward/progress logic is unchanged (still handled
-- server-side by complete_mission). New enum values only — the gameplay and
-- admin editors live in the frontend.
alter type public.mission_task_type add value if not exists 'counting_game';
alter type public.mission_task_type add value if not exists 'math_challenge';
alter type public.mission_task_type add value if not exists 'simon_sequence';
alter type public.mission_task_type add value if not exists 'reaction_tap';
alter type public.mission_task_type add value if not exists 'picture_reveal';
alter type public.mission_task_type add value if not exists 'rhyme_match';
alter type public.mission_task_type add value if not exists 'number_pattern';
alter type public.mission_task_type add value if not exists 'compare_size';
alter type public.mission_task_type add value if not exists 'letter_fill';
alter type public.mission_task_type add value if not exists 'dialogue_choice';
