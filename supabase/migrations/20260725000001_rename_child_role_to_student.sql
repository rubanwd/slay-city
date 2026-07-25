-- SLAY CITY — rename the 'child' role to 'student'
--
-- Product rename: the learner-facing role is now "student", not "child". The
-- app, the schema and the copy all move together; this file does the enum half.
--
-- `ALTER TYPE ... RENAME VALUE` rewrites only the label — every existing
-- `profiles.role` row (and the `default 'child'` on that column, which is
-- stored as an enum OID constant) follows automatically, so no data backfill is
-- needed here.
--
-- Kept in its own migration/transaction to mirror 20260720000007_add_teacher_role.sql:
-- the objects that reference the renamed label live in the next migration file.

alter type public.user_role rename value 'child' to 'student';
