-- TidyPro 0008: residential vs commercial customer type.
-- The customer "name" can be a person or a business name, so the type
-- is captured explicitly at creation.
--
-- Apply: supabase db push  (or paste into the Supabase SQL editor)
-- Idempotent: safe to re-run.

alter table public.customers
  add column if not exists customer_type text not null default 'residential'
  check (customer_type in ('residential', 'commercial'));

create index if not exists customers_type_idx
  on public.customers (company_id, customer_type);
