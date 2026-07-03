-- SLAY CITY — server-side mission completion.
--
-- Authenticated users are granted only SELECT/INSERT on user_stats (see
-- 20260701000001_initial_schema.sql), so they cannot award XP or coins to
-- themselves directly. This SECURITY DEFINER function runs with the owner's
-- rights, performing the reward grant atomically and server-side only.

-- Guarantee one completion row per (user, mission) so rewards can never be
-- granted twice, even under concurrent requests. Deduplicate any existing
-- rows first so the unique index can be created.
delete from public.user_progress a
using public.user_progress b
where a.profile_id = b.profile_id
  and a.mission_id = b.mission_id
  and a.ctid > b.ctid;

create unique index if not exists user_progress_profile_mission_key
  on public.user_progress (profile_id, mission_id);

create or replace function public.complete_mission(p_mission_id uuid)
returns table (already_completed boolean, xp_earned integer, coins_earned integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile uuid := auth.uid();
  v_mission record;
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

  update public.user_stats
  set xp = xp + v_mission.xp_reward,
      coins = coins + v_mission.coin_reward
  where profile_id = v_profile;

  already_completed := false;
  xp_earned := v_mission.xp_reward;
  coins_earned := v_mission.coin_reward;
  return next;
end;
$$;

grant execute on function public.complete_mission(uuid) to authenticated;
