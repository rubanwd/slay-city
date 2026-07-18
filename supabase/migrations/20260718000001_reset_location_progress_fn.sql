-- SLAY CITY — let a player replay every mission at a completed location.
--
-- Deletes only that user's own progress rows for the given location, so its
-- missions become playable again. Rewards are re-granted the next time each
-- mission is completed, since complete_mission() only skips the grant while a
-- progress row exists (see 20260703000004_complete_mission_fn.sql) — the same
-- mechanism the dev-only reset_my_progress() already relies on, just scoped to
-- one location instead of the whole account.
--
-- Authenticated users hold only SELECT/INSERT on user_progress (see
-- 20260701000001_initial_schema.sql), so they cannot delete rows directly.
-- This SECURITY DEFINER function runs with the owner's rights to perform the
-- reset atomically, but never for anyone but the caller and never outside the
-- requested location.

create or replace function public.reset_location_progress(p_location_id uuid)
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

  delete from public.user_progress
  where profile_id = v_profile
    and location_id = p_location_id;
end;
$$;

grant execute on function public.reset_location_progress(uuid) to authenticated;
