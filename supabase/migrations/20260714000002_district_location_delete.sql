-- Allow admins to delete districts and locations from the admin content screens.
-- The initial schema granted select/insert/update but not delete. Foreign-key
-- cascades remove children automatically: deleting a district removes its
-- locations, their missions, mission_tasks, vocabulary_items, and the related
-- user_progress rows; deleting a location removes its missions and their
-- descendants.

create policy "districts_delete_admin" on public.districts
  for delete using (public.is_admin());
grant delete on public.districts to authenticated;

create policy "locations_delete_admin" on public.locations
  for delete using (public.is_admin());
grant delete on public.locations to authenticated;
