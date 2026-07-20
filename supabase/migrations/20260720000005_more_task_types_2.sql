-- Adds a second batch of 10 mission task types, leaning into cognitive and
-- developmental skills not yet covered: spatial reasoning, color theory,
-- working memory, emotional literacy, cause-and-effect reasoning, verbal
-- analogies, antonyms, size ordering, visual attention, and clock reading.
-- New enum values only — gameplay and admin editors live in the frontend.
alter type public.mission_task_type add value if not exists 'shape_match';
alter type public.mission_task_type add value if not exists 'color_mixing';
alter type public.mission_task_type add value if not exists 'digit_span';
alter type public.mission_task_type add value if not exists 'emotion_match';
alter type public.mission_task_type add value if not exists 'cause_effect';
alter type public.mission_task_type add value if not exists 'analogy';
alter type public.mission_task_type add value if not exists 'antonym_match';
alter type public.mission_task_type add value if not exists 'size_order';
alter type public.mission_task_type add value if not exists 'spot_the_difference';
alter type public.mission_task_type add value if not exists 'clock_reading';
