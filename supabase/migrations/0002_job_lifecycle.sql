-- Stage 5: job lifecycle fields.
-- Run after 0001_init.sql.
-- Idempotent: skips columns that already exist.
do $$
declare
  cols text[] := array['started_at', 'completion_notes', 'photos'];
  col text;
begin
  foreach col in array cols loop
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'jobs'
        and column_name = col
    ) then
      case col
        when 'started_at' then
          alter table public.jobs add column started_at timestamptz;
        when 'completion_notes' then
          alter table public.jobs add column completion_notes text;
        when 'photos' then
          alter table public.jobs
            add column photos jsonb not null default '[]'::jsonb;
      end case;
    end if;
  end loop;
end $$;

comment on column public.jobs.photos is
  'Photo documentation URLs. Upload UI is disabled until object storage is configured (see .env.example).';
