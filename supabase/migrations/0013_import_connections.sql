-- ============================================================
-- 0013 — API import connections (Jobber, Housecall Pro, Google Calendar)
-- One row per company per provider. OAuth tokens / API keys are stored
-- encrypted (see lib/import/encryption.ts); plaintext secrets never
-- leave server code. Run after 0012.
-- ============================================================

create table if not exists public.import_connections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  provider text not null check (provider in ('jobber','housecallpro','google_calendar')),
  access_token_enc text,
  refresh_token_enc text,
  expires_at timestamptz,
  meta jsonb not null default '{}'::jsonb, -- e.g. {"account_name": "..."}
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, provider)
);

create index if not exists import_connections_company_idx
  on public.import_connections (company_id);

-- RLS enabled with NO policies: server-only table. All access goes
-- through the service-role client in lib/import/connections.ts.
alter table public.import_connections enable row level security;
