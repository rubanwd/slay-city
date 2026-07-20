-- SLAY CITY — seed homework content for "Group 1" and "Group 2"
--
-- Ad-hoc content requested directly rather than authored through the teacher
-- dashboard UI: two lesson topics per group, five tasks each, covering a mix
-- of task types. "Group 2" doesn't exist yet, so this creates it under the
-- same teacher who owns "Group 1" before seeding its homework. Wrapped in a
-- DO block so a missing "Group 1" (e.g. a fresh environment with no teacher
-- set up yet) just skips the seed with a notice instead of failing the
-- migration.

do $$
declare
  v_teacher_id uuid;
  v_group1_id uuid;
  v_group2_id uuid;
  v_topic_id uuid;
begin
  select teacher_id, id into v_teacher_id, v_group1_id
  from public.teacher_groups
  where name = 'Group 1'
  order by created_at
  limit 1;

  if v_teacher_id is null then
    raise notice 'No group named "Group 1" found — skipping homework seed.';
    return;
  end if;

  select id into v_group2_id
  from public.teacher_groups
  where teacher_id = v_teacher_id and name = 'Group 2'
  limit 1;

  if v_group2_id is null then
    insert into public.teacher_groups (teacher_id, name)
    values (v_teacher_id, 'Group 2')
    returning id into v_group2_id;
  end if;

  -- ═══════════════════════════════════════════════════════════════════
  -- Group 1 — Topic: Animals
  -- ═══════════════════════════════════════════════════════════════════
  insert into public.homework_topics (group_id, title, description, order_index)
  values (v_group1_id, 'Animals', 'Learn animal names in English.', 0)
  returning id into v_topic_id;

  insert into public.homework_tasks (topic_id, task_type, order_index, content) values
    (v_topic_id, 'vocabulary', 0, jsonb_build_object(
      'word', 'Dog', 'translation', 'Собака', 'exampleSentence', 'The dog runs fast.'
    )),
    (v_topic_id, 'quiz', 1, jsonb_build_object(
      'question', 'Which animal says "Moo"?',
      'options', jsonb_build_array('Cow', 'Dog', 'Cat'),
      'correctIndex', 0
    )),
    (v_topic_id, 'matching', 2, jsonb_build_object(
      'prompt', 'Match the animal to its translation',
      'mode', 'word-to-translation',
      'pairs', jsonb_build_array(
        jsonb_build_object('id', '1', 'word', 'Dog', 'match', 'Собака'),
        jsonb_build_object('id', '2', 'word', 'Cat', 'match', 'Кіт'),
        jsonb_build_object('id', '3', 'word', 'Bird', 'match', 'Птах')
      )
    )),
    (v_topic_id, 'true_false', 3, jsonb_build_object(
      'statement', 'A cat can fly.', 'isTrue', false
    )),
    (v_topic_id, 'word_scramble', 4, jsonb_build_object(
      'word', 'LION', 'translation', 'Лев', 'hint', 'King of the jungle'
    ));

  -- ═══════════════════════════════════════════════════════════════════
  -- Group 1 — Topic: Family
  -- ═══════════════════════════════════════════════════════════════════
  insert into public.homework_topics (group_id, title, description, order_index)
  values (v_group1_id, 'Family', 'Talk about family members in English.', 1)
  returning id into v_topic_id;

  insert into public.homework_tasks (topic_id, task_type, order_index, content) values
    (v_topic_id, 'vocabulary', 0, jsonb_build_object(
      'word', 'Mother', 'translation', 'Мама', 'exampleSentence', 'My mother is kind.'
    )),
    (v_topic_id, 'flashcards', 1, jsonb_build_object(
      'prompt', 'Flip through the family words',
      'cards', jsonb_build_array(
        jsonb_build_object('id', '1', 'front', 'Father', 'back', 'Тато'),
        jsonb_build_object('id', '2', 'front', 'Sister', 'back', 'Сестра'),
        jsonb_build_object('id', '3', 'front', 'Brother', 'back', 'Брат')
      )
    )),
    (v_topic_id, 'fill_blank', 2, jsonb_build_object(
      'sentence', 'This is my ___.',
      'answer', 'mother',
      'options', jsonb_build_array('mother', 'car', 'table'),
      'translation', 'Це моя мама.'
    )),
    (v_topic_id, 'quiz', 3, jsonb_build_object(
      'question', 'Who is your father''s father?',
      'options', jsonb_build_array('Grandfather', 'Uncle', 'Cousin'),
      'correctIndex', 0
    )),
    (v_topic_id, 'matching', 4, jsonb_build_object(
      'prompt', 'Match the family member to its translation',
      'mode', 'word-to-translation',
      'pairs', jsonb_build_array(
        jsonb_build_object('id', '1', 'word', 'Mother', 'match', 'Мама'),
        jsonb_build_object('id', '2', 'word', 'Father', 'match', 'Тато'),
        jsonb_build_object('id', '3', 'word', 'Sister', 'match', 'Сестра')
      )
    ));

  -- ═══════════════════════════════════════════════════════════════════
  -- Group 2 — Topic: Colors & Shapes
  -- ═══════════════════════════════════════════════════════════════════
  insert into public.homework_topics (group_id, title, description, order_index)
  values (v_group2_id, 'Colors & Shapes', 'Learn colors and shapes in English.', 0)
  returning id into v_topic_id;

  insert into public.homework_tasks (topic_id, task_type, order_index, content) values
    (v_topic_id, 'vocabulary', 0, jsonb_build_object(
      'word', 'Red', 'translation', 'Червоний'
    )),
    (v_topic_id, 'color_mixing', 1, jsonb_build_object(
      'prompt', 'What color do these make together?',
      'colorA', 'Red', 'colorB', 'Blue',
      'hexA', '#FF3B3B', 'hexB', '#3B82F6',
      'options', jsonb_build_array('Purple', 'Green', 'Orange'),
      'correctIndex', 0
    )),
    (v_topic_id, 'shape_match', 2, jsonb_build_object(
      'prompt', 'Tap the circle',
      'targetShape', 'Circle',
      'options', jsonb_build_array('Circle', 'Square', 'Triangle'),
      'correctIndex', 0
    )),
    (v_topic_id, 'true_false', 3, jsonb_build_object(
      'statement', 'The sky is green.', 'isTrue', false
    )),
    (v_topic_id, 'quiz', 4, jsonb_build_object(
      'question', 'What color do you get mixing yellow and blue?',
      'options', jsonb_build_array('Green', 'Purple', 'Red'),
      'correctIndex', 0
    ));

  -- ═══════════════════════════════════════════════════════════════════
  -- Group 2 — Topic: Numbers
  -- ═══════════════════════════════════════════════════════════════════
  insert into public.homework_topics (group_id, title, description, order_index)
  values (v_group2_id, 'Numbers', 'Practice counting and numbers in English.', 1)
  returning id into v_topic_id;

  insert into public.homework_tasks (topic_id, task_type, order_index, content) values
    (v_topic_id, 'vocabulary', 0, jsonb_build_object(
      'word', 'Five', 'translation', 'Пʼять'
    )),
    (v_topic_id, 'counting_game', 1, jsonb_build_object(
      'prompt', 'How many apples do you see?',
      'emoji', '🍎', 'count', 4,
      'options', jsonb_build_array(3, 4, 5, 6)
    )),
    (v_topic_id, 'math_challenge', 2, jsonb_build_object(
      'question', '2 + 3 = ?',
      'options', jsonb_build_array('4', '5', '6'),
      'correctIndex', 1
    )),
    (v_topic_id, 'number_pattern', 3, jsonb_build_object(
      'prompt', 'What comes next?',
      'sequence', jsonb_build_array('1', '2', '_', '4', '5'),
      'blankIndex', 2,
      'options', jsonb_build_array('3', '6', '9'),
      'correctIndex', 0
    )),
    (v_topic_id, 'quiz', 4, jsonb_build_object(
      'question', 'Which number comes after seven?',
      'options', jsonb_build_array('Six', 'Eight', 'Nine'),
      'correctIndex', 1
    ));
end $$;
