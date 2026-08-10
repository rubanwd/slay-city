-- SLAY CITY — admin user management (list / provision / role change / delete)
--
-- The console could already manage teachers and the admin allow-list, but
-- nothing showed *everyone* who has an account, and there was no way to move a
-- single account between roles. Emails live in `auth.users`, which is invisible
-- to `authenticated`, so every operation here is a SECURITY DEFINER function
-- that re-checks `is_admin()` for the caller before it reads or writes anything.
--
-- Two deliberate side effects, so a change made here can't be silently undone
-- somewhere else:
--   * demoting an admin (or deleting their account) also drops their email from
--     `admin_emails` — otherwise `claim_admin()` would hand the role straight
--     back on their next login.
--   * leaving the `teacher` role deletes that teacher's groups, exactly like
--     `revoke_teacher()` already does.

-- =========================================================================
-- Username derivation for accounts that never finished onboarding.
-- Mirrors `deriveUsername` in src/features/auth/roleRouting.ts: the email's
-- local part, stripped to safe characters, with a random suffix on collision.
-- =========================================================================

create or replace function public.admin_derive_username(p_email text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_base text;
  v_candidate text;
  v_attempt integer := 0;
begin
  v_base := regexp_replace(split_part(coalesce(p_email, ''), '@', 1), '[^a-zA-Z0-9_ ]', '', 'g');
  v_base := left(trim(v_base), 20);
  if length(v_base) < 2 then
    v_base := 'user';
  end if;

  v_candidate := v_base;
  while v_attempt < 20 and exists (
    select 1 from public.profiles where lower(username) = lower(v_candidate)
  ) loop
    v_attempt := v_attempt + 1;
    v_candidate := left(v_base, 14) || '_' || substr(md5(random()::text), 1, 4);
  end loop;

  return v_candidate;
end;
$$;

-- Internal helper — never called from the client.
revoke execute on function public.admin_derive_username(text) from public;

-- =========================================================================
-- admin_list_users(): every account, newest first, with the email that only
-- `auth.users` knows. Accounts that registered but never finished onboarding
-- have no profile row yet, so `username`/`role` come back null and
-- `has_profile` is false — the admin screen shows them so they can be given a
-- role (which creates the profile) or removed.
--
-- `total_count` is the size of the filtered set, repeated on every row, so the
-- page can show "showing 50 of 214" without a second round trip.
-- =========================================================================

create or replace function public.admin_list_users(
  p_search text default null,
  p_role text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id uuid,
  username text,
  email text,
  role public.user_role,
  level public.knowledge_level,
  created_at timestamptz,
  has_profile boolean,
  is_confirmed boolean,
  total_count bigint
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_search text := nullif(btrim(coalesce(p_search, '')), '');
  v_role text := nullif(btrim(coalesce(p_role, '')), '');
  v_limit integer := least(greatest(coalesce(p_limit, 50), 1), 200);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
begin
  if not public.is_admin() then
    return;
  end if;

  -- An unknown role filter would silently mean "no filter"; treat it as
  -- "nothing matches" instead, so a typo can't look like the full list.
  if v_role is not null and not (v_role = any (enum_range(null::public.user_role)::text[])) then
    return;
  end if;

  return query
  select
    u.id,
    p.username,
    u.email::text,
    p.role,
    p.level,
    u.created_at,
    (p.id is not null),
    (u.email_confirmed_at is not null),
    count(*) over ()
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.deleted_at is null
    and (v_role is null or p.role::text = v_role)
    and (
      v_search is null
      or u.email ilike '%' || v_search || '%'
      or p.username ilike '%' || v_search || '%'
    )
  order by u.created_at desc
  limit v_limit offset v_offset;
end;
$$;

grant execute on function public.admin_list_users(text, text, integer, integer) to authenticated;

-- =========================================================================
-- admin_create_profile(): gives a freshly registered account its profile row.
-- The account itself is created through the normal `auth.signUp` API from the
-- server action (this project has no service-role key), and this fills in the
-- profile the same way onboarding would — including the zeroed `user_stats`
-- row every gameplay screen expects.
-- =========================================================================

create or replace function public.admin_create_profile(
  p_user_id uuid,
  p_username text,
  p_role text,
  p_level text default null
)
returns table (success boolean, reason text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role public.user_role;
  v_level public.knowledge_level;
  v_username text := btrim(coalesce(p_username, ''));
begin
  if not public.is_admin() then
    return query select false, 'not_admin';
    return;
  end if;

  if p_role is null or not (p_role = any (enum_range(null::public.user_role)::text[])) then
    return query select false, 'invalid_role';
    return;
  end if;
  v_role := p_role::public.user_role;

  if p_level is null or p_level = '' then
    v_level := 'elementary';
  elsif p_level = any (enum_range(null::public.knowledge_level)::text[]) then
    v_level := p_level::public.knowledge_level;
  else
    return query select false, 'invalid_level';
    return;
  end if;

  if v_username = '' then
    return query select false, 'invalid_username';
    return;
  end if;

  if not exists (select 1 from auth.users where id = p_user_id and deleted_at is null) then
    return query select false, 'user_not_found';
    return;
  end if;

  if exists (select 1 from public.profiles where id = p_user_id) then
    return query select false, 'profile_exists';
    return;
  end if;

  if exists (select 1 from public.profiles where lower(username) = lower(v_username)) then
    return query select false, 'username_taken';
    return;
  end if;

  insert into public.profiles (id, username, role, level)
  values (p_user_id, v_username, v_role, v_level);

  -- Students and parents both land on screens that read `user_stats`; teachers
  -- and admins never do.
  if v_role in ('student', 'parent') then
    insert into public.user_stats (profile_id)
    values (p_user_id)
    on conflict (profile_id) do nothing;
  end if;

  return query select true, 'ok';
end;
$$;

grant execute on function public.admin_create_profile(uuid, text, text, text) to authenticated;

-- =========================================================================
-- admin_set_user_role(): moves one account between the four roles. Creates the
-- profile first if the account never finished onboarding, so an admin can fix
-- a half-registered user from the same screen.
-- =========================================================================

create or replace function public.admin_set_user_role(p_profile_id uuid, p_role text)
returns table (success boolean, reason text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role public.user_role;
  v_current public.user_role;
  v_email text;
begin
  if not public.is_admin() then
    return query select false, 'not_admin';
    return;
  end if;

  if p_profile_id = auth.uid() then
    -- An admin demoting themselves would lose the console mid-click, with no
    -- way back in. Someone else has to do it.
    return query select false, 'cannot_change_self';
    return;
  end if;

  if p_role is null or not (p_role = any (enum_range(null::public.user_role)::text[])) then
    return query select false, 'invalid_role';
    return;
  end if;
  v_role := p_role::public.user_role;

  select email into v_email from auth.users where id = p_profile_id and deleted_at is null;
  if v_email is null then
    return query select false, 'user_not_found';
    return;
  end if;

  select role into v_current from public.profiles where id = p_profile_id;

  if v_current is null then
    insert into public.profiles (id, username, role)
    values (p_profile_id, public.admin_derive_username(v_email), v_role);
  elsif v_current = v_role then
    return query select true, 'unchanged';
    return;
  else
    update public.profiles set role = v_role where id = p_profile_id;
  end if;

  -- Leaving `teacher` takes the teacher's groups with it (memberships cascade),
  -- matching `revoke_teacher()`.
  if v_current = 'teacher' and v_role <> 'teacher' then
    delete from public.teacher_groups where teacher_id = p_profile_id;
  end if;

  -- Leaving `admin` has to clear the allow-list too, or `claim_admin()` would
  -- restore the role at their next login.
  if v_current = 'admin' and v_role <> 'admin' then
    delete from public.admin_emails where lower(email) = lower(v_email);
  end if;

  if v_role in ('student', 'parent') then
    insert into public.user_stats (profile_id)
    values (p_profile_id)
    on conflict (profile_id) do nothing;
  end if;

  return query select true, 'ok';
end;
$$;

grant execute on function public.admin_set_user_role(uuid, text) to authenticated;

-- =========================================================================
-- admin_delete_user(): removes the account itself. Everything the user owns
-- hangs off `profiles` (or `auth.users`) with `on delete cascade`, so deleting
-- the auth row clears progress, stats, wardrobe, groups and homework with it.
-- =========================================================================

create or replace function public.admin_delete_user(p_profile_id uuid)
returns table (success boolean, reason text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text;
begin
  if not public.is_admin() then
    return query select false, 'not_admin';
    return;
  end if;

  if p_profile_id = auth.uid() then
    return query select false, 'cannot_delete_self';
    return;
  end if;

  select email into v_email from auth.users where id = p_profile_id;
  if v_email is null then
    return query select false, 'user_not_found';
    return;
  end if;

  -- Without this, re-registering the same email would silently come back as an
  -- admin (see `claim_admin()`).
  delete from public.admin_emails where lower(email) = lower(v_email);
  delete from auth.users where id = p_profile_id;

  return query select true, 'ok';
end;
$$;

grant execute on function public.admin_delete_user(uuid) to authenticated;
