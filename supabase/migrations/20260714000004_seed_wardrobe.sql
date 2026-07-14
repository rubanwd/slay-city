-- SLAY CITY — sample wardrobe catalog for local development.
-- NOTE: like 20260701000002_seed_data.sql, this seeds demo content and runs in
-- every environment it is applied to. Fine for local/dev/staging; move to
-- `supabase/seed.sql` if you only ever want it applied locally.
--
-- Categories (item_type): 'hat', 'glasses', 'accessory', 'color'.
-- Two items are marked is_default (free, auto-granted on first equip) so a
-- fresh account always has something equippable in the hat and color slots.

insert into public.wardrobe_items
  (id, name, description, item_type, cost_coins, unlock_level, is_default, is_published, order_index)
values
  -- Hats
  ('00000000-0000-0000-0000-0000000d0001', 'Pink Cap',      'A comfy everyday cap.',              'hat',       0,   null, true,  true, 0),
  ('00000000-0000-0000-0000-0000000d0002', 'Neon Beanie',   'Glows under the city lights.',       'hat',       60,  null, false, true, 1),
  ('00000000-0000-0000-0000-0000000d0003', 'City Crown',    'For the ruler of Slay City.',        'hat',       250, 5,    false, true, 2),
  -- Glasses
  ('00000000-0000-0000-0000-0000000d0011', 'Cyber Shades',  'See the future in style.',           'glasses',   80,  null, false, true, 0),
  ('00000000-0000-0000-0000-0000000d0012', 'Star Glasses',  'Twinkle wherever you go.',           'glasses',   120, 3,    false, true, 1),
  -- Accessories
  ('00000000-0000-0000-0000-0000000d0021', 'City Bag',      'Carry your adventures around.',      'accessory', 100, null, false, true, 0),
  ('00000000-0000-0000-0000-0000000d0022', 'Gold Chain',    'Shine bright, stay legendary.',      'accessory', 180, 4,    false, true, 1),
  -- Colors
  ('00000000-0000-0000-0000-0000000d0031', 'Classic Green', 'Slay''s signature look.',            'color',     0,   null, true,  true, 0),
  ('00000000-0000-0000-0000-0000000d0032', 'Sunset Glow',   'Warm gradient vibes.',               'color',     70,  null, false, true, 1)
on conflict (id) do nothing;
