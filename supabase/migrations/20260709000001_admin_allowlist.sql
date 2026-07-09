-- SLAY CITY — admin allow-list
--
-- Problem: a profile's role can only be set once the profile row exists, but the
-- profile is created during onboarding. So "make me an admin before I register"
-- had nowhere to record the grant. This adds an allow-list of admin emails that
-- is checked at login: an allow-listed user is provisioned straight to an admin
-- profile, skipping onboarding entirely.

-- =========================================================================
-- Allow-list table (locked down: no authenticated access)
-- =========================================================================

create table public.admin_emails (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.admin_emails enable row level security;
-- No policies for `authenticated` on purpose — the allow-list must not be
-- readable or writable by end users. Only service_role and SECURITY DEFINER
-- functions (owned by postgres) touch it.
grant all on public.admin_emails to service_role;

-- =========================================================================
-- Promote allow-listed roles: permit a role change to 'admin' when the target
-- user's email is on the allow-list. This extends (replaces) the existing
-- escalation guard from the initial schema.
-- =========================================================================

create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and current_setting('request.jwt.claims', true) is not null
     and coalesce(auth.role(), '') <> 'service_role'
     and not public.is_admin()
     and not (
       new.role = 'admin'
       and exists (
         select 1
         from public.admin_emails ae
         join auth.users u on lower(u.email) = lower(ae.email)
         where u.id = new.id
       )
     )
  then
    raise exception 'Only admins can change a profile role';
  end if;
  return new;
end;
$$;

-- =========================================================================
-- claim_admin(): if the caller's email is allow-listed, ensure they have an
-- admin profile (creating or promoting it) and return true. Called on every
-- login; a cheap no-op for everyone not on the list.
-- =========================================================================

create or replace function public.claim_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  select email into v_email from auth.users where id = auth.uid();
  if v_email is null then
    return false;
  end if;

  if not exists (
    select 1 from public.admin_emails where lower(email) = lower(v_email)
  ) then
    return false;
  end if;

  -- Create the profile if missing, or promote an existing one. The username is
  -- derived from the uid so it never collides; admins don't pick a name.
  insert into public.profiles (id, username, role)
  values (auth.uid(), 'admin_' || substr(replace(auth.uid()::text, '-', ''), 1, 8), 'admin')
  on conflict (id) do update set role = 'admin';

  return true;
end;
$$;

grant execute on function public.claim_admin() to authenticated;
