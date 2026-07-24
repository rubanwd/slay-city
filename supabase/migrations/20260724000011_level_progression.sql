-- SLAY CITY — finishing a level moves the player up to the next one.
--
-- Levels arrived in 20260724000010 as a filter on the map. This closes the
-- loop: once a child has completed every published mission of every published
-- location of every published district in their level, they are moved to the
-- next level that has content — automatically, server-side, inside the same
-- call that recorded the final mission.
--
-- When there is no next level yet the child stays put and the map offers to
-- replay the level (`reset_level_progress` below), which is the "coming soon"
-- end state rather than a dead end.

-- =========================================================================
-- Has this profile finished everything in a level?
-- =========================================================================

-- True only when the level actually holds published missions and none of them
-- is missing a completed progress row for the profile. An empty level is never
-- "completed" — otherwise a level with no content would instantly graduate
-- anyone who landed on it.
--
-- Internal helper: SECURITY DEFINER so it sees content and progress regardless
-- of the caller's RLS view, and deliberately NOT granted to `authenticated` —
-- it takes an arbitrary profile id, so only other server-side functions here
-- may call it.
create or replace function public.knowledge_level_completed(
  p_profile uuid,
  p_level public.knowledge_level
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with level_missions as (
    select m.id
    from public.missions m
    join public.locations l on l.id = m.location_id
    join public.districts d on d.id = l.district_id
    where d.level = p_level
      and d.is_published
      and l.is_published
      and m.is_published
  )
  select exists (select 1 from level_missions)
     and not exists (
       select 1
       from level_missions lm
       where not exists (
         select 1
         from public.user_progress up
         where up.profile_id = p_profile
           and up.mission_id = lm.id
           and up.completed_at is not null
       )
     );
$$;

-- =========================================================================
-- Auto-advance
-- =========================================================================

-- Moves the caller up to the next level that has content, but only if they
-- have finished their current one. Returns the level they were moved to, or
-- null when nothing changed (level not finished, or nothing above it yet).
--
-- Called from `complete_mission` below, so advancement happens in the same
-- transaction as the completion that earned it. Not granted to clients: a
-- child never needs to ask for this, and the map/profile screens read the
-- result rather than triggering it.
create or replace function public.advance_my_level_if_cleared()
returns public.knowledge_level
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile uuid := auth.uid();
  v_current public.knowledge_level;
  v_next public.knowledge_level;
begin
  if v_profile is null then
    return null;
  end if;

  select level into v_current from public.profiles where id = v_profile;
  if not found then
    return null;
  end if;

  if not public.knowledge_level_completed(v_profile, v_current) then
    return null;
  end if;

  -- The next level *up the ladder* that is playable. Enum comparison follows
  -- the declaration order (beginner … upper_intermediate), so this skips over
  -- any still-empty level in between rather than stalling on it.
  select lvl into v_next
  from public.available_knowledge_levels() as lvl
  where lvl > v_current
  order by lvl
  limit 1;

  if v_next is null then
    return null;
  end if;

  update public.profiles set level = v_next where id = v_profile;
  return v_next;
end;
$$;

-- =========================================================================
-- complete_mission: same contract, now also advances the level
-- =========================================================================

-- Unchanged from 20260724000003 except for the level check at the end. The
-- FOUND flag from the INSERT is captured into a local first, because calling
-- another function would otherwise clobber it before it is read.
create or replace function public.complete_mission(
  p_mission_id uuid,
  p_reward_fraction numeric default 1
)
returns table (already_completed boolean, xp_earned integer, coins_earned integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile uuid := auth.uid();
  v_mission record;
  -- Clamp to [0, 1]: the fraction can only reduce the reward, never inflate it.
  v_fraction numeric := least(1, greatest(0, coalesce(p_reward_fraction, 1)));
  v_xp integer;
  v_coins integer;
  v_granted boolean;
begin
  if v_profile is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  -- Reward values come from the trusted mission row — never the client.
  select id, location_id, xp_reward, coin_reward
    into v_mission
  from public.missions
  where id = p_mission_id and is_published = true;

  if not found then
    raise exception 'Mission not found' using errcode = 'P0002';
  end if;

  v_xp := round(v_mission.xp_reward * v_fraction);
  v_coins := round(v_mission.coin_reward * v_fraction);

  -- The unique index makes this the single point of truth: only the insert
  -- that actually wins the row proceeds to grant rewards.
  insert into public.user_progress
    (profile_id, mission_id, location_id, completed_at, xp_earned, coins_earned)
  values (v_profile, p_mission_id, v_mission.location_id, now(), v_xp, v_coins)
  on conflict (profile_id, mission_id) do nothing;

  v_granted := found;

  if v_granted then
    update public.user_stats
    set xp = xp + v_xp,
        coins = coins + v_coins
    where profile_id = v_profile;
  end if;

  -- Runs on replays too, not just on the completion that finished the level:
  -- a level cleared before the next one had content graduates the player as
  -- soon as they play anything again after that content lands.
  perform public.advance_my_level_if_cleared();

  already_completed := not v_granted;
  xp_earned := case when v_granted then v_xp else 0 end;
  coins_earned := case when v_granted then v_coins else 0 end;
  return next;
end;
$$;

grant execute on function public.complete_mission(uuid, numeric) to authenticated;

-- =========================================================================
-- Replaying a finished level
-- =========================================================================

-- Wipes the caller's own progress for every location in the level they are
-- currently on, making the whole level playable again. Scoped and self-only,
-- exactly like `reset_location_progress` (20260718000001) — and like it, XP,
-- coins and streaks are left alone; rewards are simply re-earned as the
-- missions are replayed.
create or replace function public.reset_level_progress()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile uuid := auth.uid();
  v_level public.knowledge_level;
begin
  if v_profile is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select level into v_level from public.profiles where id = v_profile;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  delete from public.user_progress up
  using public.locations l
  join public.districts d on d.id = l.district_id
  where up.profile_id = v_profile
    and up.location_id = l.id
    and d.level = v_level;
end;
$$;

grant execute on function public.reset_level_progress() to authenticated;
