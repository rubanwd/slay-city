-- SLAY CITY — homework topic notes (text / link / image)
--
-- A teacher can attach extra context to a lesson topic beyond its title and
-- description: free text, a link, and/or an image — shown to the child on
-- the topic's intro screen alongside their progress and the Start button.
-- All three are independently optional so a teacher can mix and match.

alter table public.homework_topics add column note_text text;
alter table public.homework_topics add column note_link_url text;
alter table public.homework_topics add column note_image_url text;

-- =========================================================================
-- is_teacher(): mirrors is_admin() — lets storage policies below check the
-- caller's role without a teacher-owns-this-object join (storage objects
-- don't carry a group/topic foreign key, only a folder-prefixed path).
-- =========================================================================

create or replace function public.is_teacher()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'teacher'
  );
$$;

grant execute on function public.is_teacher() to authenticated;

-- =========================================================================
-- Storage: let any teacher upload/replace/delete objects under the
-- `homework/` folder of the existing public `content` bucket (see
-- 20260714000001_content_images.sql) for topic note images. Coarse
-- (folder-wide, not scoped to a teacher's own topics) — same trust level the
-- admin write policies on this bucket already use.
-- =========================================================================

create policy "content_insert_teacher_homework" on storage.objects
  for insert with check (
    bucket_id = 'content' and (storage.foldername(name))[1] = 'homework' and public.is_teacher()
  );

create policy "content_update_teacher_homework" on storage.objects
  for update using (
    bucket_id = 'content' and (storage.foldername(name))[1] = 'homework' and public.is_teacher()
  ) with check (
    bucket_id = 'content' and (storage.foldername(name))[1] = 'homework' and public.is_teacher()
  );

create policy "content_delete_teacher_homework" on storage.objects
  for delete using (
    bucket_id = 'content' and (storage.foldername(name))[1] = 'homework' and public.is_teacher()
  );
