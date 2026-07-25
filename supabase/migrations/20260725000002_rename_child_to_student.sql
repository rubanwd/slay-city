-- SLAY CITY — rename every "child" schema object to "student"
--
-- Follow-up to 20260725000001_rename_child_role_to_student.sql, which renamed
-- the `user_role` enum label. This file renames the tables, columns, indexes,
-- constraints, policies and functions that carried the old wording, and
-- backfills the one place the old wording lives in *data*: the auth user
-- metadata a parent registers with.
--
-- Renames are used wherever possible (`ALTER TABLE ... RENAME COLUMN` and
-- friends) so no data is copied and no foreign keys are rebuilt. Policy
-- expressions and index definitions reference columns by attribute number, so
-- they follow a column rename automatically. Function bodies, by contrast, are
-- stored as text — every function that reads a renamed column is recreated
-- below.

-- =========================================================================
-- parent_child_links -> parent_student_links
-- =========================================================================

alter table public.parent_child_links rename to parent_student_links;
alter table public.parent_student_links rename column child_id to student_id;

alter index public.parent_child_links_pkey rename to parent_student_links_pkey;
alter index public.parent_child_links_parent_id_idx rename to parent_student_links_parent_id_idx;
alter index public.parent_child_links_child_id_idx rename to parent_student_links_student_id_idx;
alter index public.parent_child_links_parent_id_child_id_key
  rename to parent_student_links_parent_id_student_id_key;

alter table public.parent_student_links
  rename constraint parent_child_links_parent_id_fkey to parent_student_links_parent_id_fkey;
alter table public.parent_student_links
  rename constraint parent_child_links_child_id_fkey to parent_student_links_student_id_fkey;

alter policy "parent_child_links_select_own" on public.parent_student_links
  rename to "parent_student_links_select_own";

-- =========================================================================
-- teacher_group_members.child_id -> student_id
-- =========================================================================

alter table public.teacher_group_members rename column child_id to student_id;

alter index public.teacher_group_members_child_id_idx
  rename to teacher_group_members_student_id_idx;
alter index public.teacher_group_members_group_id_child_id_key
  rename to teacher_group_members_group_id_student_id_key;

alter table public.teacher_group_members
  rename constraint teacher_group_members_child_id_fkey to teacher_group_members_student_id_fkey;

-- =========================================================================
-- homework completions: child_id -> student_id
-- =========================================================================

alter table public.homework_vocab_completions rename column child_id to student_id;

alter index public.homework_vocab_completions_child_id_idx
  rename to homework_vocab_completions_student_id_idx;
alter index public.homework_vocab_completions_topic_id_child_id_key
  rename to homework_vocab_completions_topic_id_student_id_key;

alter table public.homework_vocab_completions
  rename constraint homework_vocab_completions_child_id_fkey
  to homework_vocab_completions_student_id_fkey;

alter table public.homework_grammar_completions rename column child_id to student_id;

alter index public.homework_grammar_completions_child_id_idx
  rename to homework_grammar_completions_student_id_idx;
alter index public.homework_grammar_completions_topic_id_child_id_key
  rename to homework_grammar_completions_topic_id_student_id_key;

alter table public.homework_grammar_completions
  rename constraint homework_grammar_completions_child_id_fkey
  to homework_grammar_completions_student_id_fkey;

-- =========================================================================
-- is_linked_child() -> is_linked_student()
--
-- The parameter name changes too, so this cannot be a CREATE OR REPLACE
-- (Postgres refuses to rename an input parameter). The three policies that
-- call it are dropped and recreated around the swap.
-- =========================================================================

drop policy "profiles_select_linked_child" on public.profiles;
drop policy "user_stats_select_linked_child" on public.user_stats;
drop policy "user_progress_select_linked_child" on public.user_progress;

drop function if exists public.is_linked_child(uuid);

create function public.is_linked_student(p_student_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.parent_student_links
    where parent_id = auth.uid() and student_id = p_student_id
  );
$$;

grant execute on function public.is_linked_student(uuid) to authenticated;

create policy "profiles_select_linked_student" on public.profiles
  for select using (public.is_linked_student(id));

create policy "user_stats_select_linked_student" on public.user_stats
  for select using (public.is_linked_student(profile_id));

create policy "user_progress_select_linked_student" on public.user_progress
  for select using (public.is_linked_student(profile_id));

-- =========================================================================
-- teaches_child() -> teaches_student()
-- =========================================================================

drop policy "profiles_select_group_child" on public.profiles;
drop policy "user_stats_select_group_child" on public.user_stats;
drop policy "user_progress_select_group_child" on public.user_progress;

drop function if exists public.teaches_child(uuid);

create function public.teaches_student(p_student_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.teacher_group_members m
    join public.teacher_groups g on g.id = m.group_id
    where g.teacher_id = auth.uid() and m.student_id = p_student_id
  );
$$;

grant execute on function public.teaches_student(uuid) to authenticated;

