-- SLAY CITY — "Games Arcade" showcase district.
--
-- Seeds a new published district with 5 locations, one mission each, and three
-- tasks per mission covering all 15 new task types introduced in
-- 20260718000002_new_task_types.sql. Content is authored to satisfy each type's
-- parser so every game is playable end-to-end on the map.
--
-- NOTE: this migration must run AFTER the enum values are committed. If applying
-- by hand in the Supabase SQL editor, run 20260718000002 first (on its own),
-- then run this file — Postgres cannot use a new enum value in the same
-- transaction that added it.

-- =========================================================================
-- District
-- =========================================================================
insert into public.districts (id, name, description, order_index, is_published)
values (
  '00000000-0000-0000-0000-0000000000f0',
  'Games Arcade',
  'A neon playground where every stop is a different English mini-game.',
  1,
  true
)
on conflict (id) do nothing;

-- =========================================================================
-- Locations (5), scattered across the map
-- =========================================================================
insert into public.locations (id, district_id, name, description, order_index, map_x, map_y, is_published)
values
  ('00000000-0000-0000-0000-0000000001f1', '00000000-0000-0000-0000-0000000000f0',
   'Word Lab', 'Unscramble, guess, and spell tricky words.', 0, 22.00, 28.00, true),
  ('00000000-0000-0000-0000-0000000001f2', '00000000-0000-0000-0000-0000000000f0',
   'Bubble Bay', 'Pop, match, and decode for fast fun.', 1, 70.00, 24.00, true),
  ('00000000-0000-0000-0000-0000000001f3', '00000000-0000-0000-0000-0000000000f0',
   'Puzzle Peak', 'Search grids, crosswords, and sorting challenges.', 2, 78.00, 55.00, true),
  ('00000000-0000-0000-0000-0000000001f4', '00000000-0000-0000-0000-0000000000f0',
   'Quiz Quarter', 'Quick-fire true/false and odd-one-out rounds.', 3, 25.00, 60.00, true),
  ('00000000-0000-0000-0000-0000000001f5', '00000000-0000-0000-0000-0000000000f0',
   'Story Studio', 'Build sentences and put stories in order.', 4, 52.00, 80.00, true)
on conflict (id) do nothing;

-- =========================================================================
-- Missions (one per location)
-- =========================================================================
insert into public.missions (id, location_id, title, description, xp_reward, coin_reward, is_published)
values
  ('00000000-0000-0000-0000-0000000002f1', '00000000-0000-0000-0000-0000000001f1',
   'Word Lab Warm-up', 'Scramble, hangman, and spelling bee.', 60, 15, true),
  ('00000000-0000-0000-0000-0000000002f2', '00000000-0000-0000-0000-0000000001f2',
   'Bubble Bay Blast', 'Bubble pop, memory, and emoji decode.', 60, 15, true),
  ('00000000-0000-0000-0000-0000000002f3', '00000000-0000-0000-0000-0000000001f3',
   'Puzzle Peak Challenge', 'Word search, crossword, and category sort.', 70, 20, true),
  ('00000000-0000-0000-0000-0000000002f4', '00000000-0000-0000-0000-0000000001f4',
   'Quiz Quarter Quickfire', 'Odd one out, true/false, and fill the blank.', 60, 15, true),
  ('00000000-0000-0000-0000-0000000002f5', '00000000-0000-0000-0000-0000000001f5',
   'Story Studio Showcase', 'Sentence builder, flashcards, and story order.', 70, 20, true)
on conflict (id) do nothing;

-- =========================================================================
-- Mission 1 — Word Lab: word_scramble, hangman, spelling_bee
-- =========================================================================
insert into public.mission_tasks (id, mission_id, task_type, order_index, content, is_published)
values
  ('00000000-0000-0000-0000-00000003f101', '00000000-0000-0000-0000-0000000002f1', 'word_scramble', 0,
   '{"word":"RAINBOW","translation":"Райдуга","hint":"You see it in the sky after the rain","imageUrl":"https://placehold.co/200x200/1a1a1a/9DFF00?text=Rainbow"}'::jsonb, true),
  ('00000000-0000-0000-0000-00000003f102', '00000000-0000-0000-0000-0000000002f1', 'hangman', 1,
   '{"word":"ELEPHANT","hint":"A big grey animal with a trunk","translation":"Слон"}'::jsonb, true),
  ('00000000-0000-0000-0000-00000003f103', '00000000-0000-0000-0000-0000000002f1', 'spelling_bee', 2,
   '{"word":"banana","translation":"Банан","prompt":"Listen and spell the yellow fruit"}'::jsonb, true)
on conflict (id) do nothing;

