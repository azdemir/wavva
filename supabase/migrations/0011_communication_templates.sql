-- ============================================================
-- 0011 — Per-company communication template overrides
-- Only overrides are stored here; defaults live in code
-- (lib/communications/templates.ts) so future default improvements
-- propagate to companies that haven't customized a template.
-- Also adds the 'skipped' status to notifications (used when a
-- template is disabled, or SMS has no provider configured yet).
-- Run after 0010.
-- ============================================================

create table if not exists public.communication_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  template_key text not null,
  channel text not null check (channel in ('email', 'sms')),
  subject text,
  body text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, template_key, channel)
);

create index if not exists communication_templates_company_idx
  on public.communication_templates (company_id);

alter table public.communication_templates enable row level security;

drop policy if exists communication_templates_all on public.communication_templates;
create policy communication_templates_all on public.communication_templates
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));

-- 'skipped': template disabled by the company, or SMS queued while no
-- provider is configured. Distinct from 'failed' so a later re-run or a
-- re-enabled template doesn't look like an error.
alter table public.notifications drop constraint if exists notifications_status_check;
alter table public.notifications
  add constraint notifications_status_check
  check (status in ('queued', 'sent', 'failed', 'skipped'));
