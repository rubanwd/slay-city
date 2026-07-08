-- SLAY CITY — parent ↔ child account linking
--
-- A parent registers with their child's email. This migration lets a parent be
-- linked to that child's profile and read (only) that child's progress, so the
-- parent dashboard can show the child's real stats instead of the parent's own.
--
-- SECURITY NOTE: linking here is one-sided — a parent can link any registered
-- child by email without the child's consent. That is acceptable for the MVP
-- but a real launch should add a consent/approval step (e.g. the child confirms
-- the link, or links are only allowed within a family the parent created).

-- =========================================================================
-- Link table
-- =========================================================================

create table public.parent_child_links (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles (id) on delete cascade,
  child_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (parent_id, child_id)
);

create index parent_child_links_parent_id_idx on public.parent_child_links (parent_id);
create index parent_child_links_child_id_idx on public.parent_child_links (child_id);

alter table public.parent_child_links enable row level security;

-- A parent may read their own links. Inserts happen only through the
-- SECURITY DEFINER function below, so there is deliberately no insert policy or
-- insert grant for the authenticated role.
create policy "parent_child_links_select_own" on public.parent_child_links
  for select using (auth.uid() = parent_id);

grant select on public.parent_child_links to authenticated;
grant all on public.parent_child_links to service_role;

-- =========================================================================
-- Helper: is the given profile a child linked to the current caller?
-- SECURITY DEFINER + owned by postgres so the child-data policies below can
-- consult the link table without recursing into its own RLS.
-- =========================================================================

create or replace function public.is_linked_child(p_child_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.parent_child_links
    where parent_id = auth.uid() and child_id = p_child_id
  );
$$;

grant execute on function public.is_linked_child(uuid) to authenticated;

-- =========================================================================
-- Link a child to the calling parent, by the child's email.
--
-- Resolving an email to a user id requires reading auth.users, which is only
-- possible from a SECURITY DEFINER function owned by a privileged role. The
-- function verifies the caller is a parent/admin and that the target is a
-- registered child before creating the link, and returns a reason code the UI
-- can surface ("child_not_registered", etc.).
-- =========================================================================

create or replace function public.link_child_by_email(p_child_email text)
returns table (linked boolean, child_id uuid, reason text)
language plpgsql
security definer
set search_path = public
as $$
-- Resolve ambiguous names (e.g. the OUT column `child_id` vs the table column
-- in the INSERT below) to the table column.
#variable_conflict use_column
declare
  v_caller_role public.user_role;
  v_child_user_id uuid;
  v_child_role public.user_role;
begin
  select role into v_caller_role from public.profiles where id = auth.uid();
  if v_caller_role is null or v_caller_role not in ('parent', 'admin') then
    return query select false, null::uuid, 'not_parent';
    return;
  end if;

  select id into v_child_user_id
  from auth.users
  where lower(email) = lower(trim(p_child_email))
  order by created_at
  limit 1;

  if v_child_user_id is null then
    return query select false, null::uuid, 'child_not_registered';
    return;
  end if;

  select role into v_child_role from public.profiles where id = v_child_user_id;
  if v_child_role is null then
    return query select false, null::uuid, 'child_no_profile';
    return;
  end if;
  if v_child_role <> 'child' then
    return query select false, null::uuid, 'not_a_child';
    return;
  end if;

  insert into public.parent_child_links (parent_id, child_id)
  values (auth.uid(), v_child_user_id)
  on conflict (parent_id, child_id) do nothing;

  return query select true, v_child_user_id, 'ok';
end;
$$;

grant execute on function public.link_child_by_email(text) to authenticated;

-- =========================================================================
-- RLS: let a parent read (only) their linked child's profile and progress.
-- These are additive SELECT policies; existing "own row" policies still apply.
-- =========================================================================

create policy "profiles_select_linked_child" on public.profiles
  for select using (public.is_linked_child(id));

create policy "user_stats_select_linked_child" on public.user_stats
  for select using (public.is_linked_child(profile_id));

create policy "user_progress_select_linked_child" on public.user_progress
  for select using (public.is_linked_child(profile_id));
