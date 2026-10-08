-- Stage 5: job lifecycle fields.
-- Run after 0001_init.sql.

alter table public.jobs
  add column started_at timestamptz,
  add column completion_notes text,
  -- photos: [{ url, caption, taken_at }] — populated once object storage is configured.
  add column photos jsonb not null default '[]'::jsonb;

comment on column public.jobs.photos is
  'Photo documentation URLs. Upload UI is disabled until object storage is configured (see .env.example).';
