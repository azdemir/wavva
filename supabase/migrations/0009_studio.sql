-- 0009_studio.sql — TidyPro Studio (founder/dev HQ)
--
-- site_content: key/value store for every no-code editable piece of website
-- copy. The marketing site renders registry defaults when a key has no row,
-- so the site works with zero Studio configuration.
--
-- crm_contacts / crm_activities: the SaaS's own lead/customer pipeline
-- (contact-form submissions, trial requests, manual entries).
--
-- All three tables are platform-scoped: RLS is enabled with NO permissive
-- policies. Reads of site_content use the anon key through a public SELECT
-- policy (it is public marketing copy); everything else goes through the
-- service-role client inside server code guarded by requirePlatformAdmin()
-- (email allowlist PLATFORM_ADMIN_EMAILS).

-- ---------------------------------------------------------------------------
-- site_content
-- ---------------------------------------------------------------------------
create table if not exists site_content (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table site_content enable row level security;

-- Marketing copy is public; the anon key may read it for static rendering.
-- (Writes happen only via the service role in platform-admin server actions.)
drop policy if exists site_content_public_read on site_content;
create policy site_content_public_read
  on site_content for select
  using (true);

-- ---------------------------------------------------------------------------
-- crm_contacts — the SaaS's own leads
-- ---------------------------------------------------------------------------
create table if not exists crm_contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  company_name text,
  -- manual | contact_form | trial | import
  source text not null default 'manual',
  -- new | contacted | trial | customer | lost
  stage text not null default 'new',
  deal_value_cents integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_contacts_stage_idx
  on crm_contacts (stage, updated_at desc);
create index if not exists crm_contacts_email_idx
  on crm_contacts (email);

alter table crm_contacts enable row level security;
-- No permissive policies: platform admins reach this table only through the
-- service-role client in requirePlatformAdmin()-guarded server code.

-- ---------------------------------------------------------------------------
-- crm_activities — timeline entries per contact (notes, calls, emails, …)
-- ---------------------------------------------------------------------------
create table if not exists crm_activities (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references crm_contacts(id) on delete cascade,
  -- note | call | email | meeting | stage_change
  kind text not null default 'note',
  body text not null,
  created_by_email text,
  created_at timestamptz not null default now()
);

create index if not exists crm_activities_contact_idx
  on crm_activities (contact_id, created_at desc);

alter table crm_activities enable row level security;
-- No permissive policies: same guarded service-role access as crm_contacts.
