-- ============================================================
-- 0015 — Reusable digital checklist templates for appointments
--
-- Companies define checklist templates once (e.g. "Standard clean",
-- "Deep clean", "Move-out") in Settings. When a booking (appointment)
-- is created, staff can attach a template; every job visit the booking
-- generates is seeded with the template's items, which the cleaner
-- checks off digitally on the job detail page (existing per-job
-- checklist UI). Visits stay independent: editing a job's checklist
-- never touches the template or other visits.
-- Run after 0014.
-- ============================================================

create table if not exists public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists checklist_templates_company_idx
  on public.checklist_templates (company_id);

alter table public.checklist_templates enable row level security;

drop policy if exists checklist_templates_all on public.checklist_templates;
create policy checklist_templates_all on public.checklist_templates
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));

-- Attach a template to a booking (appointment). Set null when the
-- template is deleted; seeded visit checklists are unaffected.
alter table public.bookings
  add column if not exists checklist_template_id uuid
  references public.checklist_templates(id) on delete set null;
