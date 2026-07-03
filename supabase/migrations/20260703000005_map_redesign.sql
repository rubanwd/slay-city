-- SLAY CITY — trim the map to 5 curated locations.
--
-- The connecting map lines were removed from the UI, so locations no longer
-- need to form an ordered path. We keep 5 published stops (all in Central
-- Plaza) with a pleasant scatter layout and hide the rest. The hidden
-- locations/missions still exist and remain reachable by direct URL.

-- Reposition + (re)publish the 5 keepers, all under Central Plaza.
update public.locations as l set
  district_id = '00000000-0000-0000-0000-000000000001',
  is_published = true,
  order_index = v.ord,
  map_x = v.x,
  map_y = v.y
from (values
  ('00000000-0000-0000-0000-000000000101'::uuid, 0, 25.0, 30.0),  -- Market Square
  ('00000000-0000-0000-0000-000000000104'::uuid, 1, 72.0, 26.0),  -- In the Kitchen
  ('00000000-0000-0000-0000-000000000105'::uuid, 2, 78.0, 58.0),  -- Cozy Café
  ('00000000-0000-0000-0000-000000000107'::uuid, 3, 20.0, 62.0),  -- Classroom
  ('00000000-0000-0000-0000-000000000109'::uuid, 4, 50.0, 82.0)   -- Art Studio
) as v(id, ord, x, y)
where l.id = v.id;

-- Hide the other locations.
update public.locations set is_published = false
where id in (
  '00000000-0000-0000-0000-000000000102', -- Library Corner
  '00000000-0000-0000-0000-000000000103', -- Fountain Plaza
  '00000000-0000-0000-0000-000000000106', -- Bakery Lane
  '00000000-0000-0000-0000-000000000108'  -- Playground
);

-- Hide the now-empty districts so they don't render on the map.
update public.districts set is_published = false
where id in (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
);
