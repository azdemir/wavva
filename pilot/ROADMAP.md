# TidyPro — Roadmap to MVP Launch

**Goal:** 2–3 pilot cleaning companies running their real business on TidyPro and paying for it.
**Status as of 2026-10-08:** product built (stages 1–8, tiered billing, automated quote follow-up, marketing site). What remains is wiring, hardening, deploying, and piloting.

---

## Phase 0 — Make it run (blocking everything else)

- [ ] Run migrations `0004_platform_billing.sql` and `0005_quote_followups.sql` in Supabase SQL editor (`0001`–`0003` already run)
- [ ] Create `.env.local` from `.env.example`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` at minimum
- [ ] `npm install && npm run dev` → open http://localhost:3000
- [ ] Smoke test the happy path locally: sign up → onboarding → add customer → create quote → send → approve → booking/job → checklist → invoice
- [ ] Confirm the quote follow-up badges appear on the quote detail page after sending

**Done when:** a full quote-to-cash cycle works on your PC with your Supabase project.

## Phase 1 — Money and messages (this week)

- [ ] Stripe: create 3 recurring Prices (Starter $49 / Growth $99 / Pro $199), put IDs in `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_GROWTH`, `STRIPE_PRICE_PRO`
- [ ] Set `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`; register webhook for Checkout + subscription lifecycle events
- [ ] Test: start trial via Settings → Billing with a Stripe test card, confirm seat limits + billing portal
- [ ] Resend: `RESEND_API_KEY` + `EMAIL_FROM`; verify your sending domain; trigger one quote email and confirm delivery
- [ ] Set `CRON_SECRET` and schedule the daily hit to `/api/cron/notifications` (Vercel Cron or cron-job.org)

**Done when:** a test subscription flows through Stripe and a quote email lands in an inbox.

## Phase 2 — Put it on the internet

- [ ] Deploy to Vercel: import `azdemir/TidyPro`, add all env vars, deploy
- [ ] Set `NEXT_PUBLIC_SITE_URL` to the live URL (e.g. `https://tidypro.vercel.app`)
- [ ] Supabase → Auth → URL configuration: add the live URL to redirect URLs
- [ ] Stripe → update webhook endpoint to the live URL
- [ ] Re-run the Phase 0 smoke test against the **live** URL in Stripe test mode

**Done when:** sign-up → trial → dashboard works from your phone on the live link.

## Phase 3 — Harden before strangers pay

- [ ] **P0 decision — coarse roles:** today every company member sees all company data. For a friendly pilot (owner + their own trusted crew) this is acceptable; for open signup it is not. Record the decision: pilot-only, fix before public launch. (Full fix = per-resource permissions — a large lift, scheduled post-pilot.)
- [ ] **P1 — Stripe webhook idempotency:** Stripe may deliver events twice. Before real money flows, add dedup (e.g. processed-event table) or at minimum monitor the webhook logs after each pilot signup.
- [ ] Add rate limiting on `/signin`, `/signup`, and invite endpoints
- [ ] Verify Supabase backups / point-in-time recovery are enabled for the project
- [ ] Replace placeholder testimonials / sample dashboard copy with real (or clearly labeled) content — never ship fake reviews

**Done when:** you'd trust a stranger's business data and credit card in the system.

## Phase 4 — Pilot (2–3 cleaning companies)

The kit is ready in `pilot/` — use it:
- [ ] `PILOT_CHECKLIST.md` — recruiting + onboarding steps
- [ ] `OUTREACH_SCRIPT.md` — first contact
- [ ] `PILOT_AGREEMENT.md` — terms (free/discounted pilot period)
- [ ] `FEEDBACK.md` + `SUCCESS_METRICS.md` — what to measure

- [ ] Recruit 2–3 local companies (owner-operated, 2–10 cleaners is ideal)
- [ ] White-glove onboarding: sit with them (call/screenshare), import their customers, send their first real quote
- [ ] Weekly check-in for 4 weeks; log every friction point in `FEEDBACK.md`
- [ ] Success bar: each pilot sends ≥5 quotes, completes ≥10 jobs, and says they'd pay

**Done when:** 2+ pilots hit the success bar and convert to paid.

## Phase 5 — After pilot (v1.1, prioritized by feedback)

- Proper role-based permissions (fix the P0 for real)
- Job photo uploads (schema is ready, UI is not)
- SMS notifications (Twilio) alongside email
- Customer portal polish: online quote approval signature, tip on invoice
- Public launch marketing: real testimonials from pilots, pricing page social proof

---

## Non-goals for MVP

- Mobile native apps (mobile web is covered)
- Multi-company switching for one login
- QuickBooks/Xero integrations
- Advanced reporting/analytics

## Honest limitations (do not market around these)

- Coarse roles (P0, see Phase 3)
- No rate limiting yet (Phase 3)
- Job photos not implemented
- All payments/emails depend on Stripe/Resend configuration
