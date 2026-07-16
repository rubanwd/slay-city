-- Adds the "snake_game" mission task type: a Snake mini-game where the child
-- collects the letters of an authored word in order.
alter type public.mission_task_type add value if not exists 'snake_game';
