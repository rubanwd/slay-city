-- SLAY CITY — study time tracking
--
-- Until now nothing in the schema recorded *how long* a student worked: a
-- mission row appears only at the moment it is completed (`complete_mission`,
-- 20260703000004), so there was no honest way for the parent dashboard to
-- answer "how much time has my child spent learning this week?".
--
-- This adds a minimal, privacy-light ledger: one row per (student, day) holding
-- the seconds spent on a learning screen. The browser sends a heartbeat while a
-- mission or a homework module is open (see `src/features/study/`), and the
-- SECURITY DEFINER function below folds that heartbeat into the day's total.
--
-- Why a day bucket rather than raw sessions: the dashboard only ever shows
-- totals ("2h 15m this week", a per-day bar), the table stays tiny, and it
-- keeps no record of *when* inside the day a child was online.

create table public.study_time_daily (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  -- The student's local day is unknowable server-side; UTC is used consistently
  -- so a "week" is always seven of these rows.
  day date not null default (now() at time zone 'utc')::date,
  seconds integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (profile_id, day)
);

create index study_time_daily_profile_day_idx
  on public.study_time_daily (profile_id, day desc);

alter table public.study_time_daily enable row level security;

-- Reads: a student's own time, their parent's view of it, and their teacher's.
-- Writes go exclusively through `record_study_time` below — no insert/update
-- policy and no insert/update grant, so a browser can never invent time.
create policy "study_time_select_own" on public.study_time_daily
  for select using (auth.uid() = profile_id);

create policy "study_time_select_linked_student" on public.study_time_daily
  for select using (public.is_linked_student(profile_id));

create policy "study_time_select_group_student" on public.study_time_daily
  for select using (public.teaches_student(profile_id));

create policy "study_time_select_admin" on public.study_time_daily
  for select using (public.is_admin());

grant select on public.study_time_daily to authenticated;
grant all on public.study_time_daily to service_role;

-- =========================================================================
-- record_study_time(): add one heartbeat's worth of seconds to today.
--
-- The client sends the interval it just spent on a learning screen. The value
-- is clamped to a single sane heartbeat so a tampered or replayed call can at
-- most inflate the day by that interval, never by hours. Callers other than
-- students are ignored (returns the untouched total) — an admin previewing a
-- mission should not accumulate "study time".
-- =========================================================================

create or replace function public.record_study_time(p_seconds integer)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile uuid := auth.uid();
  v_role public.user_role;
  v_seconds integer;
  v_total integer;
begin
  if v_profile is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select role into v_role from public.profiles where id = v_profile;
  if v_role is distinct from 'student' then
    return 0;
  end if;

  -- One heartbeat is at most two minutes: the client ticks every 30s, and a
  -- backgrounded tab that wakes up late must not dump its whole absence in.
  v_seconds := least(greatest(coalesce(p_seconds, 0), 0), 120);
  if v_seconds = 0 then
    select seconds into v_total
    from public.study_time_daily
    where profile_id = v_profile and day = (now() at time zone 'utc')::date;
    return coalesce(v_total, 0);
  end if;

  insert into public.study_time_daily (profile_id, day, seconds)
  values (v_profile, (now() at time zone 'utc')::date, v_seconds)
  on conflict (profile_id, day) do update
    set seconds = public.study_time_daily.seconds + excluded.seconds,
        updated_at = now()
  returning seconds into v_total;

  return v_total;
end;
$$;

grant execute on function public.record_study_time(integer) to authenticated;
