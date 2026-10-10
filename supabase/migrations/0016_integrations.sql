-- ============================================================
-- 0016 — Third-party integrations (Mailchimp + outgoing webhooks)
-- One row per company per provider in integration_connections
-- (Mailchimp API key stored encrypted, see lib/import/encryption.ts).
-- Outgoing event webhooks (works with Zapier / Make / n8n) live in
-- integration_webhooks. Plaintext secrets never leave server code.
-- ============================================================

create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  provider text not null check (provider in ('mailchimp')),
  status text not null default 'connected',
  config_enc text, -- encrypted JSON, e.g. {"api_key": "...", "dc": "us21"}
  meta jsonb not null default '{}'::jsonb, -- e.g. {"audience_id": "...", "audience_name": "...", "account_name": "..."}
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, provider)
);

create index if not exists integration_connections_company_idx
  on public.integration_connections (company_id);

create table if not exists public.integration_webhooks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  url_enc text not null, -- encrypted catch-hook URL
  events text[] not null default '{}'::text[],
  active boolean not null default true,
  last_triggered_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists integration_webhooks_company_idx
  on public.integration_webhooks (company_id);

-- RLS enabled with NO policies: server-only tables. All access goes
-- through the service-role client in lib/actions/integrations.ts and
-- lib/integrations/webhooks.ts.
alter table public.integration_connections enable row level security;
alter table public.integration_webhooks enable row level security;
