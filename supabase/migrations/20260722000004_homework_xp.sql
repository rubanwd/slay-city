-- SLAY CITY — award XP for homework completion.
--
-- Homework used to sit entirely outside the reward loop (see
-- 20260720000009_homework.sql). Product decision: finishing a homework module
-- should grant XP — the same progression currency a mission grants — while
-- coins stay mission/reward-driven only.
--
-- Like `complete_mission` (20260703000004), authenticated users have no UPDATE
-- grant on user_stats, so XP can only be added through these SECURITY DEFINER
-- functions. The per-(topic, child) unique index on each completions table is
-- the single point of truth: only the INSERT that actually wins the row grants
-- XP, so replaying a passed topic never re-grants.

-- Flat XP per homework module pass. Kept modest so teacher-assigned practice
-- supplements map progression without dwarfing it.
-- (Inlined as a constant in each function below — Postgres has no cheap
--  cross-function constant; keep the two values in sync if you change them.)

-- =========================================================================
-- Vocabulary module completion
-- =========================================================================

create or replace function public.complete_homework_vocab(p_topic_id uuid)
returns table (already_completed boolean, xp_earned integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile uuid := auth.uid();
  v_group uuid;
  v_xp constant integer := 50;
begin
  if v_profile is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  -- The topic (and thus its group) must exist, and the caller must be a member
  -- of that group — a child can only earn XP for homework actually assigned to
  -- them. `is_group_member` is the same SECURITY DEFINER membership check the
  -- homework RLS policies use.
  select group_id into v_group
  from public.homework_topics
  where id = p_topic_id;

  if not found then
    raise exception 'Topic not found' using errcode = 'P0002';
  end if;

  if not public.is_group_member(v_group) then
    raise exception 'Not a member of this group' using errcode = '42501';
  end if;

  insert into public.homework_vocab_completions (topic_id, child_id)
  values (p_topic_id, v_profile)
  on conflict (topic_id, child_id) do nothing;

  if not found then
    -- Already passed previously (or by a concurrent request) — no re-grant.
    already_completed := true;
    xp_earned := 0;
    return next;
    return;
  end if;

  update public.user_stats
  set xp = xp + v_xp
  where profile_id = v_profile;

  already_completed := false;
  xp_earned := v_xp;
  return next;
end;
$$;

grant execute on function public.complete_homework_vocab(uuid) to authenticated;

-- =========================================================================
-- Grammar module completion (mirrors the vocabulary function)
-- =========================================================================

create or replace function public.complete_homework_grammar(p_topic_id uuid)
returns table (already_completed boolean, xp_earned integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile uuid := auth.uid();
  v_group uuid;
  v_xp constant integer := 50;
begin
  if v_profile is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select group_id into v_group
  from public.homework_topics
  where id = p_topic_id;

  if not found then
    raise exception 'Topic not found' using errcode = 'P0002';
  end if;

  if not public.is_group_member(v_group) then
    raise exception 'Not a member of this group' using errcode = '42501';
  end if;

  insert into public.homework_grammar_completions (topic_id, child_id)
  values (p_topic_id, v_profile)
  on conflict (topic_id, child_id) do nothing;

  if not found then
    already_completed := true;
    xp_earned := 0;
    return next;
    return;
  end if;

  update public.user_stats
  set xp = xp + v_xp
  where profile_id = v_profile;

  already_completed := false;
  xp_earned := v_xp;
  return next;
end;
$$;

grant execute on function public.complete_homework_grammar(uuid) to authenticated;
