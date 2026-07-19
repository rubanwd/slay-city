-- SLAY CITY — Task Type templates.
--
-- One editable template per mission task type. Admins configure example content
-- for a type, test it end-to-end, and publish it. Only published task types are
-- offered in the mission task-type dropdown, so a type is only authorable in a
-- real mission once it has been reviewed and published here.
--
-- `content` mirrors the shape a `mission_tasks.content` of that type would hold,
-- so the same parsers/editors/gameplay used by real tasks drive this catalog.

-- Idempotent throughout: production already had this table created outside the
-- tracked migration history, so a bare `create table` errored on re-apply. Every
-- statement below is now safe to run whether or not the objects already exist,
-- letting `supabase db push` reconcile the history without failing.
create table if not exists public.task_type_templates (
  task_type public.mission_task_type primary key,
  content jsonb not null default '{}'::jsonb,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace trigger task_type_templates_set_updated_at before update on public.task_type_templates
  for each row execute function public.set_updated_at();

-- =========================================================================
-- Row Level Security — content table: public read for published rows, admin
-- read for drafts, admin-only insert/update (mirrors the other content tables).
-- =========================================================================
alter table public.task_type_templates enable row level security;

drop policy if exists "task_type_templates_select_published_or_admin" on public.task_type_templates;
create policy "task_type_templates_select_published_or_admin" on public.task_type_templates
  for select using (is_published or public.is_admin());
drop policy if exists "task_type_templates_insert_admin" on public.task_type_templates;
create policy "task_type_templates_insert_admin" on public.task_type_templates
  for insert with check (public.is_admin());
drop policy if exists "task_type_templates_update_admin" on public.task_type_templates;
create policy "task_type_templates_update_admin" on public.task_type_templates
  for update using (public.is_admin()) with check (public.is_admin());
