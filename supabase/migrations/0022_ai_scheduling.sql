-- AI scheduling: per-company availability settings, AI-made bookings,
-- and an AI quote log.
--
-- How the AI talks about the calendar:
--   1. The dashboard stores availability on front_office_settings
--      (business hours per weekday, slot length, buffer, booking horizon).
--   2. On a call, the AI never reads a raw calendar. It calls the
--      check_availability tool; server code computes free slots from the
--      settings minus existing front_office_ai_bookings (buffered).
--   3. book_appointment re-verifies the slot server-side at booking time,
--      so two callers can never double-book the same slot.

-- ------------------------------------------------- availability settings
alter table public.front_office_settings
  add column if not exists ai_booking_enabled boolean not null default false,
  add column if not exists ai_slot_minutes integer not null default 60
    check (ai_slot_minutes between 15 and 480),
  add column if not exists ai_buffer_minutes integer not null default 15
    check (ai_buffer_minutes between 0 and 180),
  add column if not exists ai_max_days_ahead integer not null default 14
    check (ai_max_days_ahead between 1 and 60),
  add column if not exists ai_business_hours jsonb not null default
    '{"mon":[["09:00","17:00"]],"tue":[["09:00","17:00"]],"wed":[["09:00","17:00"]],"thu":[["09:00","17:00"]],"fri":[["09:00","17:00"]],"sat":[],"sun":[]}';

-- ------------------------------------------------- AI-made bookings
-- Kept separate from public.bookings (which requires a customer_id and a
-- service address the AI doesn't have yet). The owner converts these into
-- real bookings from the dashboard.
create table if not exists public.front_office_ai_bookings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  call_id uuid references public.front_office_ai_calls(id) on delete set null,
  caller_name text not null default '',
  caller_phone text not null default '',
  service_name text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'booked'
    check (status in ('booked', 'canceled', 'completed')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index if not exists front_office_ai_bookings_company_idx
  on public.front_office_ai_bookings (company_id, starts_at);
alter table public.front_office_ai_bookings enable row level security;
drop policy if exists front_office_ai_bookings_all on public.front_office_ai_bookings;
create policy front_office_ai_bookings_all on public.front_office_ai_bookings
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));

-- ------------------------------------------------- AI quote log
-- Every price the AI speaks on a call is recorded here with the call it
-- came from, so the owner can see exactly what was quoted to whom.
create table if not exists public.front_office_ai_quotes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  call_id uuid references public.front_office_ai_calls(id) on delete set null,
  caller_phone text not null default '',
  service_name text not null default '',
  amount_min_cents integer not null default 0 check (amount_min_cents >= 0),
  amount_max_cents integer not null default 0 check (amount_max_cents >= 0),
  created_at timestamptz not null default now()
);
create index if not exists front_office_ai_quotes_company_idx
  on public.front_office_ai_quotes (company_id, created_at desc);
alter table public.front_office_ai_quotes enable row level security;
drop policy if exists front_office_ai_quotes_all on public.front_office_ai_quotes;
create policy front_office_ai_quotes_all on public.front_office_ai_quotes
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));
