-- SLAY CITY — backfill the auth user metadata left over from the "child" wording
--
-- The last piece of the child -> student rename that lives in *data* rather than
-- in the schema. Two keys in `auth.users.raw_user_meta_data` are written by the
-- signup action (`src/features/auth/actions.ts`):
--
--   * `child_email` — the (future-linked) student's email a parent registers
--     with. `/parent` reads it on every visit to (re)establish the link, so an
--     un-migrated parent account would silently stop linking.
--   * `role` — the role self-selected at signup, which could hold the old
--     'child' literal. Only 'parent' is actually read today, but leaving a
--     stale value behind would break the flag the moment it is consulted.
--
-- Kept out of 20260725000002 so the schema rename commits independently of this
-- write to the `auth` schema. Both statements are idempotent (the WHERE clauses
-- match only un-migrated rows), so this is safe to re-run.

update auth.users
set raw_user_meta_data =
  (raw_user_meta_data - 'child_email')
  || jsonb_build_object('student_email', raw_user_meta_data -> 'child_email')
where raw_user_meta_data ? 'child_email';

update auth.users
set raw_user_meta_data = jsonb_set(raw_user_meta_data, '{role}', '"student"'::jsonb)
where raw_user_meta_data ->> 'role' = 'child';
