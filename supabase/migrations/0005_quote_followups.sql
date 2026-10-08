-- ============================================================
-- 0005 — Automated quote follow-up ("quotes that follow up themselves")
-- When a quote is sent, follow-up touches are scheduled (default: day 2
-- and day 5). The cron endpoint sends each touch only while the quote is
-- still in "sent" status; approving/declining/expiring cancels the rest.
-- Run after 0004.
-- ============================================================

create table if not exists public.quote_followups (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  quote_id uuid not null references public.quotes(id) on delete cascade,
  step smallint not null,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists quote_followups_due_idx
  on public.quote_followups (scheduled_for)
  where sent_at is null;

alter table public.quote_followups enable row level security;

drop policy if exists quote_followups_all on public.quote_followups;
create policy quote_followups_all on public.quote_followups
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));
