# TidyPro — Operations software for cleaning businesses

Multi-tenant SaaS platform for residential and commercial cleaning businesses
(scheduling, quotes & bookings, team management, invoicing, customer portal).
"TidyPro" is a working title — rename it in `lib/site.ts`.

Built with Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + React 19.

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build check
npm run lint     # eslint
```

No environment variables are needed for the current stage. When later stages
need secrets, copy `.env.example` to `.env.local` and fill in test-mode keys.

## What's implemented (Stage 1 — foundation + marketing home page)

- Next.js App Router project with TypeScript, Tailwind v4, ESLint
- Design system: brand blue / accent green / white palette in `app/globals.css`
  (`@theme` tokens), Geist font, reduced-motion support
- UI primitives in `components/ui/`: `Button`, `Card`, `Field` (accessible
  labeled input with hint/error states), `Badge` + `JobStatusPill`
  (scheduled / in progress / completed / canceled), `EmptyState`, `Container`,
  `SectionHeading`, and an SVG `icons` set
- Marketing home page (`app/page.tsx`): navbar (with no-JS mobile menu),
  hero with an illustrative product preview (labeled sample data), features,
  how-it-works, pricing teaser (Starter $49 / Growth $99 / Pro $199 —
  suggested pricing), FAQ, CTA band, footer
- `/demo` — trial request page. **UI preview only**: the form is disabled and
  labeled as not collecting submissions yet
- `/signin`, `/signup` — real email/password auth backed by Supabase Auth
  (requires Supabase env vars; see `.env.example`)
- `/onboarding` — 4-step company setup wizard (profile → services →
  service area → team invites), shown to signed-in users without a company
- `/dashboard` — authenticated workspace: dashboard home (today's jobs, open
  quotes, outstanding, customers), customers, services & pricing, quotes,
  bookings, team, settings

## Stage 3 — auth, database, onboarding (done)

- `supabase/migrations/0001_init.sql` — full PostgreSQL schema (companies,
  memberships, invites, customers, addresses, services, add-ons, service
  areas, quotes, bookings, jobs, invoices, payments, notifications, audit
  logs) with **Row-Level Security on every table**: tenant isolation is
  enforced in the database via `company_id`, not in application code
- Supabase Auth (email/password) with `@supabase/ssr`; `proxy.ts` refreshes
  the session; all server data access uses the user's JWT so RLS applies
- Team invites via shareable token links (`/invite/[token]`); acceptance
  uses the service-role key server-side only (invitees aren't members yet,
  so RLS can't authorize them)
- Append-only `audit_logs` for key actions (company created, quotes,
  bookings, invites, settings changes)

## Stage 4 — customers, services, quotes, bookings (done)

- Customers: CRUD + search, multiple service addresses per customer,
  per-customer booking/quote history; delete is blocked while active
  bookings exist
- Services & pricing: service catalog (residential/commercial, per
  visit/hour/sq ft) and add-ons with activate/deactivate; delete is blocked
  when referenced by quotes or bookings; recurring-visit multipliers and
  default tax rate in Settings
- Quotes: builder with service/add-on/custom line items, discount, tax, live
  totals, validity date; status flow draft → sent → approved/declined/expired
  (enforced transitions); quote numbers per company (Q-0001…)
- Bookings: one-time or recurring (weekly/biweekly/monthly) with automatic
  job-visit generation (8/8/6 visits); create-from-quote prefill; reschedule
  shifts future visits; cancel cancels future visits

## What's explicitly placeholder / mockup (not real)

- Testimonial cards are **clearly labeled placeholders** — no reviews invented
- Hero dashboard preview is an illustration with fictional sample data
- Pricing is suggested, flagged "final plans confirmed at launch"
- `/demo` form is a non-functional UI placeholder
- No payments, no email/SMS notifications exist yet — nothing here is
  production-ready
- The app requires Supabase credentials to run; without them, only the
  marketing pages work

## Project structure

```
app/
  page.tsx            # marketing home
  demo/page.tsx       # trial request (UI preview)
  signin/page.tsx     # placeholder until Stage 3
  layout.tsx          # root layout + metadata
  globals.css         # Tailwind v4 theme + design tokens
components/
  ui/                 # design-system primitives
  marketing/          # home page sections
lib/
  site.ts             # site config, plans, FAQs (rename brand here)
```

## Build stages ahead

- **Stage 2:** ✅ done — full marketing pages: `/features`, `/pricing` (plan comparison + billing FAQ), `/faq` (grouped Q&A), `/contact`
- **Stage 3:** ✅ done — Supabase Auth, PostgreSQL schema with RLS tenant isolation, onboarding wizard, dashboard shell, team invites, settings
- **Stage 4:** ✅ done — customers, services/pricing config, quotes → bookings with job generation
- **Stage 5:** scheduling, assignments, job lifecycle, cleaner mobile views
- **Stage 6:** invoicing, Stripe Connect, customer portal
- **Stage 7:** email notifications, platform admin, audit logs, security review
- **Stage 8:** pilot with 2–3 Upstate NY cleaning companies