create policy "profiles_select_group_student" on public.profiles
  for select using (public.teaches_student(id));

create policy "user_stats_select_group_student" on public.user_stats
  for select using (public.teaches_student(profile_id));

create policy "user_progress_select_group_student" on public.user_progress
  for select using (public.teaches_student(profile_id));

-- =========================================================================
-- link_child_by_email() -> link_student_by_email()
--
-- Same contract as before, with the reason codes renamed to match
-- ("student_not_registered", "student_no_profile", "not_a_student"). The role
-- check now compares against the renamed 'student' enum label.
-- =========================================================================

drop function if exists public.link_child_by_email(text);

create function public.link_student_by_email(p_student_email text)
returns table (linked boolean, student_id uuid, reason text)
language plpgsql
security definer
set search_path = public
as $$
-- Resolve ambiguous names (e.g. the OUT column `student_id` vs the table column
-- in the INSERT below) to the table column.
#variable_conflict use_column
declare
  v_caller_role public.user_role;
  v_student_user_id uuid;
  v_student_role public.user_role;
begin
  select role into v_caller_role from public.profiles where id = auth.uid();
  if v_caller_role is null or v_caller_role not in ('parent', 'admin') then
    return query select false, null::uuid, 'not_parent';
    return;
  end if;

  select id into v_student_user_id
  from auth.users
  where lower(email) = lower(trim(p_student_email))
  order by created_at
  limit 1;

  if v_student_user_id is null then
    return query select false, null::uuid, 'student_not_registered';
    return;
  end if;

  select role into v_student_role from public.profiles where id = v_student_user_id;
  if v_student_role is null then
    return query select false, null::uuid, 'student_no_profile';
    return;
  end if;
  if v_student_role <> 'student' then
    return query select false, null::uuid, 'not_a_student';
    return;
  end if;

  insert into public.parent_student_links (parent_id, student_id)
  values (auth.uid(), v_student_user_id)
  on conflict (parent_id, student_id) do nothing;

  return query select true, v_student_user_id, 'ok';
end;
$$;

grant execute on function public.link_student_by_email(text) to authenticated;

-- =========================================================================
-- Functions whose *body* reads a renamed column. Names and signatures are
-- unchanged, so CREATE OR REPLACE is enough and no policy churn is needed.
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
    where m.group_id = p_group_id and m.student_id = auth.uid()
  );
$$;

create or replace function public.my_groups()
returns table (group_id uuid, group_name text, teacher_id uuid, teacher_username text)
language sql
security definer
set search_path = public
stable
as $$
  select g.id, g.name, g.teacher_id, p.username
  from public.teacher_group_members m
  join public.teacher_groups g on g.id = m.group_id
  join public.profiles p on p.id = g.teacher_id
  where m.student_id = auth.uid();
$$;

create or replace function public.complete_homework_vocab(p_topic_id uuid)
returns table (already_completed boolean, xp_earned integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile uuid := auth.uid();
  v_group uuid;
  v_xp constant integer := 50;
begin
  if v_profile is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  -- The topic (and thus its group) must exist, and the caller must be a member
  -- of that group — a student can only earn XP for homework actually assigned
  -- to them. `is_group_member` is the same SECURITY DEFINER membership check
  -- the homework RLS policies use.
  select group_id into v_group
  from public.homework_topics
  where id = p_topic_id;

  if not found then
    raise exception 'Topic not found' using errcode = 'P0002';
  end if;

  if not public.is_group_member(v_group) then
    raise exception 'Not a member of this group' using errcode = '42501';
  end if;

  insert into public.homework_vocab_completions (topic_id, student_id)
  values (p_topic_id, v_profile)
  on conflict (topic_id, student_id) do nothing;

  if not found then
    -- Already passed previously (or by a concurrent request) — no re-grant.
    already_completed := true;
    xp_earned := 0;
    return next;
    return;
  end if;

  update public.user_stats
  set xp = xp + v_xp
  where profile_id = v_profile;

  already_completed := false;
  xp_earned := v_xp;
  return next;
end;
$$;

create or replace function public.complete_homework_grammar(p_topic_id uuid)
returns table (already_completed boolean, xp_earned integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile uuid := auth.uid();
  v_group uuid;
  v_xp constant integer := 50;
begin
  if v_profile is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select group_id into v_group
  from public.homework_topics
  where id = p_topic_id;

  if not found then
    raise exception 'Topic not found' using errcode = 'P0002';
  end if;

  if not public.is_group_member(v_group) then
    raise exception 'Not a member of this group' using errcode = '42501';
  end if;

  insert into public.homework_grammar_completions (topic_id, student_id)
  values (p_topic_id, v_profile)
  on conflict (topic_id, student_id) do nothing;

  if not found then
    already_completed := true;
    xp_earned := 0;
    return next;
    return;
  end if;

  update public.user_stats
  set xp = xp + v_xp
  where profile_id = v_profile;

  already_completed := false;
  xp_earned := v_xp;
  return next;
end;
$$;
