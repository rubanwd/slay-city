-- SLAY CITY — let a teacher reposition a location's label on the city map.
--
-- Teachers browse the whole city at `/teacher/map` to review content, and are
-- the ones who notice when a label sits on top of the artwork it is meant to
-- name. Editing locations is otherwise admin-only (`locations_update_admin`),
-- and RLS cannot restrict an UPDATE to two columns — so instead of widening
-- that policy this exposes exactly one thing a teacher may change: where the
-- label sits.
--
-- security definer, so it bypasses the admin-only update policy; the role check
-- and the column list inside the function are what keep it narrow.

create or replace function public.set_location_map_position(
  p_location_id uuid,
  p_map_x numeric,
  p_map_y numeric
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not (public.is_teacher() or public.is_admin()) then
    raise exception 'Only teachers and admins can move map labels';
  end if;

  if p_map_x is null or p_map_y is null then
    raise exception 'A map position needs both coordinates';
  end if;

  -- Percent coordinates of the map frame. Clamped rather than rejected: a tap
  -- right on the frame's edge can round a hair past 100.
  update public.locations set
    map_x = least(100, greatest(0, p_map_x)),
    map_y = least(100, greatest(0, p_map_y))
  where id = p_location_id;

  if not found then
    raise exception 'No such location';
  end if;
end;
$$;

grant execute on function public.set_location_map_position(uuid, numeric, numeric)
  to authenticated;
