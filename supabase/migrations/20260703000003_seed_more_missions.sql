-- SLAY CITY — expanded sample content: 3 districts, 9 locations, 9 missions.
-- Builds on 20260701000002_seed_data.sql (Central Plaza + Market Square + the
-- "Greetings at the Market" mission) and 20260703000002_seed_mission_tasks.sql.
-- All matching tasks use "word-to-image" mode with placeholder images.
-- Same production caveat as the other seed migrations applies.

-- ── Districts ──────────────────────────────────────────────────────────────
insert into public.districts (id, name, description, order_index, is_published)
values
  (
    '00000000-0000-0000-0000-000000000002',
    'Kitchen Quarter',
    'Cafés, bakeries and kitchens full of tasty vocabulary.',
    1,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'School District',
    'Classrooms and playgrounds where young slayers learn and play.',
    2,
    true
  )
on conflict (id) do nothing;

-- ── Locations (7 new; Market Square + Library Corner already exist) ─────────
insert into public.locations (id, district_id, name, description, order_index, map_x, map_y, is_published)
values
  -- Central Plaza (district 1) — Market Square (0101) & Library Corner (0102) exist
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 'Fountain Plaza', 'Ask for directions around the great fountain.', 2, 45.00, 72.00, true),
  -- Kitchen Quarter (district 2)
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000002', 'In the Kitchen', 'Everyday kitchen objects and appliances.', 0, 75.00, 28.00, true),
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000002', 'Cozy Café', 'Order drinks and treats politely.', 1, 85.00, 48.00, true),
  ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000002', 'Bakery Lane', 'Fresh bread, cakes and pastries.', 2, 72.00, 66.00, true),
  -- School District (district 3)
  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000003', 'Classroom', 'School supplies and classroom words.', 0, 15.00, 22.00, true),
  ('00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000003', 'Playground', 'Games, toys and action words.', 1, 32.00, 58.00, true),
  ('00000000-0000-0000-0000-000000000109', '00000000-0000-0000-0000-000000000003', 'Art Studio', 'Colors and creativity.', 2, 52.00, 82.00, true)
on conflict (id) do nothing;

-- ── Missions (8 new; "Greetings at the Market" = 1001 already exists) ───────
insert into public.missions (id, location_id, title, description, xp_reward, coin_reward, is_published)
values
  ('00000000-0000-0000-0000-000000001002', '00000000-0000-0000-0000-000000000102', 'Reading Time',            'Words you need in the library.',            60, 12, true),
  ('00000000-0000-0000-0000-000000001003', '00000000-0000-0000-0000-000000000103', 'Numbers & Directions',    'Count and find your way around town.',      60, 12, true),
  ('00000000-0000-0000-0000-000000001004', '00000000-0000-0000-0000-000000000104', 'In the Kitchen',          'Name the things in a kitchen.',             70, 15, true),
  ('00000000-0000-0000-0000-000000001005', '00000000-0000-0000-0000-000000000105', 'At the Café',             'Order drinks like a local.',                70, 15, true),
  ('00000000-0000-0000-0000-000000001006', '00000000-0000-0000-0000-000000000106', 'The Bakery',              'Sweet treats and fresh bread.',             70, 15, true),
  ('00000000-0000-0000-0000-000000001007', '00000000-0000-0000-0000-000000000107', 'School Supplies',         'What you carry in your school bag.',         80, 18, true),
  ('00000000-0000-0000-0000-000000001008', '00000000-0000-0000-0000-000000000108', 'Fun at the Playground',   'Toys, games and action words.',             80, 18, true),
  ('00000000-0000-0000-0000-000000001009', '00000000-0000-0000-0000-000000000109', 'Colors & Art',            'Learn your colors with the Art Studio.',    90, 20, true)
on conflict (id) do nothing;

