-- SLAY CITY — remove the generic homework tasks system
--
-- Homework topics used to carry a free-form list of tasks (reusing the mission
-- task catalog) alongside the vocabulary module. That generic task flow is
-- being replaced by two focused learning modules — Vocabulary and Grammar —
-- so the tables and their child completions are dropped here. RLS policies and
-- indexes drop with the tables. Any seed rows for these tables go with them.
--
-- Completions first: it holds an FK to homework_tasks.

drop table if exists public.homework_task_completions;
drop table if exists public.homework_tasks;
