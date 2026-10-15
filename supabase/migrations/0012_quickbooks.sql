-- TidyPro 0012: QuickBooks Online integration.
--
-- One connection row per TidyPro company. OAuth tokens are stored encrypted
-- (see lib/quickbooks/crypto.ts); plaintext tokens never leave server code.
-- The OAuth connect/callback flow is NOT built yet (deferred until the Intuit
-- Developer app exists) — this schema lets everything else land first.
--
-- Apply: supabase db push  (or paste into the Supabase SQL editor)
-- Idempotent: safe to re-run.

-- ---------------------------------------------------------------------------
-- Connections
-- ---------------------------------------------------------------------------
create table if not exists public.quickbooks_connections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  realm_id text not null,
  company_name text,
  access_token_enc text not null,
  refresh_token_enc text not null,
  token_expires_at timestamptz not null,
  qbo_item_id text,
  status text not null default 'active'
    check (status in ('active', 'expired', 'revoked', 'error')),
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quickbooks_connections_company_idx
  on public.quickbooks_connections (company_id);

alter table public.quickbooks_connections enable row level security;

drop policy if exists quickbooks_connections_all on public.quickbooks_connections;
create policy quickbooks_connections_all on public.quickbooks_connections
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));

-- ---------------------------------------------------------------------------
-- Map local records to their QuickBooks counterparts
-- ---------------------------------------------------------------------------
alter table public.customers
  add column if not exists qbo_id text;

alter table public.invoices
  add column if not exists qbo_id text;

alter table public.payments
  add column if not exists qbo_id text;
-- QBO payments are recorded with provider = 'quickbooks' and
-- provider_ref = the QuickBooks payment id (reuses the existing columns).

create index if not exists customers_qbo_idx
  on public.customers (company_id, qbo_id) where qbo_id is not null;

create index if not exists invoices_qbo_idx
  on public.invoices (company_id, qbo_id) where qbo_id is not null;

-- Idempotent payment ingest: the same QBO payment can never be recorded twice.
create unique index if not exists payments_qbo_unique
  on public.payments (company_id, qbo_id) where qbo_id is not null;

-- ---------------------------------------------------------------------------
-- Append-only sync log (debugging, audit, retry)
-- ---------------------------------------------------------------------------
create table if not exists public.quickbooks_sync_log (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  entity text not null check (entity in ('customer', 'invoice', 'payment')),
  entity_id uuid,
  direction text not null check (direction in ('push', 'pull')),
  status text not null check (status in ('ok', 'failed')),
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists quickbooks_sync_log_company_idx
  on public.quickbooks_sync_log (company_id, created_at desc);

alter table public.quickbooks_sync_log enable row level security;

drop policy if exists quickbooks_sync_log_all on public.quickbooks_sync_log;
create policy quickbooks_sync_log_all on public.quickbooks_sync_log
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));
