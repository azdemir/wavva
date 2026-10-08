-- TidyPro initial schema: multi-tenant SaaS for cleaning businesses.
-- Every tenant table carries company_id. Row-Level Security (RLS) enforces
-- tenant isolation in the database: application code never filters by hand.
--
-- Apply: supabase db push  (or paste into the Supabase SQL editor)
-- Requires: PostgreSQL 15+ (Supabase default). Uses auth.uid() from Supabase Auth.

-- ============================================================
-- Tables
-- ============================================================

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  phone text,
  email text,
  website text,
  timezone text not null default 'America/New_York',
  currency text not null default 'USD',
  -- settings: { default_tax_rate, cancellation_policy,
  --             frequency_multipliers: { weekly, biweekly, monthly } }
  settings jsonb not null default '{}'::jsonb,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  email text not null,
  role text not null check (role in ('owner', 'manager', 'cleaner')),
  created_at timestamptz not null default now(),
  unique (user_id, company_id)
);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  email text not null,
  role text not null check (role in ('owner', 'manager', 'cleaner')),
  token uuid not null default gen_random_uuid() unique,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (company_id, email)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  notes text,
  sms_consent boolean not null default false,
  notif_prefs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.service_addresses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  label text not null default 'Home',
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  zip text not null,
  -- Sensitive: only shown to assigned staff in the app (enforced in UI, stage 5).
  access_instructions text,
  cleaning_prefs jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  category text not null check (category in ('residential', 'commercial')),
  description text,
  base_price_cents integer not null default 0,
  unit text not null default 'per_visit'
    check (unit in ('per_visit', 'per_hour', 'per_sqft')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.addons (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  price_cents integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.service_areas (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  area_type text not null check (area_type in ('city', 'county', 'zip', 'radius')),
  value text not null,
  created_at timestamptz not null default now()
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  quote_number text not null,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'approved', 'declined', 'expired')),
  subtotal_cents integer not null default 0,
  discount_cents integer not null default 0,
  tax_rate numeric(5,4) not null default 0,
  tax_cents integer not null default 0,
  total_cents integer not null default 0,
  valid_until date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, quote_number)
);

create table public.quote_line_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  quote_id uuid not null references public.quotes(id) on delete cascade,
  kind text not null check (kind in ('service', 'addon', 'custom')),
  ref_id uuid,
  label text not null,
  qty numeric not null default 1,
  unit_price_cents integer not null default 0,
  line_total_cents integer not null default 0,
  sort integer not null default 0
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  service_address_id uuid not null references public.service_addresses(id) on delete restrict,
  service_id uuid references public.services(id) on delete set null,
  quote_id uuid references public.quotes(id) on delete set null,
  booking_number text not null,
  recurrence text not null default 'none'
    check (recurrence in ('none', 'weekly', 'biweekly', 'monthly')),
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'in_progress', 'completed', 'canceled')),
  -- Snapshot of the company's cancellation policy at booking time.
  cancellation_policy text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, booking_number)
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  service_address_id uuid not null references public.service_addresses(id) on delete restrict,
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'in_progress', 'completed', 'canceled')),
  -- Crew assignment lands here in stage 5.
  assigned_user_ids uuid[] not null default '{}',
  checklist jsonb not null default '[]'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  booking_id uuid references public.bookings(id) on delete set null,
  invoice_number text not null,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'paid', 'overdue', 'void')),
  subtotal_cents integer not null default 0,
  tax_rate numeric(5,4) not null default 0,
  tax_cents integer not null default 0,
  total_cents integer not null default 0,
  amount_paid_cents integer not null default 0,
  due_date date,
  notes text,
  stripe_invoice_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, invoice_number)
);

create table public.invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  label text not null,
  qty numeric not null default 1,
  unit_price_cents integer not null default 0,
  line_total_cents integer not null default 0,
  sort integer not null default 0
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete restrict,
  amount_cents integer not null,
  status text not null default 'pending'
    check (status in ('pending', 'succeeded', 'failed', 'refunded')),
  provider text not null default 'stripe',
  provider_ref text,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  recipient_type text not null check (recipient_type in ('customer', 'user')),
  recipient_id uuid not null,
  channel text not null check (channel in ('email', 'sms')),
  template text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued'
    check (status in ('queued', 'sent', 'failed')),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Helper functions (SECURITY DEFINER so RLS policies avoid recursion)
-- ============================================================

create or replace function public.user_company_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select company_id from public.memberships where user_id = auth.uid();
$$;