-- ── Mission tasks (vocabulary + matching[word-to-image] + quiz per mission) ─
-- Task id scheme: last block = 0000000T10NN  (T = task 1/2/3, NN = mission no.)
insert into public.mission_tasks (id, mission_id, task_type, order_index, content, is_published)
values
  -- Mission 1002 — Reading Time
  ('00000000-0000-0000-0000-000000011002', '00000000-0000-0000-0000-000000001002', 'vocabulary', 0,
   '{"word":"Book","translation":"Книга","imageUrl":"https://placehold.co/200x200/1a1a1a/9DFF00?text=Book","exampleSentence":"I read a book every night."}'::jsonb, true),
  ('00000000-0000-0000-0000-000000021002', '00000000-0000-0000-0000-000000001002', 'matching', 1,
   '{"prompt":"Match each word to its picture","mode":"word-to-image","pairs":[{"id":"1","word":"Book","match":"https://placehold.co/200x200/1a1a1a/9DFF00?text=Book"},{"id":"2","word":"Pen","match":"https://placehold.co/200x200/1a1a1a/00F0FF?text=Pen"},{"id":"3","word":"Shelf","match":"https://placehold.co/200x200/1a1a1a/FF2D8E?text=Shelf"}]}'::jsonb, true),
  ('00000000-0000-0000-0000-000000031002', '00000000-0000-0000-0000-000000001002', 'quiz', 2,
   '{"question":"What do you use to write?","options":["A pen","A shoe","A cup"],"correctIndex":0}'::jsonb, true),

  -- Mission 1003 — Numbers & Directions
  ('00000000-0000-0000-0000-000000011003', '00000000-0000-0000-0000-000000001003', 'vocabulary', 0,
   '{"word":"Left","translation":"Ліворуч","imageUrl":"https://placehold.co/200x200/1a1a1a/00F0FF?text=Left","exampleSentence":"Turn left at the fountain."}'::jsonb, true),
  ('00000000-0000-0000-0000-000000021003', '00000000-0000-0000-0000-000000001003', 'matching', 1,
   '{"prompt":"Match each number to its picture","mode":"word-to-image","pairs":[{"id":"1","word":"One","match":"https://placehold.co/200x200/1a1a1a/9DFF00?text=1"},{"id":"2","word":"Two","match":"https://placehold.co/200x200/1a1a1a/00F0FF?text=2"},{"id":"3","word":"Three","match":"https://placehold.co/200x200/1a1a1a/FF2D8E?text=3"}]}'::jsonb, true),
  ('00000000-0000-0000-0000-000000031003', '00000000-0000-0000-0000-000000001003', 'quiz', 2,
   '{"question":"Which way is the opposite of right?","options":["Left","Up","Back"],"correctIndex":0}'::jsonb, true),

  -- Mission 1004 — In the Kitchen
  ('00000000-0000-0000-0000-000000011004', '00000000-0000-0000-0000-000000001004', 'vocabulary', 0,
   '{"word":"Toaster","translation":"Тостер","imageUrl":"https://placehold.co/200x200/1a1a1a/FF2D8E?text=Toaster","exampleSentence":"Put the bread in the toaster."}'::jsonb, true),
  ('00000000-0000-0000-0000-000000021004', '00000000-0000-0000-0000-000000001004', 'matching', 1,
   '{"prompt":"Match each word to its picture","mode":"word-to-image","pairs":[{"id":"1","word":"Fridge","match":"https://placehold.co/200x200/1a1a1a/9DFF00?text=Fridge"},{"id":"2","word":"Spoon","match":"https://placehold.co/200x200/1a1a1a/00F0FF?text=Spoon"},{"id":"3","word":"Cup","match":"https://placehold.co/200x200/1a1a1a/6A00FF?text=Cup"}]}'::jsonb, true),
  ('00000000-0000-0000-0000-000000031004', '00000000-0000-0000-0000-000000001004', 'quiz', 2,
   '{"question":"What is this?","imageUrl":"https://placehold.co/200x200/1a1a1a/FF2D8E?text=Toaster","options":["Fridge","Toaster","Spoon"],"correctIndex":1}'::jsonb, true),

  -- Mission 1005 — At the Café
  ('00000000-0000-0000-0000-000000011005', '00000000-0000-0000-0000-000000001005', 'vocabulary', 0,
   '{"word":"Coffee","translation":"Кава","imageUrl":"https://placehold.co/200x200/1a1a1a/9DFF00?text=Coffee","exampleSentence":"Can I have a coffee, please?"}'::jsonb, true),
  ('00000000-0000-0000-0000-000000021005', '00000000-0000-0000-0000-000000001005', 'matching', 1,
   '{"prompt":"Match each drink to its picture","mode":"word-to-image","pairs":[{"id":"1","word":"Tea","match":"https://placehold.co/200x200/1a1a1a/9DFF00?text=Tea"},{"id":"2","word":"Juice","match":"https://placehold.co/200x200/1a1a1a/00F0FF?text=Juice"},{"id":"3","word":"Water","match":"https://placehold.co/200x200/1a1a1a/FF2D8E?text=Water"}]}'::jsonb, true),
  ('00000000-0000-0000-0000-000000031005', '00000000-0000-0000-0000-000000001005', 'quiz', 2,
   '{"question":"How do you order politely?","options":["Can I have a latte, please?","Give coffee!","Coffee now"],"correctIndex":0}'::jsonb, true),

  -- Mission 1006 — The Bakery
  ('00000000-0000-0000-0000-000000011006', '00000000-0000-0000-0000-000000001006', 'vocabulary', 0,
   '{"word":"Cake","translation":"Торт","imageUrl":"https://placehold.co/200x200/1a1a1a/FF2D8E?text=Cake","exampleSentence":"I love chocolate cake."}'::jsonb, true),
  ('00000000-0000-0000-0000-000000021006', '00000000-0000-0000-0000-000000001006', 'matching', 1,
   '{"prompt":"Match each treat to its picture","mode":"word-to-image","pairs":[{"id":"1","word":"Bun","match":"https://placehold.co/200x200/1a1a1a/9DFF00?text=Bun"},{"id":"2","word":"Pie","match":"https://placehold.co/200x200/1a1a1a/00F0FF?text=Pie"},{"id":"3","word":"Cookie","match":"https://placehold.co/200x200/1a1a1a/6A00FF?text=Cookie"}]}'::jsonb, true),
  ('00000000-0000-0000-0000-000000031006', '00000000-0000-0000-0000-000000001006', 'quiz', 2,
   '{"question":"Where do you buy fresh bread?","options":["Bakery","Garage","Library"],"correctIndex":0}'::jsonb, true),

  -- Mission 1007 — School Supplies
  ('00000000-0000-0000-0000-000000011007', '00000000-0000-0000-0000-000000001007', 'vocabulary', 0,
   '{"word":"Pencil","translation":"Олівець","imageUrl":"https://placehold.co/200x200/1a1a1a/9DFF00?text=Pencil","exampleSentence":"I draw with a pencil."}'::jsonb, true),
  ('00000000-0000-0000-0000-000000021007', '00000000-0000-0000-0000-000000001007', 'matching', 1,
   '{"prompt":"Match each item to its picture","mode":"word-to-image","pairs":[{"id":"1","word":"Ruler","match":"https://placehold.co/200x200/1a1a1a/9DFF00?text=Ruler"},{"id":"2","word":"Eraser","match":"https://placehold.co/200x200/1a1a1a/00F0FF?text=Eraser"},{"id":"3","word":"Bag","match":"https://placehold.co/200x200/1a1a1a/FF2D8E?text=Bag"}]}'::jsonb, true),
  ('00000000-0000-0000-0000-000000031007', '00000000-0000-0000-0000-000000001007', 'quiz', 2,
   '{"question":"What do you write in?","options":["A notebook","A fridge","A shoe"],"correctIndex":0}'::jsonb, true),

  -- Mission 1008 — Fun at the Playground
  ('00000000-0000-0000-0000-000000011008', '00000000-0000-0000-0000-000000001008', 'vocabulary', 0,
   '{"word":"Swing","translation":"Гойдалка","imageUrl":"https://placehold.co/200x200/1a1a1a/00F0FF?text=Swing","exampleSentence":"I like to play on the swing."}'::jsonb, true),
  ('00000000-0000-0000-0000-000000021008', '00000000-0000-0000-0000-000000001008', 'matching', 1,
   '{"prompt":"Match each toy to its picture","mode":"word-to-image","pairs":[{"id":"1","word":"Ball","match":"https://placehold.co/200x200/1a1a1a/9DFF00?text=Ball"},{"id":"2","word":"Slide","match":"https://placehold.co/200x200/1a1a1a/00F0FF?text=Slide"},{"id":"3","word":"Kite","match":"https://placehold.co/200x200/1a1a1a/FF2D8E?text=Kite"}]}'::jsonb, true),
  ('00000000-0000-0000-0000-000000031008', '00000000-0000-0000-0000-000000001008', 'quiz', 2,
   '{"question":"What do you kick?","options":["A ball","A book","A cup"],"correctIndex":0}'::jsonb, true),

  -- Mission 1009 — Colors & Art
  ('00000000-0000-0000-0000-000000011009', '00000000-0000-0000-0000-000000001009', 'vocabulary', 0,
   '{"word":"Blue","translation":"Синій","imageUrl":"https://placehold.co/200x200/1a1a1a/00F0FF?text=Blue","exampleSentence":"The sky is blue."}'::jsonb, true),
  ('00000000-0000-0000-0000-000000021009', '00000000-0000-0000-0000-000000001009', 'matching', 1,
   '{"prompt":"Match each color to its swatch","mode":"word-to-image","pairs":[{"id":"1","word":"Red","match":"https://placehold.co/200x200/FF0000/ffffff?text=Red"},{"id":"2","word":"Green","match":"https://placehold.co/200x200/00AA00/ffffff?text=Green"},{"id":"3","word":"Yellow","match":"https://placehold.co/200x200/FFD400/000000?text=Yellow"}]}'::jsonb, true),
  ('00000000-0000-0000-0000-000000031009', '00000000-0000-0000-0000-000000001009', 'quiz', 2,
   '{"question":"What color is grass?","options":["Green","Purple","Black"],"correctIndex":0}'::jsonb, true)
on conflict (id) do nothing;
