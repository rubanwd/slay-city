-- SLAY CITY — refresh the wardrobe catalog with the new mascot artwork.
--
-- Every item now ships a full "snake wearing this item" .webp committed under
-- public/wardrobe/ and referenced by a root-relative URL — the same pattern as
-- the 20260720000001 glasses skins, and far lighter than the old Figma-derived
-- storage .jpg / .svg art. The player grid and map mascot pass image_url
-- straight to <img src>, so no code change is needed to render these.
--
-- Existing rows are repointed at the new art; seven new hats and three new
-- "hoody" costumes are added. Blue Cap is retired (no new art for it). Prices
-- are hand-tuned across a ~1000-coin spread — cheap everyday pieces up to the
-- Royal Crown flex — with a few level gates on the premium items.

insert into public.wardrobe_items
  (id, name, description, item_type, image_url, preview_url,
   cost_coins, unlock_level, is_default, is_published, order_index)
values
  -- ===== Hats =====
  ('00000000-0000-0000-0000-0000000d0001', 'White Cap',    'Fresh everyday cap — yours from the start.', 'hat', '/wardrobe/hat-white-cap.webp', null,   0, null, true,  true, 0),
  ('00000000-0000-0000-0000-0000000d0003', 'Red Cap',      'Classic red ballcap energy.',               'hat', '/wardrobe/hat-red-cap.webp',   null,  25, null, false, true, 1),
  ('00000000-0000-0000-0000-0000000d0101', 'Propeller Cap','Spin into recess like a legend.',           'hat', '/wardrobe/hat-propeller.webp', null,  35, null, false, true, 2),
  ('00000000-0000-0000-0000-0000000d0102', 'Dino Cap',     'Little spikes, big roar.',                  'hat', '/wardrobe/hat-dino.webp',      null,  40, null, false, true, 3),
  ('00000000-0000-0000-0000-0000000d0103', 'Winter Beanie','Pink pom-pom, cozy vibes.',                 'hat', '/wardrobe/hat-winter.webp',    null,  45, null, false, true, 4),
  ('00000000-0000-0000-0000-0000000d0104', 'Detective Hat','On the case, clue by clue.',                'hat', '/wardrobe/hat-detective.webp', null,  60, null, false, true, 5),
  ('00000000-0000-0000-0000-0000000d0105', 'Santa Hat',    'Ho-ho-homework season.',                    'hat', '/wardrobe/hat-santa.webp',     null,  65, null, false, true, 6),
  ('00000000-0000-0000-0000-0000000d0106', 'Pirate Hat',   'Captain of the Slay City seas.',            'hat', '/wardrobe/hat-pirate.webp',    null,  80, null, false, true, 7),
  ('00000000-0000-0000-0000-0000000d0107', 'Royal Crown',  'For the ruler of Slay City.',               'hat', '/wardrobe/hat-crown.webp',     null, 110, 5,    false, true, 8),

  -- ===== Glasses ===== (aviators / rounds / star keep their committed PNG art)
  ('00000000-0000-0000-0000-0000000d0011', 'Black Glasses','Neon-lined and cool.',                      'glasses', '/wardrobe/glasses-black.webp', null, 30, null, false, true, 0),
  ('00000000-0000-0000-0000-0000000d0012', 'Pink Glasses', 'Shutter shades, party mode.',               'glasses', '/wardrobe/glasses-pink.webp',  null, 40, null, false, true, 1),
  ('00000000-0000-0000-0000-0000000d0013', 'Sky Aviators', 'Cool, calm and mirrored.',                  'glasses', '/wardrobe/aviator-glasses.png', null, 45, null, false, true, 2),
  ('00000000-0000-0000-0000-0000000d0014', 'Retro Rounds', 'Big lenses, bigger ideas.',                 'glasses', '/wardrobe/round-glasses.png',   null, 50, null, false, true, 3),
  ('00000000-0000-0000-0000-0000000d0015', 'Star Shades',  'For main-character energy only.',           'glasses', '/wardrobe/star-glasses.png',    null, 70, 3,    false, true, 4),

  -- ===== Accessories =====
  ('00000000-0000-0000-0000-0000000d0021', 'School Bag',   'Carry your adventures around.',             'accessory', '/wardrobe/accessory-bag.webp',      null, 20, null, false, true, 0),
  ('00000000-0000-0000-0000-0000000d0022', 'Pink Umbrella','Rain or shine, stay slay.',                 'accessory', '/wardrobe/accessory-umbrella.webp', null, 45, null, false, true, 1),

  -- ===== Hoodies / costumes =====
  ('00000000-0000-0000-0000-0000000d0111', 'Chef Outfit',   'Cooking up straight A-grades.',            'hoody', '/wardrobe/hoody-chef.webp',      null,  55, null, false, true, 0),
  ('00000000-0000-0000-0000-0000000d0112', 'Wizard Robe',   'Spellbinding study magic.',                'hoody', '/wardrobe/hoody-wizard.webp',    null,  85, 3,    false, true, 1),
  ('00000000-0000-0000-0000-0000000d0113', 'Astronaut Suit','Homework, but make it interstellar.',      'hoody', '/wardrobe/hoody-astronaut.webp', null, 100, 4,    false, true, 2)
on conflict (id) do update
set name         = excluded.name,
    description  = excluded.description,
    item_type    = excluded.item_type,
    image_url    = excluded.image_url,
    preview_url  = excluded.preview_url,
    cost_coins   = excluded.cost_coins,
    unlock_level = excluded.unlock_level,
    is_default   = excluded.is_default,
    is_published = excluded.is_published,
    order_index  = excluded.order_index;

-- Retire Blue Cap: no new art ships for it, so drop it from the store. Any
-- player who already owns it keeps the ownership row; it just can't be
-- re-purchased or browsed.
update public.wardrobe_items
set is_published = false
where id = '00000000-0000-0000-0000-0000000d0002';
