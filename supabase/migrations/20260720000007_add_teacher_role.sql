-- SLAY CITY — add the 'teacher' role
--
-- Kept in its own migration/transaction: Postgres forbids using a brand-new
-- enum value in the same transaction that adds it, so the tables/policies/
-- functions that reference 'teacher' live in the next migration file.

alter type public.user_role add value 'teacher';
