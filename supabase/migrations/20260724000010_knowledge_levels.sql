-- SLAY CITY — knowledge levels (CEFR-style English levels).
--
-- The city is no longer one flat list of districts: every district now belongs
-- to a knowledge level, and a child only ever sees the districts of the level
-- they picked. Admins get the same hierarchy one step taller:
--   Level → District → Location → Mission → Task.
--
-- Only `elementary` has content today (see 20260723000001_seed_elementary_curriculum),
-- so every existing district defaults to it and no child-facing content moves.
-- The remaining levels stay hidden from the level picker until content exists —
-- `available_knowledge_levels()` below is the single source of truth for that.

-- =========================================================================
-- Enum
-- =========================================================================

-- Declared in learning order: enum comparison/ordering follows this list, so
-- `order by level` sorts beginner → upper_intermediate everywhere.
create type public.knowledge_level as enum (
  'beginner',
  'elementary',
  'pre_intermediate',
  'intermediate',
  'upper_intermediate'
);

-- =========================================================================
-- Columns
-- =========================================================================

-- Which level's curriculum this district belongs to. Not null with a default so
-- the existing Elementary content keeps working without a backfill pass.
alter table public.districts
  add column level public.knowledge_level not null default 'elementary';

-- The level the child is currently studying. Chosen at onboarding, changeable
-- later from the profile screen via `set_my_knowledge_level` below.
alter table public.profiles
  add column level public.knowledge_level not null default 'elementary';

-- The map query is "published districts of my level, in order".
create index districts_level_order_idx on public.districts (level, order_index);

-- =========================================================================
-- Level availability
-- =========================================================================

-- A level is offered to children only once it has something playable in it:
-- at least one published district that itself has at least one published
-- location. Anything less would drop the child onto an empty map.
--
-- SECURITY DEFINER so the answer does not depend on the caller's RLS view of
-- draft content — an admin (who can read drafts) and a child must be told the
-- same thing, since this drives the child-facing picker.
create or replace function public.available_knowledge_levels()
returns setof public.knowledge_level
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select distinct d.level
  from public.districts d
  where d.is_published
    and exists (
      select 1
      from public.locations l
      where l.district_id = d.id
        and l.is_published
    )
  order by 1;
$$;

grant execute on function public.available_knowledge_levels() to anon, authenticated;

-- =========================================================================
-- Changing your own level
-- =========================================================================

-- Children switch level from their profile screen. Routed through a
-- SECURITY DEFINER function rather than a plain UPDATE so the "is this level
-- actually available?" rule is enforced in the database, not just in the UI.
create or replace function public.set_my_knowledge_level(p_level public.knowledge_level)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile uuid := auth.uid();
begin
  if v_profile is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if not exists (
    select 1 from public.available_knowledge_levels() as lvl where lvl = p_level
  ) then
    raise exception 'Level % has no content yet', p_level using errcode = '22023';
  end if;

  update public.profiles
  set level = p_level
  where id = v_profile;

  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;
end;
$$;

grant execute on function public.set_my_knowledge_level(public.knowledge_level) to authenticated;