-- =========================================================================
-- Mission 2 — Bubble Bay: bubble_pop, memory_cards, emoji_decode
-- =========================================================================
insert into public.mission_tasks (id, mission_id, task_type, order_index, content, is_published)
values
  ('00000000-0000-0000-0000-00000003f201', '00000000-0000-0000-0000-0000000002f2', 'bubble_pop', 0,
   '{"prompt":"Pop all the animals","correct":["cat","dog","frog","lion"],"distractors":["table","chair","spoon","cloud"]}'::jsonb, true),
  ('00000000-0000-0000-0000-00000003f202', '00000000-0000-0000-0000-0000000002f2', 'memory_cards', 1,
   '{"prompt":"Match each word to its translation","mode":"word-to-translation","pairs":[{"id":"1","word":"Sun","match":"Сонце"},{"id":"2","word":"Moon","match":"Місяць"},{"id":"3","word":"Star","match":"Зірка"},{"id":"4","word":"Sky","match":"Небо"}]}'::jsonb, true),
  ('00000000-0000-0000-0000-00000003f203', '00000000-0000-0000-0000-0000000002f2', 'emoji_decode', 2,
   '{"emojis":"🌧️ + 🏹 = ?","options":["Rainbow","Umbrella","Arrow"],"correctIndex":0,"translation":"Райдуга"}'::jsonb, true)
on conflict (id) do nothing;

-- =========================================================================
-- Mission 3 — Puzzle Peak: word_search, crossword, category_sort
-- =========================================================================
insert into public.mission_tasks (id, mission_id, task_type, order_index, content, is_published)
values
  ('00000000-0000-0000-0000-00000003f301', '00000000-0000-0000-0000-0000000002f3', 'word_search', 0,
   '{"prompt":"Find the hidden animals","words":["CAT","DOG","FOX","OWL"],"size":8}'::jsonb, true),
  ('00000000-0000-0000-0000-00000003f302', '00000000-0000-0000-0000-0000000002f3', 'crossword', 1,
   '{"prompt":"Solve the mini crossword","entries":[{"answer":"CAT","clue":"A small pet that says meow","row":0,"col":0,"direction":"across"},{"answer":"COW","clue":"Farm animal that gives milk","row":0,"col":0,"direction":"down"},{"answer":"TOP","clue":"The highest part of something","row":0,"col":2,"direction":"down"}]}'::jsonb, true),
  ('00000000-0000-0000-0000-00000003f303', '00000000-0000-0000-0000-0000000002f3', 'category_sort', 2,
   '{"prompt":"Sort into Fruits and Animals","categories":["Fruits","Animals"],"items":[{"text":"Apple","categoryIndex":0},{"text":"Banana","categoryIndex":0},{"text":"Tiger","categoryIndex":1},{"text":"Monkey","categoryIndex":1},{"text":"Grape","categoryIndex":0},{"text":"Zebra","categoryIndex":1}]}'::jsonb, true)
on conflict (id) do nothing;

-- =========================================================================
-- Mission 4 — Quiz Quarter: odd_one_out, true_false, fill_blank
-- =========================================================================
insert into public.mission_tasks (id, mission_id, task_type, order_index, content, is_published)
values
  ('00000000-0000-0000-0000-00000003f401', '00000000-0000-0000-0000-0000000002f4', 'odd_one_out', 0,
   '{"prompt":"Which one is not a color?","words":["Red","Blue","Green","Table"],"oddIndex":3}'::jsonb, true),
  ('00000000-0000-0000-0000-00000003f402', '00000000-0000-0000-0000-0000000002f4', 'true_false', 1,
   '{"statement":"A spider has six legs.","isTrue":false,"imageUrl":"https://placehold.co/200x200/1a1a1a/FF2D8E?text=Spider"}'::jsonb, true),
  ('00000000-0000-0000-0000-00000003f403', '00000000-0000-0000-0000-0000000002f4', 'fill_blank', 2,
   '{"sentence":"The cat ___ on the mat.","answer":"sat","options":["sat","run","eat"],"translation":"Кіт сидів на килимку."}'::jsonb, true)
on conflict (id) do nothing;

-- =========================================================================
-- Mission 5 — Story Studio: sentence_builder, flashcards, story_sequencing
-- =========================================================================
insert into public.mission_tasks (id, mission_id, task_type, order_index, content, is_published)
values
  ('00000000-0000-0000-0000-00000003f501', '00000000-0000-0000-0000-0000000002f5', 'sentence_builder', 0,
   '{"prompt":"Build a correct sentence","words":["I","like","to","play","football"],"translation":"Я люблю грати у футбол."}'::jsonb, true),
  ('00000000-0000-0000-0000-00000003f502', '00000000-0000-0000-0000-0000000002f5', 'flashcards', 1,
   '{"prompt":"Flip through the animals","cards":[{"id":"1","front":"Dog","back":"Собака","imageUrl":"https://placehold.co/200x200/1a1a1a/00F0FF?text=Dog"},{"id":"2","front":"Cat","back":"Кіт","imageUrl":"https://placehold.co/200x200/1a1a1a/9DFF00?text=Cat"},{"id":"3","front":"Bird","back":"Птах","imageUrl":"https://placehold.co/200x200/1a1a1a/FF2D8E?text=Bird"}]}'::jsonb, true),
  ('00000000-0000-0000-0000-00000003f503', '00000000-0000-0000-0000-0000000002f5', 'story_sequencing', 2,
   '{"prompt":"Put the morning routine in order","steps":[{"id":"1","text":"First, she woke up."},{"id":"2","text":"Then, she brushed her teeth."},{"id":"3","text":"Next, she ate breakfast."},{"id":"4","text":"Finally, she went to school."}]}'::jsonb, true)
on conflict (id) do nothing;
