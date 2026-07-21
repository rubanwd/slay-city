-- SLAY CITY — admin "View as Teacher"
--
-- Lets an admin step into any teacher's console and see + edit exactly what
-- that teacher would (their groups, students, homework topics and tasks). The
-- impersonation itself is a server-side cookie the app reads (see
-- src/features/teacher/viewAs.ts); this migration only widens RLS so the
-- admin's own JWT is allowed to do the reads/writes the teacher console needs.
--
-- Nothing here grants a new capability to non-admins: every policy below is
-- gated on `public.is_admin()`, which is already the top of the role system
-- and already reads all admin content. Admins gain SELECT on child stats (to
-- render the dashboard) and full write on the homework tables (to author on a
-- teacher's behalf). No write access is granted to reward tables — admins
-- still cannot touch xp/coins/streak/unlocks (there is no UPDATE policy on
-- user_stats / user_progress, only SELECT).

-- =========================================================================
-- Admins can read every child's stats/progress, so the "View as Teacher"
-- dashboard shows the same numbers the teacher sees. Additive SELECT policies;
-- the existing own-row / linked-child / group-child policies still apply.
-- =========================================================================

create policy "user_stats_select_admin" on public.user_stats
  for select using (public.is_admin());

create policy "user_progress_select_admin" on public.user_progress
  for select using (public.is_admin());

-- =========================================================================
-- Admins can author homework for any group (insert/update/delete topics and
-- tasks), so "View as Teacher" edits go through the admin's own JWT. The
-- existing teacher-ownership policies are untouched — a teacher still only
-- edits their own groups' homework.
-- =========================================================================

create policy "homework_topics_insert_admin" on public.homework_topics
  for insert with check (public.is_admin());

create policy "homework_topics_update_admin" on public.homework_topics
  for update using (public.is_admin()) with check (public.is_admin());

create policy "homework_topics_delete_admin" on public.homework_topics
  for delete using (public.is_admin());

create policy "homework_tasks_insert_admin" on public.homework_tasks
  for insert with check (public.is_admin());

create policy "homework_tasks_update_admin" on public.homework_tasks
  for update using (public.is_admin()) with check (public.is_admin());

create policy "homework_tasks_delete_admin" on public.homework_tasks
  for delete using (public.is_admin());
