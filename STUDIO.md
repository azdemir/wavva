# TidyPro Studio

**Founder HQ** — the low-code / no-code control room for the TidyPro marketing
site and the founder's sales pipeline. Two tools in one place:

| Tool | Route | What it does |
| ---- | ----- | ------------ |
| Website editor | `/studio/website` | Edit every word on the marketing site — no code, no redeploy |
| CRM | `/studio/crm` | Track leads from first touch to paying customer |
| Analytics | `/studio/analytics` | Growth, MRR, plan mix, and pipeline analytics |

Both live under `/studio`, which also shows an overview dashboard (companies,
users, MRR estimate, pipeline value, latest leads).

## Access

Studio is for the founder and developer only. Access is granted by email
allowlist:

```bash
# .env / Vercel environment variables
PLATFORM_ADMIN_EMAILS="you@company.com,dev@company.com"
```

Anyone not on the list is redirected to the homepage — including from direct
links. The same allowlist already guards `/admin`.

## Website editor (`/studio/website`)

### Using it

1. Go to `/studio/website`.
2. Pick a page tab: **Global**, **Home**, **Features**, **Pricing**, **FAQ**,
   **Contact**, **Trial page**.
3. Edit any field — text, long text, toggles, numbers, dropdowns, lists, and
   repeatable cards (e.g. testimonials, FAQ items, pricing proof cards).
4. **Save** — the change is live on the site immediately. No build, no deploy.
5. **Reset** — removes your override and restores the original coded default.

Fields you've customized are badged so you can tell at a glance what differs
from the defaults.

### How it works (the low-code layer)

Every editable piece of site copy is described **once** in
`lib/studio/registry.ts`:

- `default` — what the site renders when nothing is saved (the site always
  works, even with no database).
- `field` — the control type (`text`, `textarea`, `lines`, `toggle`,
  `number`, `select`, `string-list`, `list`). The editor builds its form
  fields automatically from this — **adding a registry entry creates a new
  editor field with zero editor UI code**.
- `paths` — which routes to refresh when the value changes.

Saved values live in the `site_content` table (`key` → `value` JSONB).
Marketing components read them with `await getContent("home.hero.title")`
from `@/lib/studio/content`, which merges overrides over the registry
defaults and never throws.

Publishing is instant: the save action purges the `site-content` cache tag and
revalidates the affected routes (`updateTag` + `revalidatePath`).

### Adding a new editable field (developer)

1. Add a definition to `CONTENT_REGISTRY` in `lib/studio/registry.ts`
   (pick the page tab, key, label, field kind, default, and `paths`).
2. In the component, replace the hardcoded copy with
   `await getContent<typeof defaultValue>("your.key")`.
3. Done — the editor field appears automatically under the right tab.

> Plan names, prices, and plan features are **not** in the CMS on purpose.
> They come from `lib/plans.ts`, the same source the dashboard billing page
> enforces — so the website and the product can never drift apart.

## CRM (`/studio/crm`)
### Pipeline stages

`New → Contacted → On trial → Customer` (or `Lost`).

### Using it

- **Board** — kanban view of every lead by stage, with deal values.
- **New lead** (`/studio/crm/new`) — add a lead manually: name, company,
  email, phone, source, deal value, notes.
- **Lead detail** (`/studio/crm/[id]`) — move the stage, edit details, log
  activities (note, call, email, meeting). Stage changes are recorded in the
  timeline automatically. Leads can be deleted.
- **Overview** (`/studio`) — companies, users, MRR estimate, open pipeline
  value, newest companies, latest leads.

### Where leads come from

| Source | How |
| ------ | --- |
| `trial` | Someone submits the **Start free trial** form (`/demo`). Duplicate emails update the existing lead instead of creating a second one. |
| `contact` | Someone submits the **contact** form (`/contact`). |
| `manual` | You add them in `/studio/crm/new`. |

You can set any `source` string when creating leads manually (e.g. `referral`,
`cold-call`).

## Analytics (`/studio/analytics`)

The founder's growth and revenue view for the SaaS itself:

- **KPI cards** — MRR (with paying/trialing split), companies + users,
  lead→customer conversion rate, open pipeline value.
- **Signups chart** — companies vs leads per week for the last 12 weeks.
- **Plan mix donut** — Starter/Growth/Pro breakdown with MRR per plan.
- **Lead funnel** — counts per pipeline stage with stage-to-stage conversion
  rates.
- **Lead sources** — where leads come from, ranked.
- **Newest companies** — latest signups with plan and subscription status.

Data comes from `getAnalytics()` in `lib/studio/analytics.ts` (service-role
client, admin-gated). Charts are hand-rolled SVG in
`components/studio/charts.tsx` — no chart library needed.

## Database

Migration `supabase/migrations/0009_studio.sql` (idempotent — safe to re-run):

- **`site_content`** (`key` text PK, `value` jsonb, `updated_at`) — website
  overrides. Public read-only policy so the marketing site can fetch them
  with the anon key; writes go through the service-role client inside
  admin-gated server actions only.
- **`crm_contacts`** — leads: name, company, email, phone, stage, value,
  source, notes, timestamps.
- **`crm_activities`** — timeline entries per lead (type, body, timestamp);
  stage changes are logged automatically.

CRM tables have RLS enabled with no public policies — all access runs through
the service-role client after `requirePlatformAdmin()`.

## Setup checklist

For Studio to work on a deployment:

1. Run `supabase/migrations/0009_studio.sql` in the Supabase SQL editor
   (after migrations 0001–0008).
2. Set `PLATFORM_ADMIN_EMAILS` to the founder/developer login email(s).
3. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set (server-only; already used by
   other admin features).
4. For trial/contact owner notifications: `RESEND_API_KEY`, `CONTACT_EMAIL`,
   `EMAIL_FROM`. Notifications are best-effort — lead capture never fails
   because email failed.

Without Supabase configured, the marketing site still renders every page
from the registry defaults; Studio routes redirect to the homepage.

## File map

```
app/studio/
  layout.tsx            Platform-admin gate for all of /studio
  page.tsx              HQ overview dashboard
  analytics/page.tsx    Growth, MRR, funnel + plan-mix analytics
  website/page.tsx      No-code website editor
  crm/page.tsx          Pipeline board
  crm/new/page.tsx      Manual lead entry
  crm/[id]/page.tsx     Lead detail + activity timeline
components/studio/
  website-editor.tsx    Auto-generated editor UI (driven by the registry)
lib/studio/
  registry.ts           Content definitions, defaults, validation  ← edit here
  content.ts            getContent() — cached merge of overrides + defaults
  actions.ts            saveSiteContent / resetSiteContent (admin-gated)
  crm.ts                CRM stages, types, client-safe helpers
  crm-server.ts         CRM database queries (admin-gated)
  lib/admin.ts          requirePlatformAdmin() + PLATFORM_ADMIN_EMAILS
components/marketing/
  trial-form.tsx        /demo form → creates CRM lead (source=trial)
supabase/migrations/
  0009_studio.sql       site_content + crm_contacts + crm_activities
```
