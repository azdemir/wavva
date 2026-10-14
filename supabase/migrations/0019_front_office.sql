-- Front Office Service: founding-client applications, analytics, company
-- settings, escalation queue, conversation log, and Monday reports, plus
-- per-customer SMS/email consent metadata on customers.

-- ---------------------------------------------------------------- consent
alter table public.customers
  add column if not exists sms_consent_at timestamptz,
  add column if not exists sms_consent_source text,
  add column if not exists email_consent boolean not null default false,
  add column if not exists email_consent_at timestamptz,
  add column if not exists email_consent_source text;

-- ------------------------------------------------- founding applications
create table if not exists public.founding_applications (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  owner_name text not null,
  phone text not null,
  email text not null,
  city text not null,
  crew_count integer not null default 0 check (crew_count >= 0),
  current_tools text not null default '',
  plan_interest text not null check (plan_interest in ('front_desk', 'full_office')),
  status text not null default 'new'
    check (status in ('new', 'approved', 'declined', 'waitlisted')),
  created_at timestamptz not null default now()
);
alter table public.founding_applications enable row level security;
-- Public can submit applications (anon insert); reads stay server-side
-- (service role) so applicant data is never exposed.
drop policy if exists founding_applications_insert on public.founding_applications;
create policy founding_applications_insert on public.founding_applications
  for insert with check (true);

-- ------------------------------------------------------------ analytics
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  props jsonb not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.analytics_events enable row level security;
drop policy if exists analytics_events_insert on public.analytics_events;
create policy analytics_events_insert on public.analytics_events
  for insert with check (true);

-- ------------------------------------------------- company FO settings
create table if not exists public.front_office_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  plan text not null check (plan in ('front_desk', 'full_office')),
  price_list jsonb not null default '[]',
  service_area text not null default '',
  policies text not null default '',
  business_line text not null default '',
  enquiry_inbox text not null default '',
  timezone text not null default 'America/New_York',
  quiet_hours_start time not null default '08:00',
  quiet_hours_end time not null default '21:00',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id)
);
create index if not exists front_office_settings_company_idx
  on public.front_office_settings (company_id);
alter table public.front_office_settings enable row level security;
drop policy if exists front_office_settings_all on public.front_office_settings;
create policy front_office_settings_all on public.front_office_settings
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));

-- ------------------------------------------------- escalation queue
create table if not exists public.front_office_escalations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  kind text not null check (kind in ('off_price_quote', 'unusual')),
  title text not null,
  detail text not null default '',
  payload jsonb not null default '{}',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'edited', 'declined')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists front_office_escalations_company_idx
  on public.front_office_escalations (company_id, status, created_at desc);
alter table public.front_office_escalations enable row level security;
drop policy if exists front_office_escalations_all on public.front_office_escalations;
create policy front_office_escalations_all on public.front_office_escalations
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));

-- ------------------------------------------------- conversation log
create table if not exists public.front_office_conversations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  channel text not null check (channel in ('call', 'sms', 'email')),
  direction text not null check (direction in ('in', 'out')),
  body text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists front_office_conversations_customer_idx
  on public.front_office_conversations (company_id, customer_id, created_at desc);
alter table public.front_office_conversations enable row level security;
drop policy if exists front_office_conversations_all on public.front_office_conversations;
create policy front_office_conversations_all on public.front_office_conversations
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));

-- ------------------------------------------------- Monday reports
create table if not exists public.front_office_reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  week_start date not null,
  payload jsonb not null default '{}',
  sent_at timestamptz,
  unique (company_id, week_start)
);
alter table public.front_office_reports enable row level security;
drop policy if exists front_office_reports_all on public.front_office_reports;
create policy front_office_reports_all on public.front_office_reports
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));
