-- SLAY CITY — seed example content for the 10 task types added in
-- 20260720000003, all published so they're immediately playable from
-- /admin/task-types and immediately selectable when authoring mission tasks.
--
-- NOTE: run 20260720000003 (enum values) before this file — Postgres cannot use
-- a newly added enum value in the same transaction that created it.

insert into public.task_type_templates (task_type, content, is_published)
values
  ('counting_game',
   '{"prompt":"How many apples do you see?","emoji":"🍎","count":5,"options":[3,4,5,6]}'::jsonb, true),
  ('math_challenge',
   '{"question":"5 + 3 = ?","options":["6","7","8","9"],"correctIndex":2}'::jsonb, true),
  ('simon_sequence',
   '{"prompt":"Watch, then repeat the pattern","colors":["Red","Blue","Green","Yellow"],"sequence":[0,2,1,3]}'::jsonb, true),
  ('reaction_tap',
   '{"prompt":"Tap every fruit before time runs out!","correct":["Apple","Banana","Grape","Orange"],"distractors":["Chair","Car","Shoe"],"roundSeconds":15}'::jsonb, true),
  ('picture_reveal',
   '{"prompt":"What''s in the picture?","imageUrl":"https://placehold.co/300x300/1a1a1a/9DFF00?text=Cat","options":["Dog","Cat","Bird"],"correctIndex":1}'::jsonb, true),
  ('rhyme_match',
   '{"prompt":"Which word rhymes with \"cat\"?","targetWord":"cat","options":["hat","dog","sun"],"correctIndex":0}'::jsonb, true),
  ('number_pattern',
   '{"prompt":"What comes next?","sequence":["2","4","6","8"],"blankIndex":3,"options":["7","8","9","10"],"correctIndex":1}'::jsonb, true),
  ('compare_size',
   '{"prompt":"Tap the bigger animal","optionA":"Elephant","optionB":"Mouse","imageUrlA":"https://placehold.co/200x200/1a1a1a/00F0FF?text=Elephant","imageUrlB":"https://placehold.co/200x200/1a1a1a/FF2D8E?text=Mouse","correctOption":"a"}'::jsonb, true),
  ('letter_fill',
   '{"word":"BANANA","hint":"A curved yellow fruit","translation":"Банан"}'::jsonb, true),
  ('dialogue_choice',
   '{"speaker":"Friend","prompt":"How are you today?","options":["I am fine, thank you!","Blue is my favorite color.","The store closes at five."],"correctIndex":0,"translation":"Як справи сьогодні?"}'::jsonb, true)
on conflict (task_type) do nothing;
