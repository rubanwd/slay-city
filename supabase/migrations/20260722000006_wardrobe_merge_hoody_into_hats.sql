-- SLAY CITY — fold the "hoody" costumes into the "hat" category.
--
-- The Hoodies section is being removed from the wardrobe. Its three items
-- (Chef Outfit, Wizard Robe, Astronaut Suit) are full "snake wearing this
-- item" renders just like the hats, so they simply move into item_type 'hat'.
-- order_index is bumped past the existing hats (0..8, Royal Crown = 8) so they
-- appear at the end of the Hats section instead of colliding with them.

update public.wardrobe_items
set item_type = 'hat',
    order_index = 9
where id = '00000000-0000-0000-0000-0000000d0111'; -- Chef Outfit

update public.wardrobe_items
set item_type = 'hat',
    order_index = 10
where id = '00000000-0000-0000-0000-0000000d0112'; -- Wizard Robe

update public.wardrobe_items
set item_type = 'hat',
    order_index = 11
where id = '00000000-0000-0000-0000-0000000d0113'; -- Astronaut Suit
