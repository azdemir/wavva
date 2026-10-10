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
- Signed-in browser sessions sign out after 15 minutes of inactivity.
  Pointer, keyboard, touch, and scroll activity reset the timer across tabs.
  The timer also checks on focus and wake-up, and persists across reloads.
  This is a browser-side timeout, not a server-enforced token expiry.
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
- **Stage 5:** ✅ done — week schedule view, job detail with lifecycle (start/complete/cancel), interactive checklists, crew assignment, cleaner mobile "My jobs" view
- **Stage 6:** ✅ done — invoices (builder, statuses, offline payments), Stripe Connect onboarding + webhook + Checkout, customer portal (`/p/[token]`: quotes approval, invoice payment)
- **Stage 7:** ✅ done — email notification queue (Resend) + cron endpoint with booking reminders, platform admin (`/admin`), audit log viewer, `SECURITY.md` review
- **Stage 8:** pilot prep kit ready in `pilot/` (checklist, outreach script, agreement template, feedback form, success metrics) — recruiting the 2–3 companies is a human task

## Running the app (stages 3+)

1. Create a Supabase project and run `supabase/migrations/0001_init.sql`,
   `0002_job_lifecycle.sql`, `0003_billing_portal.sql` in order.
2. Copy `.env.example` to `.env.local` and fill in the Supabase keys.
   For local dev, disable "Confirm email" in Supabase Auth settings.
3. `npm install && npm run dev` → sign up, complete onboarding, explore.
4. Optional: `RESEND_API_KEY` + daily cron on `/api/cron/notifications`;
   `STRIPE_SECRET_KEY` + webhook for online payments; `PLATFORM_ADMIN_EMAILS`
   for `/admin`.

## Honest limitations (pre-pilot)

- **Roles are coarse:** every member currently has full access to company
  data. Tighten RLS per `SECURITY.md` P0 before charging anyone.
- **Stripe/Resend are key-gated:** without keys, payments and emails queue
  but don't send — the UI says so explicitly.
- **No platform subscription billing yet:** charging cleaning companies for
  TidyPro itself is post-pilot work.
- **Job photos** need object storage (schema-ready, UI notes it).
