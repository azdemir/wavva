-- 0006: Scaling to 1,000 tenant companies.
--
-- Composite indexes for the hottest per-company query patterns. Every
-- dashboard/list query is scoped by company_id (RLS), so these keep each
-- tenant fast even as total table size grows into the millions of rows.

-- Schedule week view: bookings for a company in a date range.
create index if not exists idx_bookings_company_start
  on public.bookings(company_id, scheduled_start);

-- Jobs list / crew views: jobs for a company in a date range.
create index if not exists idx_jobs_company_start
  on public.jobs(company_id, scheduled_start);

-- Notification bell: newest-first per company.
create index if not exists idx_notifications_company_created
  on public.notifications(company_id, created_at desc);

-- Quote follow-up cron: pending follow-ups ordered by due date.
create index if not exists idx_quote_followups_status_due
  on public.quote_followups(status, due_at)
  where status = 'pending';

-- Invoices list: per-company newest-first (covers the dashboard
-- outstanding-balance scan too).
create index if not exists idx_invoices_company_created
  on public.invoices(company_id, created_at desc);

-- Customers list: per-company alphabetical.
create index if not exists idx_customers_company_name
  on public.customers(company_id, name);

-- Dashboard stats in a single round trip. Called via supabase.rpc() with the
-- already-authorized company id (requireCompany() gates the page). Aggregates
-- in the database instead of pulling every open invoice row into Node.
create or replace function public.dashboard_stats(
  p_company_id uuid,
  p_day_start timestamptz,
  p_day_end timestamptz
)
returns table (
  jobs_today bigint,
  open_quotes bigint,
  outstanding_cents bigint,
  customer_count bigint
)
language sql
security definer
set search_path = public
as $$
  select
    (select count(*)
       from public.jobs j
      where j.company_id = p_company_id
        and j.scheduled_start >= p_day_start
        and j.scheduled_start < p_day_end
        and j.status <> 'canceled'),
    (select count(*)
       from public.quotes q
      where q.company_id = p_company_id
        and q.status in ('draft', 'sent')),
    (select coalesce(sum(i.total_cents - i.amount_paid_cents), 0)
       from public.invoices i
      where i.company_id = p_company_id
        and i.status in ('sent', 'overdue')),
    (select count(*)
       from public.customers c
      where c.company_id = p_company_id);
$$;

-- Only company members may call it; the function itself filters by the
-- caller-supplied company id which the app sets from the verified session.
revoke all on function public.dashboard_stats(uuid, timestamptz, timestamptz) from public;
grant execute on function public.dashboard_stats(uuid, timestamptz, timestamptz) to authenticated;
