-- SLAY CITY — seed example content for the second batch of 10 task types added
-- in 20260720000005, all published so they're immediately playable from
-- /admin/task-types and immediately selectable when authoring mission tasks.
--
-- NOTE: run 20260720000005 (enum values) before this file — Postgres cannot use
-- a newly added enum value in the same transaction that created it.

insert into public.task_type_templates (task_type, content, is_published)
values
  ('shape_match',
   '{"prompt":"Tap the shape that matches","targetShape":"★","options":["★","●","■"],"correctIndex":0}'::jsonb, true),
  ('color_mixing',
   '{"prompt":"What color do these make together?","colorA":"Red","hexA":"#FF3B3B","colorB":"Blue","hexB":"#3B82F6","options":["Purple","Green","Orange"],"correctIndex":0}'::jsonb, true),
  ('digit_span',
   '{"prompt":"Watch the numbers, then repeat them","digits":[4,7,2,9]}'::jsonb, true),
  ('emotion_match',
   '{"prompt":"How does this feel?","emoji":"😄","options":["Happy","Sad","Angry"],"correctIndex":0}'::jsonb, true),
  ('cause_effect',
   '{"cause":"You touch a hot stove.","options":["You feel pain","You feel happy","You fall asleep"],"correctIndex":0}'::jsonb, true),
  ('analogy',
   '{"wordA":"Bird","wordB":"Sky","wordC":"Fish","options":["Water","Tree","Car"],"correctIndex":0}'::jsonb, true),
  ('antonym_match',
   '{"word":"Hot","options":["Cold","Fast","Loud"],"correctIndex":0}'::jsonb, true),
  ('size_order',
   '{"prompt":"Tap in order, smallest to largest","items":["Ant","Cat","Dog","Elephant"]}'::jsonb, true),
  ('spot_the_difference',
   '{"prompt":"Find the one that''s different","emoji":"🍎","oddEmoji":"🍊","gridSize":9,"oddIndex":4}'::jsonb, true),
  ('clock_reading',
   '{"prompt":"What time is it?","hour":3,"minute":30,"options":["3:00","3:30","4:00"],"correctIndex":1}'::jsonb, true)
on conflict (task_type) do nothing;