create or replace function public.is_company_owner(cid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.memberships
    where company_id = cid and user_id = auth.uid() and role = 'owner'
  );
$$;

create or replace function public.company_member_count(cid uuid)
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::integer from public.memberships where company_id = cid;
$$;


-- ============================================================
-- Indexes
-- ============================================================

create index idx_memberships_user on public.memberships(user_id);
create index idx_memberships_company on public.memberships(company_id);
create index idx_invites_company on public.invites(company_id);
create index idx_customers_company on public.customers(company_id);
create index idx_service_addresses_company on public.service_addresses(company_id);
create index idx_service_addresses_customer on public.service_addresses(customer_id);
create index idx_services_company on public.services(company_id);
create index idx_addons_company on public.addons(company_id);
create index idx_service_areas_company on public.service_areas(company_id);
create index idx_quotes_company on public.quotes(company_id);
create index idx_quotes_customer on public.quotes(customer_id);
create index idx_quote_line_items_quote on public.quote_line_items(quote_id);
create index idx_bookings_company on public.bookings(company_id);
create index idx_bookings_customer on public.bookings(customer_id);
create index idx_jobs_company on public.jobs(company_id);
create index idx_jobs_booking on public.jobs(booking_id);
create index idx_jobs_start on public.jobs(scheduled_start);
create index idx_invoices_company on public.invoices(company_id);
create index idx_invoice_line_items_invoice on public.invoice_line_items(invoice_id);
create index idx_payments_invoice on public.payments(invoice_id);
create index idx_notifications_company on public.notifications(company_id);
create index idx_audit_logs_company on public.audit_logs(company_id);

-- ============================================================
-- Row-Level Security
-- ============================================================

alter table public.companies enable row level security;
alter table public.memberships enable row level security;
alter table public.invites enable row level security;
alter table public.customers enable row level security;
alter table public.service_addresses enable row level security;
alter table public.services enable row level security;
alter table public.addons enable row level security;
alter table public.service_areas enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_line_items enable row level security;
alter table public.bookings enable row level security;
alter table public.jobs enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_line_items enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- Companies: members read; any signed-in user can create (onboarding);
-- members update; owners delete.
create policy companies_select on public.companies
  for select using (id in (select public.user_company_ids()));
create policy companies_insert on public.companies
  for insert with check (auth.uid() is not null);
create policy companies_update on public.companies
  for update using (id in (select public.user_company_ids()));
create policy companies_delete on public.companies
  for delete using (public.is_company_owner(id));

-- Memberships: members read their companies' rosters.
-- Insert: self-join only, and only as the very first member (onboarding)
-- or by an owner (team management goes through invites in the app).
create policy memberships_select on public.memberships
  for select using (company_id in (select public.user_company_ids()));
create policy memberships_insert on public.memberships
  for insert with check (
    user_id = auth.uid() and (
      public.company_member_count(company_id) = 0
      or public.is_company_owner(company_id)
    )
  );
create policy memberships_update on public.memberships
  for update using (public.is_company_owner(company_id));
create policy memberships_delete on public.memberships
  for delete using (
    user_id = auth.uid() or public.is_company_owner(company_id)
  );

-- Invites: owners manage; acceptance happens via service role (token lookup).
create policy invites_select on public.invites
  for select using (company_id in (select public.user_company_ids()));
create policy invites_insert on public.invites
  for insert with check (public.is_company_owner(company_id));
create policy invites_update on public.invites
  for update using (public.is_company_owner(company_id));
create policy invites_delete on public.invites
  for delete using (public.is_company_owner(company_id));

-- Standard tenant tables: full access within your own companies.
-- (Finer role restrictions, e.g. cleaners read-only, land in a later stage.)
create policy customers_all on public.customers
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));
create policy service_addresses_all on public.service_addresses
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));
create policy services_all on public.services
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));
create policy addons_all on public.addons
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));
create policy service_areas_all on public.service_areas
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));
create policy quotes_all on public.quotes
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));
create policy quote_line_items_all on public.quote_line_items
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));
create policy bookings_all on public.bookings
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));
create policy jobs_all on public.jobs
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));
create policy invoices_all on public.invoices
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));
create policy invoice_line_items_all on public.invoice_line_items
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));
create policy payments_all on public.payments
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));
create policy notifications_all on public.notifications
  for all using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));

-- Audit logs: append-only for members.
create policy audit_logs_select on public.audit_logs
  for select using (company_id in (select public.user_company_ids()));
create policy audit_logs_insert on public.audit_logs
  for insert with check (company_id in (select public.user_company_ids()));
