-- SLAY CITY — TEMPORARY dev/test helper: reset the caller's own progress.
--
-- This lets a signed-in user wipe their mission-completion data (and the stats
-- that missions accumulate) so they can replay content while testing. It is
-- deliberately self-scoped: it only ever touches auth.uid()'s own rows.
--
-- NOTE: This is a temporary testing affordance. It is exposed to every
-- authenticated user for now; before launch it should be gated to admins only
-- (e.g. add `if not public.is_admin() then raise exception ...`) or dropped.
--
-- Authenticated users hold only SELECT/INSERT on user_progress and user_stats
-- (see 20260701000001_initial_schema.sql), so they cannot delete progress or
-- rewrite stats directly. This SECURITY DEFINER function runs with the owner's
-- rights to perform the reset atomically, but never for anyone but the caller.

create or replace function public.reset_my_progress()
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

  -- Wipe every recorded completion for this user. Rewards are re-granted the
  -- next time each mission is completed, since complete_mission() only skips
  -- the grant while a progress row exists.
  delete from public.user_progress
  where profile_id = v_profile;

  -- Reset the mission-driven stats back to a fresh account's defaults so the
  -- HUD matches the wiped progress. Wardrobe/achievements are left untouched.
  update public.user_stats
  set xp = 0,
      coins = 0,
      level = 1,
      current_streak = 0,
      longest_streak = 0,
      last_activity_date = null
  where profile_id = v_profile;
end;
$$;

grant execute on function public.reset_my_progress() to authenticated;
