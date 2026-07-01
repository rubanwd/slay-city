-- SLAY CITY — sample content for local development.
-- NOTE: migrations run in every environment they are applied to, including
-- any linked remote project. This is fine for local/dev/staging, but avoid
-- pushing this migration to a production project — move it to
-- `supabase/seed.sql` instead if you only ever want it applied locally.

insert into public.districts (id, name, description, order_index, is_published)
values (
  '00000000-0000-0000-0000-000000000001',
  'Central Plaza',
  'The heart of Slay City, where every new adventurer begins.',
  0,
  true
)
on conflict (id) do nothing;

insert into public.locations (id, district_id, name, description, order_index, map_x, map_y, is_published)
values
  (
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000001',
    'Market Square',
    'A bustling marketplace full of everyday English words.',
    0,
    25.00,
    40.00,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000001',
    'Library Corner',
    'A quiet spot to practice reading and listening.',
    1,
    60.00,
    55.00,
    true
  )
on conflict (id) do nothing;

insert into public.missions (id, location_id, title, description, xp_reward, coin_reward, is_published)
values (
  '00000000-0000-0000-0000-000000001001',
  '00000000-0000-0000-0000-000000000101',
  'Greetings at the Market',
  'Learn how to greet shopkeepers and ask for everyday items.',
  50,
  10,
  true
)
on conflict (id) do nothing;
