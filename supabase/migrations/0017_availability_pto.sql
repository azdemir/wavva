-- ============================================================
-- 0017 — Cleaner availability & paid-time-off (PTO) tracking
--
-- Two tables, available on every plan (no tier gating):
--
-- cleaner_availability — weekly-recurring available time windows per
--   team member. weekday follows JS Date.getDay(): 0 = Sunday .. 6 =
--   Saturday. A weekday with no rows means the member is unavailable
--   that day. Cleaners edit their own rows; owners/managers may edit
--   anyone's.
--
-- time_off_requests — date-range PTO requests. Cleaners request their
--   own; staff approve/deny, or log a request directly (created
--   pre-approved).
--
-- RLS is enabled with no public policies; all reads/writes go through
-- the service-role client inside server actions in
-- lib/actions/availability.ts (authorization enforced there).
-- Run after 0016.
-- ============================================================

create table if not exists public.cleaner_availability (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  membership_id uuid not null references public.memberships(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  check (end_time > start_time),
  created_at timestamptz not null default now(),
  unique (company_id, membership_id, weekday, start_time)
);

create index if not exists cleaner_availability_member_idx
  on public.cleaner_availability (company_id, membership_id);

alter table public.cleaner_availability enable row level security;

create table if not exists public.time_off_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  membership_id uuid not null references public.memberships(id) on delete cascade,
  starts_on date not null,
  ends_on date not null,
  check (ends_on >= starts_on),
  reason text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'denied')),
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists time_off_requests_company_status_idx
  on public.time_off_requests (company_id, status);

alter table public.time_off_requests enable row level security;
