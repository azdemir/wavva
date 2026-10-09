-- TidyPro 0007: before/after job photos.
-- Photos are stored in S3-compatible object storage (see lib/storage.ts);
-- this table tracks which objects belong to which job and whether they
-- were taken before or after the work.
--
-- Apply: supabase db push  (or paste into the Supabase SQL editor)
-- Idempotent: safe to re-run.

create table if not exists public.job_photos (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  kind text not null check (kind in ('before', 'after')),
  storage_key text not null,
  content_type text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists job_photos_job_idx
  on public.job_photos (job_id, kind, created_at);

alter table public.job_photos enable row level security;

drop policy if exists job_photos_all on public.job_photos;
create policy job_photos_all on public.job_photos
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));
