-- 0021: migrate platform plans from legacy TidyPro tiers
-- ('basic', 'starter', 'growth', 'pro') to Wavva tiers
-- ('essential', 'complete').
-- Mapping: basic/starter -> essential, growth/pro -> complete.
-- Idempotent: safe to re-run (repairs partial runs).

-- 1. Migrate existing company plan values first (so the new CHECK passes).
update public.companies
set plan = case
  when plan in ('basic', 'starter') then 'essential'
  when plan in ('growth', 'pro') then 'complete'
  else plan
end
where plan in ('basic', 'starter', 'growth', 'pro');

-- 2. Replace the check constraint.
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

alter table public.companies
  add constraint companies_plan_check
  check (plan in ('essential', 'complete'));

-- 3. Keep the default sensible for new companies.
alter table public.companies
  alter column plan set default 'essential';

comment on column public.companies.plan is
  'Wavva platform plan: essential ($299/mo, 250 AI minutes) or complete ($599/mo, 600 AI minutes)';
