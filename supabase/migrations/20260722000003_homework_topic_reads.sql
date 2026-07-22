-- SLAY CITY — homework topic Q&A read markers
--
-- Tracks the last time each user read a topic's Q&A thread, so both the
-- teacher's and the child's topic lists can show an "unread messages" badge and
-- the topic page can clear it once the thread is opened.
--
-- One row per (topic, user). A missing row means "never read" — every message
-- from someone else counts as unread. Own messages never count as unread.

create table public.homework_topic_reads (
  topic_id uuid not null references public.homework_topics (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (topic_id, user_id)
);

alter table public.homework_topic_reads enable row level security;

-- A user only ever reads/writes their own read markers.
create policy "hw_reads_select_own" on public.homework_topic_reads
  for select using (user_id = auth.uid());

create policy "hw_reads_insert_own" on public.homework_topic_reads
  for insert with check (user_id = auth.uid());

create policy "hw_reads_update_own" on public.homework_topic_reads
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update on public.homework_topic_reads to authenticated;

-- =========================================================================
-- get_unread_topics(): for the caller, the topics that have at least one
-- message from someone else newer than the caller's last read (or never read).
-- SECURITY DEFINER so it can join messages/reads in one pass; the visibility
-- check (admin / group-member / owning-teacher) mirrors `get_topic_messages`.
-- =========================================================================

create or replace function public.get_unread_topics()
returns table (topic_id uuid, unread_count integer)
language sql
security definer
set search_path = public
stable
as $$
  select m.topic_id, count(*)::int
  from public.homework_topic_messages m
  join public.homework_topics t on t.id = m.topic_id
  left join public.homework_topic_reads r
    on r.topic_id = m.topic_id and r.user_id = auth.uid()
  where m.author_id <> auth.uid()
    and (r.last_read_at is null or m.created_at > r.last_read_at)
    and (
      public.is_admin()
      or public.is_group_member(t.group_id)
      or exists (
        select 1 from public.teacher_groups g
        where g.id = t.group_id and g.teacher_id = auth.uid()
      )
    )
  group by m.topic_id;
$$;

grant execute on function public.get_unread_topics() to authenticated;
