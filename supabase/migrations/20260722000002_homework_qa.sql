-- SLAY CITY — homework topic Q&A (shared per-topic chat)
--
-- Replaces the teacher's static "Extra Info" note with a live, two-way Q&A
-- thread scoped to a single topic. Everyone who can see the topic — every
-- child in the owning group AND the group's teacher — shares one thread, so a
-- student's question and the teacher's answer are visible to the whole group.
--
-- Kept deliberately close to the existing homework tables: RLS SELECT is a
-- plain subquery against `homework_topics` (inheriting exactly whatever that
-- table's own policy already grants the caller — group-member or owning
-- teacher), mirroring `homework_tasks`. Writes additionally pin
-- `author_id = auth.uid()` so a message can't be posted as someone else.
--
-- Usernames are resolved through the `get_topic_messages()` SECURITY DEFINER
-- RPC below, because a child has no direct SELECT on another user's
-- `profiles` row (same reason `my_groups()` exists).

create table public.homework_topic_messages (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.homework_topics (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index homework_topic_messages_topic_id_idx
  on public.homework_topic_messages (topic_id, created_at);

alter table public.homework_topic_messages enable row level security;

-- SELECT inherits the caller's visibility of the parent topic (group-member,
-- owning teacher, or admin) via `homework_topics`' own policy — no bypass.
create policy "hw_messages_select" on public.homework_topic_messages
  for select using (
    exists (select 1 from public.homework_topics t where t.id = topic_id)
  );

-- INSERT: only as yourself, and only into a topic you can see.
create policy "hw_messages_insert" on public.homework_topic_messages
  for insert with check (
    author_id = auth.uid()
    and exists (select 1 from public.homework_topics t where t.id = topic_id)
  );

-- DELETE: your own message, or (for the owning teacher / admin) any message in
-- their topic — light moderation without a separate role check.
create policy "hw_messages_delete" on public.homework_topic_messages
  for delete using (
    author_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.homework_topics t
      join public.teacher_groups g on g.id = t.group_id
      where t.id = topic_id and g.teacher_id = auth.uid()
    )
  );

grant select, insert, delete on public.homework_topic_messages to authenticated;

-- =========================================================================
-- get_topic_messages(): the thread with each author's username and whether
-- they're the teacher, so the client can label bubbles without direct
-- `profiles` access. SECURITY DEFINER, so it re-checks that the caller may
-- actually see the topic before returning anything.
-- =========================================================================

create or replace function public.get_topic_messages(p_topic_id uuid)
returns table (
  id uuid,
  author_id uuid,
  author_username text,
  author_is_teacher boolean,
  body text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    m.id,
    m.author_id,
    p.username,
    (p.role = 'teacher'),
    m.body,
    m.created_at
  from public.homework_topic_messages m
  join public.profiles p on p.id = m.author_id
  where m.topic_id = p_topic_id
    and exists (
      select 1 from public.homework_topics t
      where t.id = m.topic_id
        and (
          public.is_admin()
          or public.is_group_member(t.group_id)
          or exists (
            select 1 from public.teacher_groups g
            where g.id = t.group_id and g.teacher_id = auth.uid()
          )
        )
    )
  order by m.created_at;
$$;

grant execute on function public.get_topic_messages(uuid) to authenticated;

-- Broadcast row changes so a new message appears for everyone viewing the
-- topic without a refresh. Realtime still enforces the SELECT policy above.
alter publication supabase_realtime add table public.homework_topic_messages;
