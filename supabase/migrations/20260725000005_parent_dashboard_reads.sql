-- SLAY CITY — the reads the enriched parent dashboard needs
--
-- The dashboard grew from "missions completed + streaks" into a picture of what
-- the student is actually doing: the look they are wearing, and the homework
-- their teacher assigned. Two new reads back that:
--
--   1. an additive SELECT policy so a parent can see which wardrobe item their
--      linked student has equipped (the item catalogue itself is already
--      readable by every authenticated user once published);
--   2. `parent_student_homework()`, a SECURITY DEFINER report of the student's
--      homework topics and pass state.
--
-- Homework goes through a function rather than policies because the homework
-- tables key their visibility off *group membership* (`is_group_member`), and a
-- parent is in no group. Granting a parent row-level access to every homework
-- table would mean five new policies and a wider surface than the dashboard
-- needs; one function returning exactly the summary shown is both narrower and
-- easier to reason about.

-- =========================================================================
-- Wardrobe: a parent may see their linked student's equipped item
-- =========================================================================

create policy "user_wardrobe_items_select_linked_student" on public.user_wardrobe_items
  for select using (public.is_linked_student(profile_id));

-- =========================================================================
-- parent_student_homework(): per-topic homework state for one student
--
-- Returns one row per homework topic that has something to learn in it (a
-- vocabulary set and/or a grammar set), across every group the student belongs
-- to. `vocab_completed_at` / `grammar_completed_at` are null until the student
-- passes that module, so the caller can render "passed", "in progress" (one of
-- two modules done) or "not started" without another query.
--
-- Only the student's own parent (or an admin) may call it; anyone else gets an
-- empty result rather than an error, since "no homework to show" is exactly
-- what the dashboard should render for them.
-- =========================================================================

create or replace function public.parent_student_homework(p_student_id uuid)
returns table (
  topic_id uuid,
  title text,
  group_name text,
  teacher_username text,
  word_count integer,
  grammar_count integer,
  vocab_completed_at timestamptz,
  grammar_completed_at timestamptz
)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select
    t.id,
    t.title,
    g.name,
    p.username,
    (select count(*)::int from public.homework_vocab_words w where w.topic_id = t.id),
    (select count(*)::int from public.homework_grammar_points gp where gp.topic_id = t.id),
    (
      select c.completed_at
      from public.homework_vocab_completions c
      where c.topic_id = t.id and c.student_id = p_student_id
    ),
    (
      select c.completed_at
      from public.homework_grammar_completions c
      where c.topic_id = t.id and c.student_id = p_student_id
    )
  from public.homework_topics t
  join public.teacher_groups g on g.id = t.group_id
  join public.teacher_group_members m on m.group_id = t.group_id and m.student_id = p_student_id
  left join public.profiles p on p.id = g.teacher_id
  where (public.is_linked_student(p_student_id) or public.is_admin())
    and (
      exists (select 1 from public.homework_vocab_words w where w.topic_id = t.id)
      or exists (select 1 from public.homework_grammar_points gp where gp.topic_id = t.id)
    )
  order by g.name, t.order_index, t.created_at;
$$;

grant execute on function public.parent_student_homework(uuid) to authenticated;
