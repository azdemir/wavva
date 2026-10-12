# TidyPro — MVP Readiness Checklist

**As of 2026-10-10.** "MVP complete" = a real cleaning business can sign up,
onboard, add customers, quote → book → schedule → complete a job → invoice →
get paid online, with automated reminders firing and the owner seeing reports.
Everything below is what's still missing or undecided to get there.

**Regression #2 is running now** — the bug list below was audited in code on
2026-10-11 and is now closed out (section 2).

---

## 1. Infrastructure & setup — USER ACTION REQUIRED (nothing works without these)

These are all on the founder (you), not buildable by the agent:

- [ ] **Supabase project + keys** — create project, set `NEXT_PUBLIC_SUPABASE_URL`,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] **Run migrations 0001–0018** on Supabase (files in `supabase/migrations/`).
      Notes: 0012 (QuickBooks) only needed if you want the QB sync; 0011 was
      renumbered cleanly, no collision anymore. Live showed no setup notices
      for 0013–0017, so they *appear* applied — verify in the Supabase dashboard.
- [ ] **Two composite indexes from 0006** never applied (migration failed
      partway): `idx_invoices_company_created`, `idx_customers_company_name`.
      Run them manually.
- [ ] **Stripe keys + webhook secret**, and create `STRIPE_PRICE_*` prices for
      all four plans (Basic $10 / Starter $15 / Growth $35 / Pro $45). The
      dashboard prices are informational — real charges come from these env vars.
- [ ] **Resend key** — quote/invoice/portal emails don't send without it
- [ ] **Twilio keys** (`TWILIO_ACCOUNT_SID/AUTH_TOKEN/FROM_NUMBER`) — SMS
      reminders currently queue silently until these are set
- [ ] **`IMPORT_ENCRYPTION_KEY`** — required for Jobber/Housecall Pro/Google
      Calendar import credentials
- [ ] **`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`** — address autocomplete in forms
- [ ] **`PLATFORM_ADMIN_EMAILS`** — enables TidyPro Studio access
- [ ] **Schedule the photo-cleanup cron daily** (`/api/cron/photo-cleanup`;
      job photos have 7-day retention)
- [ ] **Google OAuth verification paperwork** (homepage, privacy policy, domain
      confirmation) — only needed for the Google Calendar import

## 2. Known bugs — all resolved (audited 2026-10-11)

Re-verified bug-by-bug in code on 2026-10-11. Seven of the eight were already
fixed by regression run #1's batch; the table below records where each fix
actually lives, so the next run doesn't re-investigate them.

| # | Bug | Severity | Status | Fix |
|---|-----|----------|--------|-----|
| 1 | Past-dated bookings accepted | major | done | `lib/actions/bookings.ts:56` (create), `:228` (reschedule) |
| 2 | Delete-customer button does nothing | major | done | `app/dashboard/customers/[id]/page.tsx:196` — confirm dialog + per-table count explaining why a customer with history can't be deleted |
| 3 | Paid invoices can't be deleted/voided | major | done | `lib/actions/invoices.ts:119` — `paid → ["void"]`; void keeps the record for audit |
| 4 | CSV import misses within-file duplicate emails | major | done | `lib/actions/import.ts:170` `findWithinFileDuplicateEmails` |
| 4b | UI customer form allows silent duplicate emails | major | **fixed 2026-10-11** | `lib/actions/customers.ts` — new `checkDuplicateEmail` guard on create + update. `customers` has NO unique constraint on `(company_id, email)` (the one in `0001_init.sql:50` is on `invites`), so the form silently created dupes. |
| 5 | `?next=` deep-link ignored after sign-in | major | done | `lib/actions/auth.ts:57` `safeNextPath` — honors the deep link, rejects protocol-relative/backslash redirects |
| 6 | $0 quotes accepted | minor | done | `lib/validation.ts:109` — requires ≥1 line item priced above $0 |
| 7 | Wrong balances shown on paid invoices | minor | done | `lib/actions/invoices.ts:313` `markInvoicePaid` records the payment, so "Balance due $0.00" stays truthful |
| 8 | Template with empty subject silently flagged "Customized" | minor | done | `lib/actions/communications.ts:85` — rejects empty email subject on save |

Blocked (not bugs, need setup): Schedule/crew/checklists/photos + integrations
are plan-gated on the live Starter test account; cross-role and non-admin
Studio tests need a second login.

## 3. Unshipped / undecided product work

- [ ] **QuickBooks full integration** — spec exists; blocked on you creating
      the Intuit Developer app (Client ID/Secret) + running migration 0012 +
      answering 4 founder questions in the spec (Pro-only vs Growth; void
      direction; sales tax; one platform app). Remote currently has inert stubs
      only.
- [ ] **Comms → Pro decision** — template editor is Pro-gated locally, but
      automatic sends still run on all plans. Decide: gate sending too, or push
      as-is? (awaiting your call; needs your push approval)
- [ ] **Founder all-access grant** (local commit `3428adb`) — unpushed. Gives
      azizdemir6@gmail.com + platform admins every tier's features.
- [ ] **Local cleanup commit** (`d2f5e59`) — unpushed, low priority
- [ ] **Binary assets need a real git push** (push tools corrupt them):
      `docs/tidypro-seo-audit.pdf`, `public/og-image.jpg`, 512px favicon,
      180px apple touch icon, `og-image.png`. OG tags reference `/og-image.jpg`
      which 404s until then. Needs a credentialed machine, not doable from here.
- [ ] **Cleaner SMS dormant** — memberships have no phone numbers yet, so
      cleaner SMS templates can't fire even with Twilio configured

## 4. Go-to-market

- [ ] **Pilot call list** — 12 researched Upstate NY companies with script,
      agreement, checklist, feedback form (`~/workspace/cleaning-saas/pilot/`).
      Held until your Supabase setup is confirmed working; then start calling.
- [ ] **Pricing/Stripe alignment** — recreate Stripe prices if you ever change
      plan prices in `lib/plans.ts` (you were told; repeating because it bites)

## 5. Already done (MVP core is built)

Auth + onboarding · dashboard · customers · quotes → bookings · schedule
(week/month, quick-add, conflict warnings) · job lifecycle + crew assignment ·
checklists (templates + AI studio) · invoices (editable numbers, print/PDF) ·
customer portal · automated comms (14 templates) · Mailchimp + webhooks ·
availability/PTO · CSV/API import · reports suite · TidyPro Studio (CMS/CRM/
analytics/tiers) · marketing site (features, compare, pricing, FAQ) ·
ES/UK translations · dark mode · mobile-friendly.

---

### Suggested order
1. You: Supabase + migrations + Stripe + Resend (unblocks everything)
2. Me: fix whatever regression #2 still flags
3. You: Twilio + cron + pilot calls
4. Decide: QuickBooks scope, comms gating, founder grant push
