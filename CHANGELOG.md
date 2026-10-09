# Changelog

All notable changes to TidyPro. Dates are in America/New_York.

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
