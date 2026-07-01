-- SLAY CITY — initial MVP schema
-- Tables, enums, indexes, and Row Level Security policies for all 13 core tables.

create extension if not exists pgcrypto;

-- =========================================================================
-- Enums
-- =========================================================================

create type public.user_role as enum ('child', 'parent', 'admin');
create type public.mission_task_type as enum ('vocabulary', 'matching', 'listening', 'quiz');
create type public.ai_content_draft_status as enum ('pending', 'approved', 'rejected');

-- =========================================================================
-- Tables
-- =========================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  avatar_url text,
  role public.user_role not null default 'child',
  created_at timestamptz not null default now()
);

create table public.districts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  order_index integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null references public.districts (id) on delete cascade,
  name text not null,
  description text,
  order_index integer not null default 0,
  map_x numeric(6, 2),
  map_y numeric(6, 2),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.missions (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations (id) on delete cascade,
  title text not null,
  description text,
  xp_reward integer not null default 0,
  coin_reward integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vocabulary_items (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions (id) on delete cascade,
  word text not null,
  translation text not null,
  image_url text,
  audio_url text,
  example_sentence text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.mission_tasks (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions (id) on delete cascade,
  task_type public.mission_task_type not null,
  order_index integer not null default 0,
  content jsonb not null default '{}'::jsonb,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_progress (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  mission_id uuid not null references public.missions (id) on delete cascade,
  location_id uuid not null references public.locations (id) on delete cascade,
  completed_at timestamptz,
  score integer,
  created_at timestamptz not null default now(),
  unique (profile_id, mission_id)
);

create table public.user_stats (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  xp integer not null default 0,
  coins integer not null default 0,
  level integer not null default 1,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_activity_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wardrobe_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text,
  cost_coins integer not null default 0,
  item_type text not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_wardrobe_items (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  wardrobe_item_id uuid not null references public.wardrobe_items (id) on delete cascade,
  equipped boolean not null default false,
  acquired_at timestamptz not null default now(),
  unique (profile_id, wardrobe_item_id)
);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon_url text,
  condition_type text not null,
  condition_value integer not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  achievement_id uuid not null references public.achievements (id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique (profile_id, achievement_id)
);

create table public.ai_content_drafts (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions (id) on delete cascade,
  content jsonb not null,
  status public.ai_content_draft_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================================
-- Indexes on foreign keys / common lookups
-- =========================================================================

create index locations_district_id_idx on public.locations (district_id);
create index missions_location_id_idx on public.missions (location_id);
create index vocabulary_items_mission_id_idx on public.vocabulary_items (mission_id);
create index mission_tasks_mission_id_idx on public.mission_tasks (mission_id);
create index user_progress_profile_id_idx on public.user_progress (profile_id);
create index user_progress_mission_id_idx on public.user_progress (mission_id);
create index user_progress_location_id_idx on public.user_progress (location_id);
create index user_wardrobe_items_profile_id_idx on public.user_wardrobe_items (profile_id);
create index user_wardrobe_items_wardrobe_item_id_idx on public.user_wardrobe_items (wardrobe_item_id);
create index user_achievements_profile_id_idx on public.user_achievements (profile_id);
create index user_achievements_achievement_id_idx on public.user_achievements (achievement_id);
create index ai_content_drafts_mission_id_idx on public.ai_content_drafts (mission_id);

-- =========================================================================
-- updated_at maintenance trigger
-- =========================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger districts_set_updated_at before update on public.districts
  for each row execute function public.set_updated_at();
create trigger locations_set_updated_at before update on public.locations
  for each row execute function public.set_updated_at();
create trigger missions_set_updated_at before update on public.missions
  for each row execute function public.set_updated_at();
create trigger vocabulary_items_set_updated_at before update on public.vocabulary_items
  for each row execute function public.set_updated_at();
create trigger mission_tasks_set_updated_at before update on public.mission_tasks
  for each row execute function public.set_updated_at();
create trigger user_stats_set_updated_at before update on public.user_stats
  for each row execute function public.set_updated_at();
create trigger wardrobe_items_set_updated_at before update on public.wardrobe_items
  for each row execute function public.set_updated_at();
create trigger achievements_set_updated_at before update on public.achievements
  for each row execute function public.set_updated_at();
create trigger ai_content_drafts_set_updated_at before update on public.ai_content_drafts
  for each row execute function public.set_updated_at();

-- =========================================================================
-- Role helper (SECURITY DEFINER + table ownership lets this bypass RLS on
-- profiles, avoiding infinite recursion when a profiles policy needs to
-- know the caller's own role)
-- =========================================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Block self-service privilege escalation: only an admin (acting through
-- the API) may change a profile's role via PostgREST. Trusted callers are
-- exempt: service-role Edge Functions (auth.role() = 'service_role') and
-- direct database connections such as migrations or the SQL editor (no
-- request.jwt.claims present at all, since that only exists inside a
-- PostgREST request).
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
  then
    raise exception 'Only admins can change a profile role';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- =========================================================================
-- Row Level Security
-- =========================================================================

alter table public.profiles enable row level security;
alter table public.districts enable row level security;
alter table public.locations enable row level security;
alter table public.missions enable row level security;
alter table public.vocabulary_items enable row level security;
alter table public.mission_tasks enable row level security;
alter table public.user_progress enable row level security;
alter table public.user_stats enable row level security;
alter table public.wardrobe_items enable row level security;
alter table public.user_wardrobe_items enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.ai_content_drafts enable row level security;

-- profiles: user can read/update own row; admin can read all.
-- Insert is allowed for the user's own id so signup (createProfile) can
-- create the row; role changes are blocked by the trigger above.
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- user_progress / user_stats / user_wardrobe_items / user_achievements:
-- user can read/insert own rows only. No update policy is defined, so XP,
-- coins, streaks, progress, and wardrobe ownership can never be modified
-- from the browser — only via service-role Edge Functions, which bypass RLS.
create policy "user_progress_select_own" on public.user_progress
  for select using (auth.uid() = profile_id);
create policy "user_progress_insert_own" on public.user_progress
  for insert with check (auth.uid() = profile_id);

create policy "user_stats_select_own" on public.user_stats
  for select using (auth.uid() = profile_id);
create policy "user_stats_insert_own" on public.user_stats
  for insert with check (auth.uid() = profile_id);

create policy "user_wardrobe_items_select_own" on public.user_wardrobe_items
  for select using (auth.uid() = profile_id);
create policy "user_wardrobe_items_insert_own" on public.user_wardrobe_items
  for insert with check (auth.uid() = profile_id);

create policy "user_achievements_select_own" on public.user_achievements
  for select using (auth.uid() = profile_id);
create policy "user_achievements_insert_own" on public.user_achievements
  for insert with check (auth.uid() = profile_id);

-- Content tables: public read for published rows; admin-only insert/update.
-- Admins can also read unpublished (draft) rows so they can edit them.
create policy "districts_select_published_or_admin" on public.districts
  for select using (is_published or public.is_admin());
create policy "districts_insert_admin" on public.districts
  for insert with check (public.is_admin());
create policy "districts_update_admin" on public.districts
  for update using (public.is_admin()) with check (public.is_admin());

create policy "locations_select_published_or_admin" on public.locations
  for select using (is_published or public.is_admin());
create policy "locations_insert_admin" on public.locations
  for insert with check (public.is_admin());
create policy "locations_update_admin" on public.locations
  for update using (public.is_admin()) with check (public.is_admin());

create policy "missions_select_published_or_admin" on public.missions
  for select using (is_published or public.is_admin());
create policy "missions_insert_admin" on public.missions
  for insert with check (public.is_admin());
create policy "missions_update_admin" on public.missions
  for update using (public.is_admin()) with check (public.is_admin());

create policy "vocabulary_items_select_published_or_admin" on public.vocabulary_items
  for select using (is_published or public.is_admin());
create policy "vocabulary_items_insert_admin" on public.vocabulary_items
  for insert with check (public.is_admin());
create policy "vocabulary_items_update_admin" on public.vocabulary_items
  for update using (public.is_admin()) with check (public.is_admin());

create policy "mission_tasks_select_published_or_admin" on public.mission_tasks
  for select using (is_published or public.is_admin());
create policy "mission_tasks_insert_admin" on public.mission_tasks
  for insert with check (public.is_admin());
create policy "mission_tasks_update_admin" on public.mission_tasks
  for update using (public.is_admin()) with check (public.is_admin());

create policy "wardrobe_items_select_published_or_admin" on public.wardrobe_items
  for select using (is_published or public.is_admin());
create policy "wardrobe_items_insert_admin" on public.wardrobe_items
  for insert with check (public.is_admin());
create policy "wardrobe_items_update_admin" on public.wardrobe_items
  for update using (public.is_admin()) with check (public.is_admin());

create policy "achievements_select_published_or_admin" on public.achievements
  for select using (is_published or public.is_admin());
create policy "achievements_insert_admin" on public.achievements
  for insert with check (public.is_admin());
create policy "achievements_update_admin" on public.achievements
  for update using (public.is_admin()) with check (public.is_admin());

-- ai_content_drafts: admin only, full access.
create policy "ai_content_drafts_admin_all" on public.ai_content_drafts
  for all using (public.is_admin()) with check (public.is_admin());

-- =========================================================================
-- Data API grants
--
-- Recent Supabase projects no longer auto-expose new public-schema tables
-- to the anon/authenticated Data API roles. Table-level GRANTs are required
-- in addition to the RLS policies above — RLS only filters rows the caller
-- is already permitted to touch at the privilege level.
-- =========================================================================

grant usage on schema public to anon, authenticated;

-- service_role already bypasses RLS (rolbypassrls), but table-level GRANTs
-- are a separate ACL layer that RLS bypass does not cover. service_role is
-- only ever used server-side (Edge Functions), never exposed to the browser.
grant all on all tables in schema public to service_role;

-- Private/user-owned tables: authenticated only. RLS restricts each caller
-- to their own rows (or, for profiles, admins to all rows).
grant select, insert, update on public.profiles to authenticated;
grant select, insert on public.user_progress to authenticated;
grant select, insert on public.user_stats to authenticated;
grant select, insert on public.user_wardrobe_items to authenticated;
grant select, insert on public.user_achievements to authenticated;
grant select, insert, update, delete on public.ai_content_drafts to authenticated;

-- Public content tables: anon + authenticated can read; only authenticated
-- callers can write, and RLS further limits writes to admins.
grant select on public.districts to anon, authenticated;
grant insert, update on public.districts to authenticated;

grant select on public.locations to anon, authenticated;
grant insert, update on public.locations to authenticated;

grant select on public.missions to anon, authenticated;
grant insert, update on public.missions to authenticated;

grant select on public.vocabulary_items to anon, authenticated;
grant insert, update on public.vocabulary_items to authenticated;

grant select on public.mission_tasks to anon, authenticated;
grant insert, update on public.mission_tasks to authenticated;

grant select on public.wardrobe_items to anon, authenticated;
grant insert, update on public.wardrobe_items to authenticated;

grant select on public.achievements to anon, authenticated;
grant insert, update on public.achievements to authenticated;
