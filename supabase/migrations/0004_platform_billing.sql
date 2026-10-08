-- ============================================================
-- 0004 — Platform subscription billing (TidyPro plans)
-- The cleaning company itself subscribes to a TidyPro plan
-- (Starter / Growth / Pro) via Stripe Billing. This is separate
-- from Stripe Connect, which the company uses to charge ITS
-- customers. Run after 0003.
-- ============================================================

alter table public.companies
  add column if not exists plan text not null default 'starter'
    check (plan in ('starter', 'growth', 'pro')),
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text not null default 'none';

comment on column public.companies.plan is
  'TidyPro subscription tier: starter | growth | pro';
comment on column public.companies.stripe_customer_id is
  'Stripe customer id for platform billing (NOT the Connect account)';
comment on column public.companies.stripe_subscription_id is
  'Active Stripe Billing subscription id for the platform plan';
comment on column public.companies.subscription_status is
  'none | trialing | active | past_due | unpaid | canceled';
