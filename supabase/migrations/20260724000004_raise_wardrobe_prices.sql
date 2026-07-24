-- SLAY CITY — raise wardrobe skin prices across the board.
--
-- Doubles cost_coins for every purchasable item (the free default items, e.g.
-- White Cap, stay at 0).

update public.wardrobe_items
set cost_coins = cost_coins * 2
where cost_coins > 0;
