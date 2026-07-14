-- SLAY CITY — admin wardrobe management + drop the 'color' category
--
-- Admins can already insert/update wardrobe_items (initial schema policies).
-- This adds the missing DELETE policy/grant so the admin catalog editor can
-- remove items, and drops the 'color' category from the customization redesign
-- (categories are now hat / glasses / accessory / hoody).

-- Admin delete for wardrobe items. FK cascade (user_wardrobe_items references
-- wardrobe_items on delete cascade) removes any ownership rows automatically.
create policy "wardrobe_items_delete_admin" on public.wardrobe_items
  for delete using (public.is_admin());

grant delete on public.wardrobe_items to authenticated;

-- Remove the 'color' category entirely. Deleting the catalog rows cascades to
-- any equipped/owned rows in user_wardrobe_items.
delete from public.wardrobe_items where item_type = 'color';
