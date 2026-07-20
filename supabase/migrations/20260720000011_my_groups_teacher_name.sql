-- SLAY CITY — surface the teacher's name from my_groups()
--
-- The child Homework screen shows one group name once at the top (a child is
-- only ever in one group in practice) and, per topic, who assigned it — the
-- teacher's username. `my_groups()` didn't return that, so extend it.
-- `username` is `not null` on `profiles` (20260701000001_initial_schema.sql),
-- so no email fallback is needed here.
--
-- CREATE OR REPLACE FUNCTION cannot change a RETURNS TABLE column list, so the
-- function must be dropped and recreated.

drop function if exists public.my_groups();

create function public.my_groups()
returns table (group_id uuid, group_name text, teacher_id uuid, teacher_username text)
language sql
security definer
set search_path = public
stable
as $$
  select g.id, g.name, g.teacher_id, p.username
  from public.teacher_group_members m
  join public.teacher_groups g on g.id = m.group_id
  join public.profiles p on p.id = g.teacher_id
  where m.child_id = auth.uid();
$$;

grant execute on function public.my_groups() to authenticated;
