-- SLAY CITY — homework grammar (rule cards + an AI-generated test per topic)
--
-- A second learning module on a homework topic, built by analogy with the
-- vocabulary flow (20260721000002_homework_vocabulary.sql). A teacher attaches
-- a set of grammar points (a rule title, a short kid-friendly explanation, an
-- example sentence) to a topic, plus a short test whose questions are authored
-- by the AI (fill-in-the-blank / choose-the-correct-form) from the existing
-- `mission_task_type` catalog. A child steps through the grammar cards one at a
-- time, then takes the test; finishing the whole flow records a completion so
-- both the child and the teacher can see who has "passed the grammar".
--
-- Kept in dedicated tables (mirroring the vocab tables) so each module is
-- independent. Like the rest of homework this grants no XP/coins/streak. RLS
-- mirrors the vocabulary tables exactly: visible to the owning teacher (via
-- `teacher_groups`) and to member children (via the topic's own visibility);
-- points/tasks are teacher-write only, completions are child-write-own +
-- teacher-read, with additive admin "view as teacher" parity.

-- =========================================================================
-- Tables
-- =========================================================================

create table public.homework_grammar_points (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.homework_topics (id) on delete cascade,
  title text not null,
  explanation text not null,
  example text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index homework_grammar_points_topic_id_idx on public.homework_grammar_points (topic_id);

create table public.homework_grammar_tasks (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.homework_topics (id) on delete cascade,
  task_type public.mission_task_type not null,
  content jsonb not null default '{}'::jsonb,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index homework_grammar_tasks_topic_id_idx on public.homework_grammar_tasks (topic_id);

create table public.homework_grammar_completions (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.homework_topics (id) on delete cascade,
  child_id uuid not null references public.profiles (id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (topic_id, child_id)
);

create index homework_grammar_completions_child_id_idx on public.homework_grammar_completions (child_id);
create index homework_grammar_completions_topic_id_idx on public.homework_grammar_completions (topic_id);

alter table public.homework_grammar_points enable row level security;
alter table public.homework_grammar_tasks enable row level security;
alter table public.homework_grammar_completions enable row level security;

-- =========================================================================
-- RLS: homework_grammar_points
-- =========================================================================

create policy "homework_grammar_points_select" on public.homework_grammar_points
  for select using (
    exists (select 1 from public.homework_topics t where t.id = topic_id)
  );

create policy "homework_grammar_points_insert_teacher" on public.homework_grammar_points
  for insert with check (
    exists (
      select 1 from public.homework_topics t
      join public.teacher_groups g on g.id = t.group_id
      where t.id = topic_id and g.teacher_id = auth.uid()
    )
  );

create policy "homework_grammar_points_update_teacher" on public.homework_grammar_points
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

create policy "homework_grammar_points_delete_teacher" on public.homework_grammar_points
  for delete using (
    exists (
      select 1 from public.homework_topics t
      join public.teacher_groups g on g.id = t.group_id
      where t.id = topic_id and g.teacher_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.homework_grammar_points to authenticated;

-- =========================================================================
-- RLS: homework_grammar_tasks  (identical shape to the points policies)
-- =========================================================================

create policy "homework_grammar_tasks_select" on public.homework_grammar_tasks
  for select using (
    exists (select 1 from public.homework_topics t where t.id = topic_id)
  );

create policy "homework_grammar_tasks_insert_teacher" on public.homework_grammar_tasks
  for insert with check (
    exists (
      select 1 from public.homework_topics t
      join public.teacher_groups g on g.id = t.group_id
      where t.id = topic_id and g.teacher_id = auth.uid()
    )
  );

create policy "homework_grammar_tasks_update_teacher" on public.homework_grammar_tasks
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

create policy "homework_grammar_tasks_delete_teacher" on public.homework_grammar_tasks
  for delete using (
    exists (
      select 1 from public.homework_topics t
      join public.teacher_groups g on g.id = t.group_id
      where t.id = topic_id and g.teacher_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.homework_grammar_tasks to authenticated;

-- =========================================================================
-- RLS: homework_grammar_completions
-- =========================================================================

create policy "homework_grammar_completions_select" on public.homework_grammar_completions
  for select using (
    child_id = auth.uid()
    or exists (
      select 1 from public.homework_topics t
      join public.teacher_groups g on g.id = t.group_id
      where t.id = topic_id and g.teacher_id = auth.uid()
    )
  );

create policy "homework_grammar_completions_insert_own" on public.homework_grammar_completions
  for insert with check (
    child_id = auth.uid()
    and exists (select 1 from public.homework_topics t where t.id = topic_id)
  );

create policy "homework_grammar_completions_delete_own" on public.homework_grammar_completions
  for delete using (child_id = auth.uid());

grant select, insert, delete on public.homework_grammar_completions to authenticated;

-- =========================================================================
-- Admin "View as Teacher" parity (mirrors the vocabulary admin policies).
-- =========================================================================

create policy "homework_grammar_points_insert_admin" on public.homework_grammar_points
  for insert with check (public.is_admin());
create policy "homework_grammar_points_update_admin" on public.homework_grammar_points
  for update using (public.is_admin()) with check (public.is_admin());
create policy "homework_grammar_points_delete_admin" on public.homework_grammar_points
  for delete using (public.is_admin());

create policy "homework_grammar_tasks_insert_admin" on public.homework_grammar_tasks
  for insert with check (public.is_admin());
create policy "homework_grammar_tasks_update_admin" on public.homework_grammar_tasks
  for update using (public.is_admin()) with check (public.is_admin());
create policy "homework_grammar_tasks_delete_admin" on public.homework_grammar_tasks
  for delete using (public.is_admin());

create policy "homework_grammar_completions_select_admin" on public.homework_grammar_completions
  for select using (public.is_admin());
