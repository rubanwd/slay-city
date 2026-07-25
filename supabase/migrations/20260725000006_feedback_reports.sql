-- SLAY CITY — feedback & bug reports
--
-- Students and teachers can report a bug or send feedback from their profile
-- screen, attaching screenshots of whatever went wrong. Admins read the reports
-- in their own console section, which carries an unread marker until they open
-- it.
--
-- Two tables:
--   * `feedback_reports`  — one row per submitted report, with the public URLs
--     of any uploaded screenshots (bucket `content`, folder `feedback/`).
--   * `feedback_report_reads` — per-admin read markers, mirroring
--     `homework_topic_reads`: a missing row means "this admin hasn't read it".
--     Per admin rather than a single `is_read` flag so one admin opening the
--     list doesn't silently clear the badge for everyone else.

create table public.feedback_reports (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  -- What the author says this is. Free text + check rather than an enum so
  -- adding a category later is a one-line migration.
  kind text not null default 'bug' check (kind in ('bug', 'feedback')),
  message text not null check (char_length(btrim(message)) between 1 and 4000),
  -- Public storage URLs of attached screenshots, in the order the author added
  -- them. Capped so one report can't become an unbounded gallery.
  image_urls text[] not null default '{}'
    check (array_length(image_urls, 1) is null or array_length(image_urls, 1) <= 5),
  created_at timestamptz not null default now()
);

create index feedback_reports_created_at_idx on public.feedback_reports (created_at desc);
create index feedback_reports_author_id_idx on public.feedback_reports (author_id);

alter table public.feedback_reports enable row level security;

-- An author sees their own reports; an admin sees all of them.
create policy "feedback_reports_select_own_or_admin" on public.feedback_reports
  for select using (author_id = auth.uid() or public.is_admin());

-- Only students and teachers file reports, and only as themselves. (Parents
-- have their own console and are out of scope for this feature; an admin who
-- finds a bug fixes it rather than reporting it.)
create policy "feedback_reports_insert_student_or_teacher" on public.feedback_reports
  for insert with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('student', 'teacher')
    )
  );

-- Admins clear handled reports; nobody else deletes anything.
create policy "feedback_reports_delete_admin" on public.feedback_reports
  for delete using (public.is_admin());

grant select, insert, delete on public.feedback_reports to authenticated;

-- =========================================================================
-- Per-admin read markers
-- =========================================================================

create table public.feedback_report_reads (
  report_id uuid not null references public.feedback_reports (id) on delete cascade,
  admin_id uuid not null references public.profiles (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (report_id, admin_id)
);

alter table public.feedback_report_reads enable row level security;

create policy "feedback_reads_select_own" on public.feedback_report_reads
  for select using (admin_id = auth.uid());

create policy "feedback_reads_insert_own" on public.feedback_report_reads
  for insert with check (admin_id = auth.uid() and public.is_admin());

grant select, insert on public.feedback_report_reads to authenticated;

-- =========================================================================
-- list_feedback_reports(): the admin inbox, newest first
--
-- SECURITY DEFINER because the list shows who wrote each report, and an admin
-- reading `profiles` directly is allowed but a join through PostgREST would
-- need a wider embed than this one flattened row set. Non-admins get an empty
-- result rather than an error — "nothing to read" is the right answer for them.
-- =========================================================================

create or replace function public.list_feedback_reports()
returns table (
  id uuid,
  author_id uuid,
  author_username text,
  author_role public.user_role,
  kind text,
  message text,
  image_urls text[],
  created_at timestamptz,
  is_read boolean
)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select
    f.id,
    f.author_id,
    p.username,
    p.role,
    f.kind,
    f.message,
    f.image_urls,
    f.created_at,
    exists (
      select 1 from public.feedback_report_reads r
      where r.report_id = f.id and r.admin_id = auth.uid()
    )
  from public.feedback_reports f
  left join public.profiles p on p.id = f.author_id
  where public.is_admin()
  order by f.created_at desc;
$$;

grant execute on function public.list_feedback_reports() to authenticated;

-- =========================================================================
-- unread_feedback_count(): what the admin menu badge shows. 0 for non-admins.
-- =========================================================================

create or replace function public.unread_feedback_count()
returns integer
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select coalesce(count(*), 0)::int
  from public.feedback_reports f
  where public.is_admin()
    and not exists (
      select 1 from public.feedback_report_reads r
      where r.report_id = f.id and r.admin_id = auth.uid()
    );
$$;

grant execute on function public.unread_feedback_count() to authenticated;

-- =========================================================================
-- mark_feedback_read(): called when an admin opens the inbox. Marks every
-- report they can see as read for them alone, and returns how many were newly
-- marked. Idempotent — replaying it marks nothing.
-- =========================================================================

create or replace function public.mark_feedback_read()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  marked integer;
begin
  if not public.is_admin() then
    return 0;
  end if;

  insert into public.feedback_report_reads (report_id, admin_id)
  select f.id, auth.uid() from public.feedback_reports f
  on conflict (report_id, admin_id) do nothing;

  get diagnostics marked = row_count;
  return marked;
end;
$$;

grant execute on function public.mark_feedback_read() to authenticated;

-- =========================================================================
-- Storage: screenshots go to `feedback/` in the existing public `content`
-- bucket (see 20260714000001_content_images.sql). Any signed-in user may add
-- one — the same coarse, folder-scoped trust level the teacher `homework/`
-- policies use. Read is already public for the whole bucket.
-- =========================================================================

create policy "content_insert_feedback" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'content' and (storage.foldername(name))[1] = 'feedback'
  );
