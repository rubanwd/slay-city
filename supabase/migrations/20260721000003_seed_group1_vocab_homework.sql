-- SLAY CITY — seed a vocabulary-learning homework topic for teacher
-- "rubanprofit" / "Group 1"
--
-- Test data for the new homework vocabulary flow (see
-- 20260721000002_homework_vocabulary.sql): one lesson topic with a set of word
-- cards plus a matching test built from the words. Scoped to the teacher whose
-- username is 'rubanprofit' and their group named "Group 1". Wrapped in a DO
-- block and guarded so a missing teacher/group (e.g. a fresh environment) skips
-- with a notice instead of failing, and a re-run doesn't duplicate the topic.
--
-- Word images are left null on purpose — this is seed data, and the flow
-- renders a card without an image just fine; a teacher can generate images
-- from the dashboard later.

do $$
declare
  v_teacher_id uuid;
  v_group1_id uuid;
  v_topic_id uuid;
  v_next_order integer;
begin
  select id into v_teacher_id
  from public.profiles
  where username = 'rubanprofit' and role = 'teacher'
  limit 1;

  if v_teacher_id is null then
    raise notice 'No teacher "rubanprofit" found — skipping vocabulary homework seed.';
    return;
  end if;

  select id into v_group1_id
  from public.teacher_groups
  where teacher_id = v_teacher_id and name = 'Group 1'
  order by created_at
  limit 1;

  if v_group1_id is null then
    raise notice 'Teacher "rubanprofit" has no "Group 1" — skipping vocabulary homework seed.';
    return;
  end if;

  -- Idempotent: don't create a second copy if this seed already ran.
  if exists (
    select 1 from public.homework_topics
    where group_id = v_group1_id and title = 'Food & Drinks (Vocabulary)'
  ) then
    raise notice 'Vocabulary topic already seeded for Group 1 — skipping.';
    return;
  end if;

  -- Place the new topic after any existing ones.
  select coalesce(max(order_index) + 1, 0) into v_next_order
  from public.homework_topics
  where group_id = v_group1_id;

  insert into public.homework_topics (group_id, title, description, order_index)
  values (
    v_group1_id,
    'Food & Drinks (Vocabulary)',
    'Learn everyday food and drink words, then take the test.',
    v_next_order
  )
  returning id into v_topic_id;

  -- ── Word cards ──────────────────────────────────────────────────────────
  insert into public.homework_vocab_words
    (topic_id, word, transcription, translation, order_index)
  values
    (v_topic_id, 'apple',  '/ˈæp.əl/',    'яблуко', 0),
    (v_topic_id, 'bread',  '/bred/',      'хліб',   1),
    (v_topic_id, 'milk',   '/mɪlk/',      'молоко', 2),
    (v_topic_id, 'cheese', '/tʃiːz/',     'сир',    3),
    (v_topic_id, 'water',  '/ˈwɔː.tər/',  'вода',   4),
    (v_topic_id, 'banana', '/bəˈnɑː.nə/', 'банан',  5);

  -- ── Test: half as many tasks as words (6 words → 3 tasks), built from the
  -- same task-type subset the app's deterministic builder uses ──────────────
  insert into public.homework_vocab_tasks (topic_id, task_type, order_index, content) values
    (v_topic_id, 'quiz', 0, jsonb_build_object(
      'question', 'What does "apple" mean?',
      'imageUrl', null,
      'options', jsonb_build_array('яблуко', 'хліб', 'молоко', 'сир'),
      'correctIndex', 0
    )),
    (v_topic_id, 'matching', 1, jsonb_build_object(
      'prompt', 'Match each word to its meaning',
      'mode', 'word-to-translation',
      'pairs', jsonb_build_array(
        jsonb_build_object('id', '0', 'word', 'apple',  'match', 'яблуко'),
        jsonb_build_object('id', '1', 'word', 'bread',  'match', 'хліб'),
        jsonb_build_object('id', '2', 'word', 'milk',   'match', 'молоко'),
        jsonb_build_object('id', '3', 'word', 'cheese', 'match', 'сир')
      )
    )),
    (v_topic_id, 'word_scramble', 2, jsonb_build_object(
      'word', 'BANANA',
      'translation', 'банан',
      'hint', 'банан'
    ));
end $$;
