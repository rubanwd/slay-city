-- SLAY CITY — shared vocabulary image cache
--
-- Vocabulary words repeat heavily across topics, groups and teachers (every
-- "Animals" topic wants a "cat" card). Generating a fresh AI image for each
-- occurrence is the dominant cost of the authoring flow, so we cache one image
-- per normalized word in a shared library: the first time any teacher needs a
-- word's image it is generated + uploaded to the `content/homework` bucket and
-- recorded here; every later request for that word reuses the stored URL for
-- free.
--
-- `word_key` is the normalized word (lowercased, whitespace-collapsed, trimmed
-- — see `normalizeWordKey` in features/homework/vocabulary.ts) and doubles as
-- the primary key so the generation action can upsert on conflict. The library
-- is global (not scoped to a teacher) — images are generic illustrations that
-- are equally valid for anyone, matching how the `content` bucket is already
-- shared read-only across the app.

create table public.vocab_image_cache (
  word_key text primary key,
  image_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vocab_image_cache enable row level security;

-- Only the authoring side touches this table, and only teachers (or an admin
-- viewing-as / managing) ever author. Children never read it — they see the
-- word's `image_url` copied onto `homework_vocab_words` at publish time.
create policy "vocab_image_cache_select" on public.vocab_image_cache
  for select using (public.is_teacher() or public.is_admin());

create policy "vocab_image_cache_insert" on public.vocab_image_cache
  for insert with check (public.is_teacher() or public.is_admin());

create policy "vocab_image_cache_update" on public.vocab_image_cache
  for update using (public.is_teacher() or public.is_admin())
  with check (public.is_teacher() or public.is_admin());

grant select, insert, update on public.vocab_image_cache to authenticated;
