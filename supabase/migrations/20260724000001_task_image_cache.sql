-- SLAY CITY — shared mission-task image cache
--
-- Mission-task words repeat heavily across the 12 topic maps (every food-ish
-- location wants an "apple", many missions reuse "cat", "school", "sun"…).
-- Generating a fresh AI image for each occurrence is the dominant cost of
-- illustrating the curriculum (each image is a paid OpenRouter generation), so
-- we cache one image per normalized subject in a shared library: the first time
-- any task needs a subject's image it is generated + uploaded to the
-- `content/tasks` bucket and recorded here; every later request for that subject
-- reuses the stored URL for free.
--
-- This mirrors `vocab_image_cache` (the teacher/homework equivalent) but is kept
-- separate so the two authoring surfaces evolve their art independently. The
-- key is the normalized subject (lowercased, whitespace-collapsed, trimmed —
-- see `normalizeWordKey` in features/homework/vocabulary.ts) and doubles as the
-- primary key so the generation action can upsert on conflict.
--
-- Task authoring is admin-only, so reads/writes are gated to admins. The backfill
-- script runs with the service role, which bypasses RLS.

create table public.task_image_cache (
  word_key text primary key,
  image_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger task_image_cache_set_updated_at before update on public.task_image_cache
  for each row execute function public.set_updated_at();

alter table public.task_image_cache enable row level security;

create policy "task_image_cache_select" on public.task_image_cache
  for select using (public.is_admin());

create policy "task_image_cache_insert" on public.task_image_cache
  for insert with check (public.is_admin());

create policy "task_image_cache_update" on public.task_image_cache
  for update using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update on public.task_image_cache to authenticated;
