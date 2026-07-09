-- SLAY CITY — let admins manage the admin allow-list from the admin console.
--
-- The allow-list stays invisible to regular users (no policies were granted to
-- them in the previous migration). These policies add admin-only read/insert/
-- delete via `is_admin()`, so the "Manage admins" screen can use the caller's
-- own session instead of the service role.

create policy "admin_emails_select_admin" on public.admin_emails
  for select using (public.is_admin());

create policy "admin_emails_insert_admin" on public.admin_emails
  for insert with check (public.is_admin());

create policy "admin_emails_delete_admin" on public.admin_emails
  for delete using (public.is_admin());

grant select, insert, delete on public.admin_emails to authenticated;
