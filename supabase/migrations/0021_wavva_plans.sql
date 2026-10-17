-- 0021: migrate platform plans from legacy TidyPro tiers
-- ('basic', 'starter', 'growth', 'pro') to Wavva tiers
-- ('essential', 'complete').
-- Mapping: basic/starter -> essential, growth/pro -> complete.
-- Idempotent: safe to re-run (repairs partial runs).
--
-- FIX 2026-10-17: the original version ran the data UPDATE (step 2 below)
-- BEFORE dropping the legacy check constraint. The legacy
-- companies_plan_check (from 0010, legacy tiers only) is still enforced at
-- that point, so setting plan='complete' violates it (SQLSTATE 23514) —
-- caught by the Supabase Preview check on the 420caee push. The constraint
-- must be dropped FIRST, then data migrated, then the new constraint added.

-- 1. Drop the legacy check constraint FIRST (it only allows old tier
-- values; the data migration would violate it otherwise).
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'companies_plan_check'
      and conrelid = 'public.companies'::regclass
  ) then
    alter table public.companies drop constraint companies_plan_check;
  end if;
end $$;

-- 2. Migrate existing company plan values.
update public.companies
set plan = case
  when plan in ('basic', 'starter') then 'essential'
  when plan in ('growth', 'pro') then 'complete'
  else plan
end
where plan in ('basic', 'starter', 'growth', 'pro');

-- 3. Add the new check constraint (guarded so re-runs don't fail).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'companies_plan_check'
      and conrelid = 'public.companies'::regclass
  ) then
    alter table public.companies
      add constraint companies_plan_check
      check (plan in ('essential', 'complete'));
  end if;
end $$;

-- 4. Keep the default sensible for new companies.
alter table public.companies
  alter column plan set default 'essential';

comment on column public.companies.plan is
  'Wavva platform plan: essential ($299/mo, 250 AI minutes) or complete ($599/mo, 600 AI minutes)';
