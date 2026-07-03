-- Optional child age, collected during onboarding. Nullable since it's an
-- optional form field; constrained to the product's target age range.
alter table public.profiles
  add column age smallint check (age is null or age between 7 and 14);
