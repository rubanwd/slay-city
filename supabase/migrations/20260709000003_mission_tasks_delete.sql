-- Allow admins to delete mission tasks from the admin content screen.
-- The initial schema only granted select/insert/update on mission_tasks.

create policy "mission_tasks_delete_admin" on public.mission_tasks
  for delete using (public.is_admin());

grant delete on public.mission_tasks to authenticated;
