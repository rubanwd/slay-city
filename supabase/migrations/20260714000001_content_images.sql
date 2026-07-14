-- SLAY CITY — content images
--
-- Adds admin-uploadable imagery:
--   * districts.background_image_url — map backdrop for the district (cropped
--     to the map aspect ratio in the admin UI).
--   * locations.icon_url — icon shown in the location's map marker.
-- Both are public URLs served from a public Storage bucket, so the map (read
-- by anon/authenticated players) can load them without signed URLs.

alter table public.districts add column if not exists background_image_url text;
alter table public.locations add column if not exists icon_url text;

-- =========================================================================
-- Storage bucket for admin-managed content imagery
-- =========================================================================

insert into storage.buckets (id, name, public)
values ('content', 'content', true)
on conflict (id) do nothing;

-- Public read (bucket is public, but an explicit policy keeps intent clear and
-- covers listing). Writes are admin-only, reusing the public.is_admin() helper.
create policy "content_read_public" on storage.objects
  for select using (bucket_id = 'content');

create policy "content_insert_admin" on storage.objects
  for insert with check (bucket_id = 'content' and public.is_admin());

create policy "content_update_admin" on storage.objects
  for update using (bucket_id = 'content' and public.is_admin())
  with check (bucket_id = 'content' and public.is_admin());

create policy "content_delete_admin" on storage.objects
  for delete using (bucket_id = 'content' and public.is_admin());
