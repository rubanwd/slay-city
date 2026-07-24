-- SLAY CITY — scale mission rewards by how much of the mission was actually done.
--
-- Some tasks (e.g. the Snake letter-collecting game) let a player move on
-- before finishing, taking whatever partial credit they earned instead of
-- being blocked until every letter is collected. p_score (0–1) conveys that
-- fraction from the client; the granted xp/coins scale with it, but the
-- mission is still recorded as completed regardless of the score.
--
-- p_score is client-reported and therefore untrusted for anything beyond
-- "don't exceed the mission's configured reward" — it is clamped to [0, 1]
-- here, same as gameplay correctness already is for every other task type
-- (nothing server-side re-checks that a quiz answer was actually right
-- either). Omitting it keeps the previous full-reward behavior.

drop function if exists public.complete_mission(uuid);

create or replace function public.complete_mission(p_mission_id uuid, p_score numeric default 1)
returns table (already_completed boolean, xp_earned integer, coins_earned integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile uuid := auth.uid();
  v_mission record;
  v_score numeric := greatest(0, least(1, coalesce(p_score, 1)));
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

  -- The unique index makes this the single point of truth: only the insert
  -- that actually wins the row proceeds to grant rewards.
  insert into public.user_progress (profile_id, mission_id, location_id, completed_at)
  values (v_profile, p_mission_id, v_mission.location_id, now())
  on conflict (profile_id, mission_id) do nothing;

  if not found then
    -- Already completed previously (or by a concurrent request) — no re-grant.
    already_completed := true;
    xp_earned := 0;
    coins_earned := 0;
    return next;
    return;
  end if;

  xp_earned := round(v_mission.xp_reward * v_score)::integer;
  coins_earned := round(v_mission.coin_reward * v_score)::integer;

  update public.user_stats
  set xp = xp + xp_earned,
      coins = coins + coins_earned
  where profile_id = v_profile;

  already_completed := false;
  return next;
end;
$$;

grant execute on function public.complete_mission(uuid, numeric) to authenticated;
