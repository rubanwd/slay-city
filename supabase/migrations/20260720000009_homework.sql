-- SLAY CITY — homework (topics + tasks per teacher group)
--
-- A teacher authors "homework" for one of their groups: a lesson topic
-- (title/description, editable/deletable) containing tasks that reuse the
-- exact same `mission_task_type` catalog and `content` JSON shape as
-- `mission_tasks` — so the child-facing runner is just `TaskRunner` fed a
-- different row source, and the teacher-facing editor is just
-- `AdminTaskContentFields` fed a different set of server actions.
--
-- Unlike mission content, homework has no draft/publish workflow: a teacher
-- authoring for their own group's kids doesn't need a review step, so a
-- topic/task is visible to the group the moment it's created.
--
-- Completion is tracked per child per task (`homework_task_completions`) so
-- the child can resume a topic and see what's left, but — deliberately —
-- grants no XP/coins/streak: homework is teacher-assigned practice, not part
-- of the map's reward loop.

-- =========================================================================
-- Helper: is the caller (as a child) a member of the given group? Needed
-- because `teacher_group_members` only grants SELECT to the owning teacher
-- or an admin (see 20260720000008_teacher_groups.sql) — a child has no direct
-- read access to that table, so RLS on the homework tables below must go
-- through this SECURITY DEFINER bypass, mirroring `teaches_child`.
-- =========================================================================

create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.teacher_group_members m
    where m.group_id = p_group_id and m.child_id = auth.uid()
  );
$$;

grant execute on function public.is_group_member(uuid) to authenticated;

-- =========================================================================
-- my_groups(): lets a child list the groups they belong to (group id, name,
-- teacher id) without needing direct SELECT on `teacher_group_members` /
-- `teacher_groups`. Drives both the "does the Homework tab appear" check and
-- the homework list page's group labels.
-- =========================================================================

create or replace function public.my_groups()
returns table (group_id uuid, group_name text, teacher_id uuid)
language sql
security definer
set search_path = public
stable
as $$
  select g.id, g.name, g.teacher_id
  from public.teacher_group_members m
  join public.teacher_groups g on g.id = m.group_id
  where m.child_id = auth.uid();
$$;

grant execute on function public.my_groups() to authenticated;

-- =========================================================================
-- Tables
-- =========================================================================

create table public.homework_topics (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.teacher_groups (id) on delete cascade,
  title text not null,
  description text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index homework_topics_group_id_idx on public.homework_topics (group_id);

create table public.homework_tasks (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.homework_topics (id) on delete cascade,
  task_type public.mission_task_type not null,
  content jsonb not null default '{}'::jsonb,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index homework_tasks_topic_id_idx on public.homework_tasks (topic_id);

create table public.homework_task_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.homework_tasks (id) on delete cascade,
  child_id uuid not null references public.profiles (id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (task_id, child_id)
);

create index homework_task_completions_child_id_idx on public.homework_task_completions (child_id);
create index homework_task_completions_task_id_idx on public.homework_task_completions (task_id);

alter table public.homework_topics enable row level security;
alter table public.homework_tasks enable row level security;
alter table public.homework_task_completions enable row level security;

-- =========================================================================
-- RLS: homework_topics
--
-- Teacher-ownership checks are plain EXISTS subqueries against
-- `teacher_groups` (not a SECURITY DEFINER function) because that table's own
-- "select own or admin" policy already lets a teacher see their own row —
-- no bypass needed there, only for the child-membership side.
-- =========================================================================

create policy "homework_topics_select" on public.homework_topics
  for select using (
    public.is_admin()
    or public.is_group_member(group_id)
    or exists (
      select 1 from public.teacher_groups g
      where g.id = group_id and g.teacher_id = auth.uid()
    )
  );

create policy "homework_topics_insert_teacher" on public.homework_topics
  for insert with check (
    exists (
      select 1 from public.teacher_groups g
      where g.id = group_id and g.teacher_id = auth.uid()
    )
  );

create policy "homework_topics_update_teacher" on public.homework_topics
  for update using (
    exists (
      select 1 from public.teacher_groups g
      where g.id = group_id and g.teacher_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.teacher_groups g
      where g.id = group_id and g.teacher_id = auth.uid()
    )
  );

create policy "homework_topics_delete_teacher" on public.homework_topics
  for delete using (
    exists (
      select 1 from public.teacher_groups g
      where g.id = group_id and g.teacher_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.homework_topics to authenticated;

-- =========================================================================
-- RLS: homework_tasks
--
-- SELECT is a subquery against `homework_topics` — deliberately *not* a
-- SECURITY DEFINER bypass, so it inherits exactly whatever that table's own
-- policy already grants the caller (teacher-owns or child-member). Write
-- policies re-check teacher ownership directly through `teacher_groups`,
-- same reasoning as above.
-- =========================================================================

create policy "homework_tasks_select" on public.homework_tasks
  for select using (
    exists (select 1 from public.homework_topics t where t.id = topic_id)
  );

create policy "homework_tasks_insert_teacher" on public.homework_tasks
  for insert with check (
    exists (
      select 1 from public.homework_topics t
      join public.teacher_groups g on g.id = t.group_id
      where t.id = topic_id and g.teacher_id = auth.uid()
    )
  );

create policy "homework_tasks_update_teacher" on public.homework_tasks
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

create policy "homework_tasks_delete_teacher" on public.homework_tasks
  for delete using (
    exists (
      select 1 from public.homework_topics t
      join public.teacher_groups g on g.id = t.group_id
      where t.id = topic_id and g.teacher_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.homework_tasks to authenticated;

-- =========================================================================
-- RLS: homework_task_completions
--
-- A child may record/read only their own completions, restricted to tasks
-- they can actually see (the `homework_tasks` SELECT policy above). A teacher
-- may read (not write) completions for tasks in groups they own, to see
-- their group's homework progress later.
-- =========================================================================

create policy "homework_completions_select" on public.homework_task_completions
  for select using (
    child_id = auth.uid()
    or exists (
      select 1 from public.homework_tasks ht
      join public.homework_topics t on t.id = ht.topic_id
      join public.teacher_groups g on g.id = t.group_id
      where ht.id = task_id and g.teacher_id = auth.uid()
    )
  );

create policy "homework_completions_insert_own" on public.homework_task_completions
  for insert with check (
    child_id = auth.uid()
    and exists (select 1 from public.homework_tasks ht where ht.id = task_id)
  );

create policy "homework_completions_delete_own" on public.homework_task_completions
  for delete using (child_id = auth.uid());

grant select, insert, delete on public.homework_task_completions to authenticated;
