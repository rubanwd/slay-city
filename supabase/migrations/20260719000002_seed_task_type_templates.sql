-- SLAY CITY — seed the Task Type templates catalog.
--
-- One row per task type with ready-to-play example content, so an admin opening
-- /admin/task-types sees filled-in fields and can run any task immediately. All
-- types are published except `listening`, which has no gameplay component yet —
-- leaving it a draft demonstrates the publish filter on the mission dropdown.
--
-- NOTE: run 20260718000002 (enum values) before this file — Postgres cannot use
-- a newly added enum value in the same transaction that created it.

insert into public.task_type_templates (task_type, content, is_published)
values
  ('vocabulary',
   '{"word":"Cat","translation":"Кіт","imageUrl":"https://placehold.co/200x200/1a1a1a/9DFF00?text=Cat","exampleSentence":"The cat is sleeping on the sofa."}'::jsonb, true),
  ('matching',
   '{"prompt":"Match each word to its translation","mode":"word-to-translation","pairs":[{"id":"1","word":"Dog","match":"Собака"},{"id":"2","word":"Cat","match":"Кіт"},{"id":"3","word":"Bird","match":"Птах"}]}'::jsonb, true),
  ('listening',
   '{"prompt":"Listen and choose what you heard.","audioUrl":null}'::jsonb, false),
  ('quiz',
   '{"question":"Which animal says \"meow\"?","imageUrl":null,"options":["Dog","Cat","Cow"],"correctIndex":1}'::jsonb, true),
  ('snake_game',
   '{"word":"CAT","translation":"Кіт","prompt":"Collect the letters in order"}'::jsonb, true),
  ('word_scramble',
   '{"word":"RAINBOW","translation":"Райдуга","hint":"You see it in the sky after the rain","imageUrl":"https://placehold.co/200x200/1a1a1a/9DFF00?text=Rainbow"}'::jsonb, true),
  ('hangman',
   '{"word":"ELEPHANT","hint":"A big grey animal with a trunk","translation":"Слон"}'::jsonb, true),
  ('bubble_pop',
   '{"prompt":"Pop all the animals","correct":["cat","dog","frog","lion"],"distractors":["table","chair","spoon","cloud"]}'::jsonb, true),
  ('memory_cards',
   '{"prompt":"Match each word to its translation","mode":"word-to-translation","pairs":[{"id":"1","word":"Sun","match":"Сонце"},{"id":"2","word":"Moon","match":"Місяць"},{"id":"3","word":"Star","match":"Зірка"},{"id":"4","word":"Sky","match":"Небо"}]}'::jsonb, true),
  ('emoji_decode',
   '{"emojis":"🌧️ + 🏹 = ?","options":["Rainbow","Umbrella","Arrow"],"correctIndex":0,"translation":"Райдуга"}'::jsonb, true),
  ('word_search',
   '{"prompt":"Find the hidden animals","words":["CAT","DOG","FOX","OWL"],"size":8}'::jsonb, true),
  ('crossword',
   '{"prompt":"Solve the mini crossword","entries":[{"answer":"CAT","clue":"A small pet that says meow","row":0,"col":0,"direction":"across"},{"answer":"COW","clue":"Farm animal that gives milk","row":0,"col":0,"direction":"down"},{"answer":"TOP","clue":"The highest part of something","row":0,"col":2,"direction":"down"}]}'::jsonb, true),
  ('category_sort',
   '{"prompt":"Sort into Fruits and Animals","categories":["Fruits","Animals"],"items":[{"text":"Apple","categoryIndex":0},{"text":"Banana","categoryIndex":0},{"text":"Tiger","categoryIndex":1},{"text":"Monkey","categoryIndex":1},{"text":"Grape","categoryIndex":0},{"text":"Zebra","categoryIndex":1}]}'::jsonb, true),
  ('odd_one_out',
   '{"prompt":"Which one is not a color?","words":["Red","Blue","Green","Table"],"oddIndex":3}'::jsonb, true),
  ('sentence_builder',
   '{"prompt":"Build a correct sentence","words":["I","like","to","play","football"],"translation":"Я люблю грати у футбол."}'::jsonb, true),
  ('fill_blank',
   '{"sentence":"The cat ___ on the mat.","answer":"sat","options":["sat","run","eat"],"translation":"Кіт сидів на килимку."}'::jsonb, true),
  ('spelling_bee',
   '{"word":"banana","translation":"Банан","prompt":"Listen and spell the yellow fruit"}'::jsonb, true),
  ('true_false',
   '{"statement":"A spider has six legs.","isTrue":false,"imageUrl":"https://placehold.co/200x200/1a1a1a/FF2D8E?text=Spider"}'::jsonb, true),
  ('flashcards',
   '{"prompt":"Flip through the animals","cards":[{"id":"1","front":"Dog","back":"Собака","imageUrl":"https://placehold.co/200x200/1a1a1a/00F0FF?text=Dog"},{"id":"2","front":"Cat","back":"Кіт","imageUrl":"https://placehold.co/200x200/1a1a1a/9DFF00?text=Cat"},{"id":"3","front":"Bird","back":"Птах","imageUrl":"https://placehold.co/200x200/1a1a1a/FF2D8E?text=Bird"}]}'::jsonb, true),
  ('story_sequencing',
   '{"prompt":"Put the morning routine in order","steps":[{"id":"1","text":"First, she woke up."},{"id":"2","text":"Then, she brushed her teeth."},{"id":"3","text":"Next, she ate breakfast."},{"id":"4","text":"Finally, she went to school."}]}'::jsonb, true)
on conflict (task_type) do nothing;
