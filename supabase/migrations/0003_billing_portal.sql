-- Stage 6: Stripe Connect + customer portal.
-- Run after 0002_job_lifecycle.sql.

-- Stripe Connect account for receiving customer payments.
-- Idempotent: skips columns that already exist.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'companies'
      and column_name = 'stripe_account_id'
  ) then
    alter table public.companies add column stripe_account_id text;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'companies'
      and column_name = 'stripe_onboarded'
  ) then
    alter table public.companies
      add column stripe_onboarded boolean not null default false;
  end if;
end $$;

-- Bearer tokens for the customer portal (no login required).
-- A token grants access to one customer's quotes, bookings, and invoices.
create table if not exists public.portal_tokens (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  token uuid not null default gen_random_uuid() unique,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_portal_tokens_company on public.portal_tokens(company_id);
create index if not exists idx_portal_tokens_customer on public.portal_tokens(customer_id);

alter table public.portal_tokens enable row level security;

-- Portal tokens are managed by company members; portal pages themselves
-- look tokens up with the service-role key (bearer-token authorization).
drop policy if exists portal_tokens_all on public.portal_tokens;
create policy portal_tokens_all on public.portal_tokens
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));
