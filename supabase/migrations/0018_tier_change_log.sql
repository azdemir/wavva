-- 0018: audit log for Studio subscription-tier changes.
-- Every tier change made through /studio/tiers is recorded here with the
-- acting platform admin, the affected user (company owner), the previous
-- and new tiers, and the timestamp. Append-only: rows are never updated
-- or deleted by the application (company deletion cascades).
-- Idempotent: safe to re-run (repairs partial runs).

create table if not exists public.tier_change_log (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  company_name text not null default '',
  affected_user_id uuid,
  affected_user_email text not null,
  previous_tier text not null,
  new_tier text not null,
  admin_email text not null,
  created_at timestamptz not null default now()
);

create index if not exists tier_change_log_company_idx
  on public.tier_change_log (company_id, created_at desc);

create index if not exists tier_change_log_created_idx
  on public.tier_change_log (created_at desc);

alter table public.tier_change_log enable row level security;
-- No public policies: all access runs through the service-role client
-- inside platform-admin-gated server actions only (lib/studio/tiers.ts).
