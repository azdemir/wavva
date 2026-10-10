# Changelog

All notable changes to TidyPro. Dates are in America/New_York.

## 2026-10-10

### Arcade: 3 cleaning mini-games on the dashboard — PUSHED `26f72f5`/`23debe8`/`dc4f151`/`63b6030`

- New `/dashboard/arcade` route (all roles, all tiers — it's just for fun),
  with a game-picker shell and per-game best scores in localStorage.
- **Dust Bunny Panic** — 30-second whack-a-mole: tap dust bunnies before
  they escape, golden bunnies are jackpot, sock thieves pay extra, do NOT
  wake the cat (-20 + public shaming). Combo multiplier, toddler-crumb and
  client-home-early surprise events, funny end ranks.
- **Sock Match Madness** — memory match with 6 CSS-drawn sock patterns;
  every matched pair reveals its tragic name ("Toddler's Revenge").
- **Stain Scrub Showdown** — press-and-scrub 5 named stains
  ("Unknown Brown (do not ask)") with a sponge cursor before the 45s timer
  ends; win/lose screens with ranks.
- Games are imperative TS modules (`components/arcade/*-game.ts`) mounted
  by thin client wrappers; shared WebAudio bleeps + confetti in
  `components/arcade/fx.ts`; theme-aware via scoped `--ag-*` vars honoring
  the class-based dark mode. Full EN/ES/UK i18n (`messages/*/arcade.json`,
  new `arcade` namespace); sidebar nav entry with new GamepadIcon.
- Verified: tsc + eslint clean, production build green
  (`/dashboard/arcade` in route list), all three games played start-to-finish
  in headless Chromium (DBP scoring+timer, sock full-board solve → Laundry
  Legend, stain full clear → Spotless!/Miracle Worker), zero JS errors.


### Fixed

- **Billing tier display**: the billing page read the raw stored plan from the
  database, so founders on the all-access grant saw "Starter" while every
  other page treated them as Pro. `getBillingState()` now uses the effective
  plan from `requireCompany()` (founder grant / Studio tier override), so the
  displayed tier matches the feature gates.


### Changed

- **Reports page rebuilt (comprehensive)**: the old 3-KPI page is now a full
  reporting suite — date-range presets (7/30/90 days, this month, last month,
  this year, custom); 6 KPI cards (revenue paid, outstanding, jobs completed,
  hours worked, avg invoice, quote win rate); per-employee hours table (jobs,
  hours, share of total; actual clock times when recorded, otherwise the
  scheduled duration); revenue by month/customer/service; jobs by
  status/service with completion rate and avg duration; quotes funnel with
  win rate. New owner-only Excel exports per section
  (`/api/exports/reports/[type]`), honoring the date filter. New
  `lib/reports.ts` data layer and `components/reports/report-filters.tsx`;
  full EN/ES/UK translations.


### Removed

- **Homepage proof band**: removed the headline stats ($10 / 0 / 14 / 30m)
  and the four why-us cards from the landing page —
  `components/marketing/proof-strip.tsx` now renders only the service-area
  marquee. Their Studio CMS entries (`home.proofs`, `home.stats.items`)
  were removed from the content registry as well.


### Fixed (build)

- **QuickBooks invoice wiring**: `app/dashboard/invoices/[id]/page.tsx`
  referenced `getInvoiceSyncStatus` and the `QboSyncBadge` component, which
  hadn't been pushed with the QuickBooks batch — the production build
  failed. Added a guarded `getInvoiceSyncStatus` stub (always reports
  `not_connected` until the OAuth integration lands, so the badge renders
  nothing) alongside the existing `pushInvoice` stub, plus the
  `QboSyncBadge` component itself. The full QuickBooks implementation
  (OAuth client, `0012_quickbooks.sql`, settings UI) is still in flight
  locally and untouched.


### Fixed (regression run 2026-10-10 — 13 bugs found by the testing agent, all fixed)

- **Bookings**: creating or rescheduling a booking in the past is now rejected
  ("The booking start time must be in the future."). The Create button now
  explains when it's disabled because the customer has no address.
- **Customers**: the delete-customer button works again (confirm dialog +
  clear messages) — deletion is blocked with an explanation when the
  customer has active bookings/quotes/jobs/invoices. Creating or editing a
  customer with an already-used email is now blocked with a clear message.
- **Quotes**: quotes now require a total above $0 ("Add at least one line
  item with a price above $0."). The customer portal card now appears on
  quote and invoice detail pages (built 2026-10-09, shipped with this
  batch).
- **Invoices**: paid invoices can now be voided (record kept for audit).
  Manual "Mark paid" now records the payment, so balances read
  "Paid $X / Balance due $0.00" and lists stop showing "due" for paid
  invoices.
- **Import**: the CSV wizard now detects duplicate emails *within* the
  uploaded file (previously only against existing customers) and its step
  counts stay consistent with the final result.
- **Auth**: sign-in now honors the `?next=` deep link after login, with
  open-redirect protection (relative paths only).
- **Communications**: saving a template with an empty email subject now
  shows a validation error instead of silently flagging the template
  "Customized".
- **Team**: re-inviting an email with a pending invite now says
  "An invite is already pending for this email." instead of silently doing
  nothing.
- **Portal**: fixed the "Askyour" typo on the invalid-link page.
- **Validation messages**: raw Zod errors ("Too small: expected string…")
  replaced with human-readable messages in quote/invoice forms.

## 2026-10-09

### Added (unpushed)

- **Integrations (Pro)** — new dashboard page at /dashboard/integrations
  (sidebar entry, owner-only, Pro-gated with upgrade prompt). **Mailchimp**:
  connect with an API key (validated live against Mailchimp Marketing API
  v3; the key's `-<dc>` suffix picks the data center), choose a target
  audience (live member counts), and push customers with "Sync customers
  now" — idempotent upserts via `PUT /lists/{id}/members/{md5}` with
  `status_if_new: "subscribed"` so nobody who unsubscribed is ever
  re-added. Manual one-way push, stated honestly in the UI. **Webhooks
  (Zapier, Make, n8n)**: add up to 10 HTTPS catch-hook URLs with per-event
  subscriptions, pause/resume, test with a sample payload, and
  last-triggered timestamps; numbered setup guide walks through Zapier's
  "Webhooks by Zapier → Catch Hook" flow. Events fire from
  booking.created/cancelled, quote.approved, job.completed, and
  invoice.paid (manual + Stripe webhook) via a never-throwing dispatcher.
  Secrets are AES-256-GCM encrypted (`integration_connections`,
  `integration_webhooks`; migration `0016_integrations.sql`, reuses
  `IMPORT_ENCRYPTION_KEY`). Advertised on the Pro tier ("Mailchimp &
  Zapier integrations"). Setup notice instead of a crash until migration
  0016 is run. Note: `customer.created` is defined in the event catalog
  but not yet wired (its hook lives in the QuickBooks worker's
  in-flight `lib/actions/customers.ts`).

- **Cleaner availability & paid-time-off tracking (all tiers)** — new
  dashboard page at /dashboard/availability (sidebar entry, no tier gate).
  Cleaners set their own weekly availability (per-weekday time windows;
  a day with no windows = unavailable) and request time off (date range +
  reason); owners/managers edit anyone's availability, approve/deny the
  request inbox, log time off directly for a member (auto-approved), and
  see an upcoming-time-off summary. Job detail pages show an amber
  conflict block under the crew card when an assigned cleaner has approved
  PTO covering the job date or the job time falls outside their weekly
  windows. New `cleaner_availability` + `time_off_requests` tables
  (migration `0017_availability_pto.sql`, RLS, service-role access only),
  new `availability` i18n namespace (EN/ES/UK), schema-drift fallback
  until migration 0017 is run.

- **Dashboard navigation revision** — the left sidebar stays as the
  primary dashboard navigation (role/plan gating unchanged), now just the
  logo plus nav links: the old sidebar footer (Website home link, company
  name / email / role, Sign out) was removed since the top bar's profile
  menu already covers all of it. The top bar is slimmed down to user
  controls only — profile menu (company avatar with initials, company
  name, email, role + plan badges, website-home link, sign out), language
  switcher, and light/dark toggle — in a thin 48px bar. The Website home
  link then moved out of the profile dropdown into the top bar itself (and
  the mobile hamburger menu). On mobile the
  sidebar becomes a hamburger menu in the top bar. New `nav.userMenu.*`
  strings in EN/ES/UK.

- **Schedule month view + Week/Month toggle** — the Schedule page now has a
  Month option next to Week (segmented control in the header). The month
  grid shows the full 6-week calendar with the same colorful status pills
  (blue = scheduled, amber = in progress, green = completed) on every visit,
  up to 3 pills per day plus a "+N more" link; day numbers and "+N more"
  jump to that week, each day keeps its "+" quick add-booking button, and
  adjacent-month days render dimmed. Prev/Today/Next step by month in month
  view; the crew filter and view choice travel together in the URL, and
  switching views preserves context (month of the shown week and vice
  versa). Weekday headers follow the dashboard locale. New `schedule.view.*`
  and `schedule.month.more` strings in EN/ES/UK.
- **Bookings list → Calendar button** — a Calendar button in the bookings
  header links to the Schedule calendar (the bookings page itself stays a
  filterable list). New `bookings.list.calendarView` string in EN/ES/UK.

- **Digital checklist templates for appointments** — owners can define
  reusable checklist templates in Settings → Checklist templates (Growth+
  feature; new `checklist_templates` table, migration
  `0015_checklist_templates.sql`). When booking an appointment, staff pick a
  template and every visit the booking generates is seeded with its items,
  ready for the cleaner to check off on the job page. The template link is
  stored on the booking (`bookings.checklist_template_id`, shown on the
  booking detail page); deleting a template never touches already-seeded
  visit checklists. New `checklists` i18n namespace (EN/ES/UK) plus
  booking-form/detail strings in all three locales. Booking creation keeps
  working before migration 0015 is run (schema-drift fallback: the link is
  skipped and visits are seeded directly from the template items).
  Advertised on the Growth tier ("Reusable checklist templates").

### Fixed (unpushed)

- **Start button no longer just disappears** — starting a job now shows
  immediate "Starting…" feedback, then the action row visibly becomes an
  in-progress state (pulsing amber badge: "In progress · started 10:30 AM ·
  25 min") instead of a blank spot, and "Complete job" becomes the primary
  button while the job runs. New `jobs.detail.starting`,
  `jobs.detail.inProgress`, `jobs.detail.inProgressDetail` strings in
  EN/ES/UK.

### Added

- **Cinematic cursor-driven dashboard tour (hero)** — the marketing hero's
  product tour is now a cursor-driven walkthrough: a visible cursor glides
  with film-style easing through a real user narrative (dashboard stats →
  open a job → tick the checklist → peek at before/after photos → approve a
  quote → drop a job into the schedule → send an invoice and watch it get
  paid → meet the crew → end card), with click ripples, hover highlights,
  and sidebar-nav clicks advancing scenes. Cursor targets resolve via
  getBoundingClientRect so clicks always land. Mobile, reduced-motion, and
  no-hover fall back to the timer-driven tour. Preserves the redesign's
  caption bar, overflow-hidden stage, and 40px touch targets.

### Added (unpushed)

- **Schedule week view now matches the advertised colorful calendar** —
  each visit renders as a solid color pill (blue = scheduled, amber = in
  progress, green = completed) showing time + address/customer, like the
  marketing hero. Hover tooltips carry the full details (customer, address,
  status, crew); today's column is highlighted with a ring. The per-day "+"
  add-booking button, crew filter, and week navigation are unchanged. New
  `schedule.unknownCustomer` string in EN/ES/UK.

- **Company logo** — onboarding (step 1) and Settings → company profile now
  ask for an optional logo (PNG/JPG/WebP, ≤500 KB, stored in a public
  Supabase Storage `company-logos` bucket — no S3 keys needed). It appears
  on quote/invoice print documents and in the customer portal header; when
  no logo is set, print documents show the TidyPro logo and the portal keeps
  the TidyPro mark. New `lib/company-logo.ts` upload helper and migration
  `0014_company_logos.sql` (run it on Supabase); `companies.logo_url`
  column already existed.

### Fixed (unpushed)

- **Import page badges unified** — ZenMaid, BookingKoala, and Generic CSV
  cards now show the same "CSV" badge as Jobber and Housecall Pro (was
  "CSV upload" on those three).

- **Customer portal card on quote and invoice detail pages** — both pages
  now have the same "Customer portal" card as the customer profile ("Share
  a private link so this customer can approve quotes, see upcoming visits,
  and pay invoices — no login needed." + Get portal link / copy / email /
  text / revoke), reusing `PortalLinkButton`. New
  `quotes.detail.portalTitle/portalDescription` and
  `invoices.detail.portalTitle/portalDescription` strings in EN/ES/UK.

- **Services page no longer blocks instant navigation** — the two uncached
  Supabase reads (`services` + `addons`) moved out of the page body into a
  `ServicesCatalog` server component behind a `<Suspense>` boundary, so the
  page shell (heading + skeleton cards) commits immediately while the
  catalog streams in. Data stays fresh on every visit (no caching added);
  the managers' `revalidatePath` behavior is unchanged. New
  `services.loading.catalog` string in EN/ES/UK.

### Changed (unpushed)

- **Automated communications are now a Pro-tier feature** — the Settings →
  Communications template editor is plan-gated (owners on Basic/Starter/
  Growth see an upgrade prompt instead), "Automated SMS & email templates"
  is advertised in the Pro plan feature list, and the /pricing comparison
  table gained an "Automated SMS & email templates" row (Pro only). Note:
  the automatic trigger engine still sends for all plans — enforcing the
  gate in the send pipeline is a follow-up if wanted.

### Added

- **Calendar management from the week view** — each day column on the
  Schedule page now has an "Add booking" (+) button (staff only) that opens
  the new-booking form with that date pre-filled.
- **Import Data** (`/dashboard/import`, owner/manager) — migrate customers
  and scheduling data from other platforms:
  - 5-step CSV importer (upload → field mapping → preview → duplicate
    detection → commit) with per-platform column presets for Jobber,
    ZenMaid, Booking Koala, and Housecall Pro. ZenMaid and Booking Koala
    are labeled "CSV upload" only — they have no public API.
  - API imports reusing the same preview → dedupe → commit pipeline:
    Jobber (OAuth2, GraphQL), Housecall Pro (pasted API key, MAX plan
    required), Google Calendar (OAuth2, appointments only). Credentials
    are AES-256-GCM encrypted per company; nothing is presented as
    supported until built. Requires new env vars (`IMPORT_ENCRYPTION_KEY`,
    `JOBBER_CLIENT_ID/SECRET`, `GOOGLE_CLIENT_ID/SECRET`) and migration
    `0013_import_connections.sql`.
- **Automated SMS + email communications** — a data-driven template system
  (`lib/communications/templates.ts`) with 14 templates: 10 for customers
  (quote sent/follow-up/approved, booking confirmed, day-before booking
  reminder, job completed + review ask, invoice sent, overdue payment
  reminder, payment received, portal invite) and 4 for cleaners (job
  assigned, day-before job reminder, job cancelled, job updated), each with
  email + SMS copy and a documented `{{variable}}` registry (name,
  description, value source, preview sample). A substitution engine
  HTML-escapes values in email and leaves SMS plain text.
- **Settings → Communications editor** (owner-only) — templates grouped by
  audience (Customers / Cleaners); edit email subject/body and SMS text per
  template with clickable `{{variable}}` chips, per-channel enable/disable
  toggles, and a live preview with sample values. Overrides are stored per
  company in the new `communication_templates` table (migration
  `0011_communication_templates.sql`, tenant-isolated RLS); defaults stay in
  code so future default improvements propagate. Disabled templates mark
  their queued rows `skipped` (new notification status) instead of failing.
- **SMS via Twilio** (`lib/notifications/sms.ts`, plain fetch, no SDK) —
  `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` (see
  `.env.example`; `TWILIO_PHONE_NUMBER` still accepted as an alias). The
  notification queue now drains both email and SMS; SMS rows stay queued
  (counted as skipped) until Twilio is configured, so the backlog sends once
  keys are added. Customer SMS only goes to customers with the SMS-reminders
  consent checkbox on their profile.
- **New automatic triggers** — booking created → booking_confirmed; booking
  rescheduled → job_updated (customer + assigned cleaners); booking or job
  cancelled → job_cancelled (assigned cleaners); job assigned →
  job_assigned; job completed → job_completed + review ask; quote approved →
  quote_approved (dashboard and customer-portal paths); invoice sent →
  invoice_sent; manual payment recorded and Stripe online payments →
  payment_received. The daily `/api/cron/notifications` run now also sends
  day-before **job_reminder** emails to assigned cleaners and **payment
  reminders** (one per channel per day) for overdue invoices, auto-flipping
  `sent` → `overdue` with an audit entry. Quote follow-ups (migration 0005)
  keep working and now render through the template system.
- **"Dashboard in Spanish and Ukrainian"** — the entire dashboard (all 27
  pages), onboarding, sidebar nav, status pills, pagination, upgrade prompts,
  and user-facing action messages are now available in English (default),
  Español, and Українська via a language switcher in the dashboard header.
  Built on next-intl with a cookie-based locale preference
  (`tidypro-locale`) — no URL changes, so all links and tests keep working.
  Messages live in `messages/<locale>/<namespace>.json` (17 namespaces,
  744 strings × 3 locales) merged by `i18n/request.ts`, which falls back to
  English for any missing key. The marketing site stays static English.
  Not yet translated (follow-ups): zod validation messages, auth pages,
  email templates, date/number formatting.

### Fixed

- **Customers work even when the database is behind on migrations** — if
  `customer_type` is missing from the schema cache (migration 0008 not run),
  creating/editing customers, the customer list, and the Excel export now
  retry without the new column instead of failing. The customers page shows
  an amber setup notice naming the exact migration file to run in Supabase.
  New helper `lib/supabase/schema-fallback.ts` detects PostgREST PGRST204
  "column not in schema cache" errors.

### Changed

- **New Basic $10/mo tier; Starter moves to $15/mo** — four plans now: Basic
  $10 (1 user, 50 customers), Starter $15 (3 users, 100 customers), Growth $35,
  Pro $45. Both entry tiers include scheduling, quotes & bookings, invoicing
  with online payments, and the customer portal. Added migration
  `0010_basic_plan.sql` (widens the `companies.plan` check constraint),
  `STRIPE_PRICE_BASIC` env var, and `isPlanId()` in the Stripe webhook so new
  tiers never need hardcoded plan lists again. Pricing page now shows four
  cards plus a four-column comparison table.

- **Pricing realigned to match ZenMaid** — plans are now Starter **$19/mo**,
  Growth **$39/mo**, Pro **$49/mo** (tier names unchanged). Feature lists
  restructured to mirror the competitor's shape while staying honest to what
  TidyPro ships: Starter (1 user, 50 customers, scheduling, quotes, invoicing,
  portal), Growth (5 users, unlimited customers, automated quote follow-up,
  recurring bookings, crew checklists), Pro (unlimited users, reports,
  before/after photos, priority support). Seat limits and feature gates
  unchanged. NOTE: `lib/plans.ts` prices are informational — the actual charge
  comes from `STRIPE_PRICE_STARTER/GROWTH/PRO`, which must be recreated in the
  Stripe dashboard at the new amounts.

## 2026-10-08

### Added

- **Dashboard filters on every list page** — new shared `components/ui/filters.tsx`
  (`FilterPills` + `FilterSearch`; search preserves status pills and vice versa).
  - Customers: name/email/phone search + All/Residential/Commercial type pills.
  - Bookings: status pills + booking number/customer search (applies to both
    upcoming and past lists).
  - Quotes & Invoices: quote/invoice number + customer search.
  - Jobs: status pills + customer search.
  - Team: role pills. Schedule: crew-member dropdown (preserved across week
    navigation). Services & Add-ons: client-side search in the catalog managers.
- **Excel exports** — new `app/api/exports/[type]/route.ts` (via `exceljs`)
  produces styled `.xlsx` downloads for customers, invoices, and bookings:
  frozen header row, autofilter, money/date cell formats, 5,000-row cap, and a
  20-exports/hour rate limit. Exports honor the active page filters. "Export
  Excel" buttons added to the three list pages.
- **Customer type: Residential vs Commercial** — new migration
  `0008_customer_type.sql` adds `customers.customer_type`
  (`residential`/`commercial`, default `residential`) with an index. The
  new/edit customer form now asks for the type first via a selector card, and
  the name label adapts ("Full name" vs "Business name"). The customer list
  shows a type badge per row with filter pills, and the Excel export includes a
  Type column honoring the active filter.
- **Automatic name capitalization** — new `normalizePersonName()` in
  `lib/validation.ts` title-cases customer names on save ("JOHN o-brien" →
  "John O-Brien"; handles spaces, hyphens, straight and curly apostrophes).
  Wired into `customerSchema`, so both create and update normalize.
- **Print invoices & quotes** — new `/print` routes under each invoice and
  quote detail page render a clean, professional document (company header,
  bill-to block, line items, totals, notes) with a "Print / Save as PDF"
  button (`window.print()`). Shared `components/documents/print-document.tsx`
  uses explicit light colors so output looks right in any theme; `@media print`
  CSS in `globals.css` hides the dashboard chrome (sidebar, mobile header,
  on-screen controls) and sets 12mm page margins. Print buttons added next to
  the status pill on both detail pages.
- **Role-based access control** — new `lib/permissions.ts`
  (`can()` / `isStaff()` / `requirePermission()`):
  - **Owner**: sees and does everything.
  - **Manager**: everything operational (dashboard, customers, services,
    quotes, bookings, jobs, schedule, invoices, My jobs) except team
    management, settings, billing, audit log, and reports.
  - **Cleaner**: My jobs only, plus start/complete/checklist actions on
    assigned jobs — the least needed to get the job done.
  - The dashboard nav filters items per role; 19 dashboard pages redirect
    unauthorized roles (cleaners → My jobs, others → Dashboard); all
    customer/quote/booking/invoice/service/portal server actions are
    staff-only; the exports API returns 403 for cleaners; job
    cancel/assign/notes are staff-only and the Cancel job button is hidden
    from cleaners. (Resolves the coarse-roles limitation previously flagged
    in SECURITY.md.)
- **Job photos (groundwork)** — migration `0007_job_photos.sql` creates the
  `job_photos` table (job/company, before/after kind, storage key, RLS) and
  `lib/storage.ts` adds S3-compatible presigned upload/view/delete helpers.
  "Before/after photo uploads" is listed as a Pro plan feature. The capture UI
  and server actions are not built yet.
- **Hero rewrite** — the landing hero now leads with a static "Run your
  cleaning business" line and a cycling accent-colored dynamic line ("from one
  tidy place." / "without missed calls." / "that follows up for you."),
  respecting `prefers-reduced-motion`; removed the dead space the old
  placeholder headline reserved.
- **TidyPro Studio (founder HQ)** — new `/studio` area for the founder and
  developer, gated by the existing `PLATFORM_ADMIN_EMAILS` allowlist.
  - **No-code website editor** (`/studio/website`): a low-code CMS backed by a
    new `site_content` table (migration `0009_studio.sql`). A content registry
    (`lib/studio/registry.ts`) defines every editable marketing field with its
    control type, default, and affected routes — adding a registry entry
    automatically generates its editor field, so no editor UI code is needed
    for new fields. Covers global brand fields plus the home hero, rotating
    headlines, proof cards, features, workflow steps, pricing headings,
    testimonials, FAQ, CTA, and the features/pricing/FAQ/contact/demo page
    sections. Saving validates against the registry and purges the CMS cache
    tag + revalidates affected routes, so edits go live without a redeploy;
    Reset restores the code default. All marketing pages keep code fallbacks
    and render even when Supabase is unreachable.
  - **Founder CRM** (`/studio/crm`): lead pipeline with stages (New,
    Contacted, On trial, Customer, Lost), kanban board, manual lead entry,
    lead detail with stage movement/deal value/notes, activity timeline
    (notes, calls, emails, meetings, automatic stage-change entries), and an
    overview dashboard (companies, users, MRR estimate, pipeline value, latest
    leads). New `crm_contacts` + `crm_activities` tables (same migration).
  - **Trial + contact lead capture**: `/demo` is now a working trial-request
    form (validated, rate-limited); submissions become CRM leads
    (`source=trial`, duplicate emails update the existing lead). Contact-form
    submissions are also recorded as CRM leads. Owner notification via Resend
    is best-effort.
  - Studio routes redirect anonymous visitors to the homepage (covered by new
    Playwright tests).

### Changed

- **Dashboard plans now match the landing page** — `lib/plans.ts` previously
  drifted from the marketing site. It now mirrors the landing page exactly:
  Starter $49/mo (1 user, up to 50 active customers), Growth $99/mo (up to 5
  users), Pro $199/mo (unlimited users), with the same blurbs and feature
  lists. `lib/site.ts` now derives its marketing plans from `lib/plans.ts` so
  the two can never drift apart again. Note: seat-limit enforcement follows the
  advertised numbers (1 / 5 / unlimited; previously 3 / 10 / unlimited).
- **Job detail layout** — restructured action card: Start Job and Cancel Job
  in the top row, completion notes + Complete Job in a separate vertical
  section (full-width button on mobile); no more duplicated time ranges like
  "5:50 PM – 5:50 PM".
- **Portal buttons & email sender** (earlier today) — the four customer-portal
  buttons (Copy link / Send via email / Send via text / Revoke links) use an
  equal-width grid (2 columns on mobile, 4 on desktop). Portal-link and
  quote-follow-up emails now send *from* the business email in Settings
  (falling back to `EMAIL_FROM`); the domain must be verified in Resend.

### Fixed

- **New booking "Create" button stuck on "Creating..."** — any throw inside the
  server action left the form's pending state on forever with no error shown.
  The form now validates end > start instantly client-side, and a
  try/finally guarantees the button resets while surfacing failures as an
  error banner (successful creates still redirect via `redirect()`).
- **Job photo 1-week retention** — photos are now kept for 7 days, then
  automatically deleted. New `PHOTO_RETENTION_DAYS` constant in
  `lib/storage.ts`; new `/api/cron/photo-cleanup` endpoint (protected by the
  `CRON_SECRET` bearer token) deletes expired photos' storage objects and
  database rows, 500 per run. The Before/after photos card tells the team:
  "Photos are kept for 7 days, then automatically deleted." Photos also shrink
  on-device before upload (max 1600px, JPEG ~82%), and they upload straight
  from the phone to object storage — never touching the git repo.

### Operations notes

- **Run these migrations** on the Supabase project (in order):
  `0007_job_photos.sql`, `0008_customer_type.sql`.
- **Schedule the photo cleanup cron** daily: hit
  `GET /api/cron/photo-cleanup` with `Authorization: Bearer <CRON_SECRET>`
  (Vercel Cron or any external scheduler). Until scheduled, expired photos
  are not deleted.
- `package-lock.json` is intentionally not committed (too large for the push
  tooling); run `npm install` after cloning to regenerate it.
- Vercel auto-deploys from `main`.
