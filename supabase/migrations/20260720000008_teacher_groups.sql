-- SLAY CITY — teacher groups
--
-- A teacher manages one or more groups, each containing existing `child`
-- accounts assigned by an admin. Teachers get read-only access to their group
-- children's profile/stats/progress, mirroring the parent<->child link setup
-- in 20260708000001_parent_child_linking.sql, but keyed off group membership
-- instead of a single link row.
--
-- Teacher accounts are never self-registered: an admin promotes an existing
-- profile via `promote_teacher()`, and can later `revoke_teacher()`. Both are
-- SECURITY DEFINER functions because `profiles_update_own` only lets a user
-- update their own row — admins have no direct UPDATE access to other users'
-- profiles via RLS, only SELECT.

-- =========================================================================
-- Tables
-- =========================================================================

create table public.teacher_groups (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index teacher_groups_teacher_id_idx on public.teacher_groups (teacher_id);

create table public.teacher_group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.teacher_groups (id) on delete cascade,
  child_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (group_id, child_id)
);

create index teacher_group_members_group_id_idx on public.teacher_group_members (group_id);
create index teacher_group_members_child_id_idx on public.teacher_group_members (child_id);

alter table public.teacher_groups enable row level security;
alter table public.teacher_group_members enable row level security;

-- =========================================================================
-- RLS: groups and their members are admin-managed (like districts/missions);
-- a teacher may only read their own groups/members.
-- =========================================================================

create policy "teacher_groups_select_own_or_admin" on public.teacher_groups
  for select using (teacher_id = auth.uid() or public.is_admin());

create policy "teacher_groups_insert_admin" on public.teacher_groups
  for insert with check (public.is_admin());

create policy "teacher_groups_update_admin" on public.teacher_groups
  for update using (public.is_admin()) with check (public.is_admin());

create policy "teacher_groups_delete_admin" on public.teacher_groups
  for delete using (public.is_admin());

grant select, insert, update, delete on public.teacher_groups to authenticated;

create policy "teacher_group_members_select_own_or_admin" on public.teacher_group_members
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.teacher_groups g
      where g.id = group_id and g.teacher_id = auth.uid()
    )
  );

create policy "teacher_group_members_insert_admin" on public.teacher_group_members
  for insert with check (public.is_admin());

create policy "teacher_group_members_delete_admin" on public.teacher_group_members
  for delete using (public.is_admin());

grant select, insert, delete on public.teacher_group_members to authenticated;

-- =========================================================================
-- Helper: is the given profile a child in one of the caller's (as teacher)
-- groups? SECURITY DEFINER + owned by postgres so the child-data policies
-- below can consult group membership without recursing into their own RLS.
-- =========================================================================

create or replace function public.teaches_child(p_child_id uuid)
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
    where g.teacher_id = auth.uid() and m.child_id = p_child_id
  );
$$;

grant execute on function public.teaches_child(uuid) to authenticated;

-- =========================================================================
-- RLS: let a teacher read (only) their group children's profile and progress.
-- These are additive SELECT policies; existing "own row" policies still apply.
-- =========================================================================

create policy "profiles_select_group_child" on public.profiles
  for select using (public.teaches_child(id));

create policy "user_stats_select_group_child" on public.user_stats
  for select using (public.teaches_child(profile_id));

create policy "user_progress_select_group_child" on public.user_progress
  for select using (public.teaches_child(profile_id));

-- =========================================================================
-- promote_teacher(): admin-only. Resolves an existing account by username or
-- email and sets its role to 'teacher'.
-- =========================================================================

create or replace function public.promote_teacher(p_identifier text)
returns table (success boolean, profile_id uuid, username text, reason text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_caller_role public.user_role;
  v_target_id uuid;
  v_target_username text;
  v_target_role public.user_role;
  v_ident text := trim(p_identifier);
begin
  select role into v_caller_role from public.profiles where id = auth.uid();
  if v_caller_role is null or v_caller_role <> 'admin' then
    return query select false, null::uuid, null::text, 'not_admin';
    return;
  end if;

  select id, username, role into v_target_id, v_target_username, v_target_role
  from public.profiles
  where lower(username) = lower(v_ident);

  if v_target_id is null then
    select p.id, p.username, p.role into v_target_id, v_target_username, v_target_role
    from public.profiles p
    join auth.users u on u.id = p.id
    where lower(u.email) = lower(v_ident)
    order by u.created_at
    limit 1;
  end if;

  if v_target_id is null then
    return query select false, null::uuid, null::text, 'user_not_found';
    return;
  end if;

  if v_target_role = 'admin' then
    return query select false, v_target_id, v_target_username, 'already_admin';
    return;
  end if;

  if v_target_role = 'teacher' then
    return query select false, v_target_id, v_target_username, 'already_teacher';
    return;
  end if;

  update public.profiles set role = 'teacher' where id = v_target_id;

  return query select true, v_target_id, v_target_username, 'ok';
end;
$$;

grant execute on function public.promote_teacher(text) to authenticated;

-- =========================================================================
-- revoke_teacher(): admin-only. Deletes the teacher's groups (cascades their
-- members) and demotes the account back to 'parent'.
-- =========================================================================

create or replace function public.revoke_teacher(p_profile_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role public.user_role;
  v_target_role public.user_role;
begin
  select role into v_caller_role from public.profiles where id = auth.uid();
  if v_caller_role is null or v_caller_role <> 'admin' then
    return false;
  end if;

  select role into v_target_role from public.profiles where id = p_profile_id;
  if v_target_role is distinct from 'teacher' then
    return false;
  end if;

  delete from public.teacher_groups where teacher_id = p_profile_id;
  update public.profiles set role = 'parent' where id = p_profile_id;
  return true;
end;
$$;

grant execute on function public.revoke_teacher(uuid) to authenticated;
