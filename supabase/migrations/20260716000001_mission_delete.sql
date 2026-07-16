-- Allow admins to delete missions from the location detail screen. The initial
-- schema granted select/insert/update but not delete. Foreign-key cascades
-- remove the mission's mission_tasks, vocabulary_items, and the related
-- user_progress rows.

create policy "missions_delete_admin" on public.missions
  for delete using (public.is_admin());
grant delete on public.missions to authenticated;
