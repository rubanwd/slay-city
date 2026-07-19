-- SLAY CITY — three new 'glasses' skins for the wardrobe catalog.
--
-- Unlike the items created through the admin console (whose artwork lives in
-- the `content/wardrobe` storage bucket), these ship with the app: the art is
-- committed under `public/wardrobe/` and referenced by a root-relative URL.
-- Both work the same way at render time — the wardrobe grid and the map mascot
-- just pass image_url straight to <img src>.
--
-- Pricing follows the existing catalog's 60–250 coin range: the aviators are an
-- early buy, the round pair mid-tier, and the star pair is the level-3 flex.

insert into public.wardrobe_items
  (id, name, description, item_type, image_url, cost_coins, unlock_level, is_default, is_published, order_index)
values
  ('00000000-0000-0000-0000-0000000d0013', 'Sky Aviators',  'Cool, calm and mirrored.',        'glasses', '/wardrobe/aviator-glasses.png', 90,  null, false, true, 2),
  ('00000000-0000-0000-0000-0000000d0014', 'Retro Rounds',  'Big lenses, bigger ideas.',       'glasses', '/wardrobe/round-glasses.png',   140, null, false, true, 3),
  ('00000000-0000-0000-0000-0000000d0015', 'Star Shades',   'For main-character energy only.', 'glasses', '/wardrobe/star-glasses.png',    200, 3,    false, true, 4)
on conflict (id) do update
set name         = excluded.name,
    description  = excluded.description,
    image_url    = excluded.image_url,
    cost_coins   = excluded.cost_coins,
    unlock_level = excluded.unlock_level,
    is_published = excluded.is_published,
    order_index  = excluded.order_index;
