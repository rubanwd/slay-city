-- SLAY CITY — partial mission rewards.
--
-- Players can now finish a mission's game (e.g. the word search) at any point,
-- earning a share of the reward proportional to how much they completed. The
-- fraction is supplied by the client, but it can only ever *scale the reward
-- down*: it is clamped to [0, 1], so a caller can never grant more than the
-- mission's trusted reward values. The amounts actually granted are stored on
-- the progress row so the reward screen can show what was really earned.

alter table public.user_progress
  add column if not exists xp_earned integer,
  add column if not exists coins_earned integer;

-- Drop the old single-argument version so the new default-argument overload is
-- unambiguous when PostgREST calls it by named argument.
drop function if exists public.complete_mission(uuid);

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

  if not found then
    -- Already completed previously (or by a concurrent request) — no re-grant.
    already_completed := true;
    xp_earned := 0;
    coins_earned := 0;
    return next;
    return;
  end if;

  update public.user_stats
  set xp = xp + v_xp,
      coins = coins + v_coins
  where profile_id = v_profile;

  already_completed := false;
  xp_earned := v_xp;
  coins_earned := v_coins;
  return next;
end;
$$;

grant execute on function public.complete_mission(uuid, numeric) to authenticated;
