-- SLAY CITY — sample mission tasks for the "Greetings at the Market" mission.
-- Adds one of each supported task type (vocabulary, matching, quiz) so the
-- Mission screen can be exercised end-to-end in local/dev.
-- Same production caveat as 20260701000002_seed_data.sql applies.

insert into public.mission_tasks (id, mission_id, task_type, order_index, content, is_published)
values
  (
    '00000000-0000-0000-0000-0000000010a1',
    '00000000-0000-0000-0000-000000001001',
    'vocabulary',
    0,
    '{
      "word": "Apple",
      "translation": "Яблуко",
      "imageUrl": "https://placehold.co/200x200/1a1a1a/9DFF00?text=Apple",
      "exampleSentence": "I would like to buy an apple, please."
    }'::jsonb,
    true
  ),
  (
    '00000000-0000-0000-0000-0000000010a2',
    '00000000-0000-0000-0000-000000001001',
    'matching',
    1,
    '{
      "prompt": "Match each word to its picture",
      "mode": "word-to-image",
      "pairs": [
        { "id": "1", "word": "Bread",  "match": "https://placehold.co/200x200/1a1a1a/9DFF00?text=Bread" },
        { "id": "2", "word": "Milk",   "match": "https://placehold.co/200x200/1a1a1a/00F0FF?text=Milk" },
        { "id": "3", "word": "Cheese", "match": "https://placehold.co/200x200/1a1a1a/FF2D8E?text=Cheese" }
      ]
    }'::jsonb,
    true
  ),
  (
    '00000000-0000-0000-0000-0000000010a3',
    '00000000-0000-0000-0000-000000001001',
    'quiz',
    2,
    '{
      "question": "How do you politely greet a shopkeeper?",
      "imageUrl": "https://placehold.co/200x200/1a1a1a/FF2D8E?text=Hello",
      "options": ["Good morning!", "Go away", "Bread now"],
      "correctIndex": 0
    }'::jsonb,
    true
  )
on conflict (id) do nothing;
