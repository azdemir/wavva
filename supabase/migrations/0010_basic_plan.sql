-- 0010: allow the 'basic' platform plan on companies.plan.
-- Idempotent: safe to re-run (repairs partial runs).

do $$
begin
  -- Drop the old three-plan check constraint if it exists.
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
  check (plan in ('basic', 'starter', 'growth', 'pro'));
