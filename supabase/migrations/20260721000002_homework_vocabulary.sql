-- SLAY CITY — homework vocabulary (word cards + a derived test per topic)
--
-- Adds an optional "learn these words" flow on top of a homework topic. A
-- teacher attaches a set of vocabulary words (English word, transcription,
-- translation, an AI/uploaded image) to a topic, plus a short test built from
-- the existing `mission_task_type` catalog to check the words afterwards. A
-- child steps through the word cards one at a time, then takes the test; on
-- finishing the whole flow their completion is recorded so both the child and
-- the teacher can see who has "passed the words".
--
-- Kept in dedicated tables (rather than reusing `homework_tasks`) so the
-- existing free-practice homework flow is untouched: the word test lives in
-- `homework_vocab_tasks`, never mixing into a topic's regular task list.
--
-- Like the rest of homework, this grants no XP/coins/streak — it sits outside
-- the map's reward loop and is purely teacher-assigned practice. RLS mirrors
-- the homework tables: visible to the owning teacher (via `teacher_groups`)
-- and to member children (via `is_group_member`); words/tasks are teacher-write
-- only, completions are child-write-own + teacher-read.

-- =========================================================================
-- Tables
-- =========================================================================

create table public.homework_vocab_words (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.homework_topics (id) on delete cascade,
  word text not null,
  transcription text,
  translation text not null,
  image_url text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index homework_vocab_words_topic_id_idx on public.homework_vocab_words (topic_id);

create table public.homework_vocab_tasks (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.homework_topics (id) on delete cascade,
  task_type public.mission_task_type not null,
  content jsonb not null default '{}'::jsonb,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index homework_vocab_tasks_topic_id_idx on public.homework_vocab_tasks (topic_id);

create table public.homework_vocab_completions (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.homework_topics (id) on delete cascade,
  child_id uuid not null references public.profiles (id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (topic_id, child_id)
);

create index homework_vocab_completions_child_id_idx on public.homework_vocab_completions (child_id);
create index homework_vocab_completions_topic_id_idx on public.homework_vocab_completions (topic_id);

alter table public.homework_vocab_words enable row level security;
alter table public.homework_vocab_tasks enable row level security;
alter table public.homework_vocab_completions enable row level security;

-- =========================================================================
-- RLS: homework_vocab_words
--
-- SELECT reuses the topic's own visibility (teacher-owns or child-member) by
-- probing `homework_topics` — its policy already encodes both sides. Writes
-- re-check teacher ownership directly through `teacher_groups`, matching the
-- `homework_tasks` policies.
-- =========================================================================

create policy "homework_vocab_words_select" on public.homework_vocab_words
  for select using (
    exists (select 1 from public.homework_topics t where t.id = topic_id)
  );

create policy "homework_vocab_words_insert_teacher" on public.homework_vocab_words
  for insert with check (
    exists (
      select 1 from public.homework_topics t
      join public.teacher_groups g on g.id = t.group_id
      where t.id = topic_id and g.teacher_id = auth.uid()
    )
  );

create policy "homework_vocab_words_update_teacher" on public.homework_vocab_words
  for update using (
    exists (
      select 1 from public.homework_topics t
      join public.teacher_groups g on g.id = t.group_id
      where t.id = topic_id and g.teacher_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.homework_topics t
      join public.teacher_groups g on g.id = t.group_id
      where t.id = topic_id and g.teacher_id = auth.uid()
    )
  );

create policy "homework_vocab_words_delete_teacher" on public.homework_vocab_words
  for delete using (
    exists (
      select 1 from public.homework_topics t
      join public.teacher_groups g on g.id = t.group_id
      where t.id = topic_id and g.teacher_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.homework_vocab_words to authenticated;

-- =========================================================================
-- RLS: homework_vocab_tasks  (identical shape to the words policies)
-- =========================================================================

create policy "homework_vocab_tasks_select" on public.homework_vocab_tasks
  for select using (
    exists (select 1 from public.homework_topics t where t.id = topic_id)
  );

create policy "homework_vocab_tasks_insert_teacher" on public.homework_vocab_tasks
  for insert with check (
    exists (
      select 1 from public.homework_topics t
      join public.teacher_groups g on g.id = t.group_id
      where t.id = topic_id and g.teacher_id = auth.uid()
    )
  );

create policy "homework_vocab_tasks_update_teacher" on public.homework_vocab_tasks
  for update using (
    exists (
      select 1 from public.homework_topics t
      join public.teacher_groups g on g.id = t.group_id
      where t.id = topic_id and g.teacher_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.homework_topics t
      join public.teacher_groups g on g.id = t.group_id
      where t.id = topic_id and g.teacher_id = auth.uid()
    )
  );

create policy "homework_vocab_tasks_delete_teacher" on public.homework_vocab_tasks
  for delete using (
    exists (
      select 1 from public.homework_topics t
      join public.teacher_groups g on g.id = t.group_id
      where t.id = topic_id and g.teacher_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.homework_vocab_tasks to authenticated;

-- =========================================================================
-- RLS: homework_vocab_completions
--
-- A child records/reads only their own completion, restricted to a topic they
-- can see. A teacher may read (not write) completions for topics in groups
-- they own, to see who has passed the words.
-- =========================================================================

create policy "homework_vocab_completions_select" on public.homework_vocab_completions
  for select using (
    child_id = auth.uid()
    or exists (
      select 1 from public.homework_topics t
      join public.teacher_groups g on g.id = t.group_id
      where t.id = topic_id and g.teacher_id = auth.uid()
    )
  );

create policy "homework_vocab_completions_insert_own" on public.homework_vocab_completions
  for insert with check (
    child_id = auth.uid()
    and exists (select 1 from public.homework_topics t where t.id = topic_id)
  );

create policy "homework_vocab_completions_delete_own" on public.homework_vocab_completions
  for delete using (child_id = auth.uid());

grant select, insert, delete on public.homework_vocab_completions to authenticated;

-- =========================================================================
-- Admin "View as Teacher" parity (mirrors 20260721000001_admin_view_as_teacher.sql).
-- Additive admin policies so an admin impersonating a teacher can author a
-- topic's vocabulary through their own JWT, and read who has passed. The
-- teacher-ownership policies above are untouched.
-- =========================================================================

create policy "homework_vocab_words_insert_admin" on public.homework_vocab_words
  for insert with check (public.is_admin());
create policy "homework_vocab_words_update_admin" on public.homework_vocab_words
  for update using (public.is_admin()) with check (public.is_admin());
create policy "homework_vocab_words_delete_admin" on public.homework_vocab_words
  for delete using (public.is_admin());

create policy "homework_vocab_tasks_insert_admin" on public.homework_vocab_tasks
  for insert with check (public.is_admin());
create policy "homework_vocab_tasks_update_admin" on public.homework_vocab_tasks
  for update using (public.is_admin()) with check (public.is_admin());
create policy "homework_vocab_tasks_delete_admin" on public.homework_vocab_tasks
  for delete using (public.is_admin());

create policy "homework_vocab_completions_select_admin" on public.homework_vocab_completions
  for select using (public.is_admin());
