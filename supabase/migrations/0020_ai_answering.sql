-- AI call answering: per-company voice settings, AI call log (minute
-- metering), and booking-request escalations.
--
-- The AI answering pipeline (Twilio inbound voice -> /api/webhooks/voice ->
-- OpenAI turn loop) stores one row per call here. Minutes are metered from
-- duration_seconds and counted against the plan's included minutes
-- (see FRONT_OFFICE_PLANS in lib/front-office.ts).

-- ------------------------------------------------- AI answering settings
alter table public.front_office_settings
  add column if not exists ai_answering_enabled boolean not null default true,
  add column if not exists ai_greeting_override text not null default '',
  add column if not exists ai_model text not null default 'gpt-4o-mini'
    check (ai_model in ('gpt-4o-mini', 'gpt-4o')),
  add column if not exists owner_phone text not null default '';

-- ------------------------------------------------- booking-request kind
-- The assistant books by writing a booking_request escalation; the owner
-- confirms it in the existing escalation queue.
alter table public.front_office_escalations
  drop constraint if exists front_office_escalations_kind_check;
alter table public.front_office_escalations
  add constraint front_office_escalations_kind_check
  check (kind in ('off_price_quote', 'unusual', 'booking_request'));

-- ------------------------------------------------- AI call log
create table if not exists public.front_office_ai_calls (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  call_sid text not null unique,
  from_number text not null default '',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  transcript jsonb not null default '[]',
  escalated boolean not null default false,
  outcome text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists front_office_ai_calls_company_idx
  on public.front_office_ai_calls (company_id, started_at desc);
alter table public.front_office_ai_calls enable row level security;
drop policy if exists front_office_ai_calls_all on public.front_office_ai_calls;
create policy front_office_ai_calls_all on public.front_office_ai_calls
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));
