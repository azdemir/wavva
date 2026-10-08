# TidyPro Security Review (Stage 7)

Date: 2026-10-08. Status: pre-pilot. This document is honest about what is
and isn't protected. Fix P0 items before onboarding paying pilot companies.

## What's solid

- **Tenant isolation in the database.** Every tenant table has `company_id`
  and Row-Level Security. All app data access uses the user's JWT via
  `@supabase/ssr`, so RLS policies — not application code — enforce isolation.
  Policies live in `supabase/migrations/0001_init.sql` and use
  `SECURITY DEFINER` helpers to avoid recursion.
- **Auth sessions.** Supabase Auth with httpOnly cookies; `proxy.ts`
  refreshes sessions; server components never see tokens in JS.
- **Invite acceptance.** Invitees aren't members yet, so the token lookup and
  membership insert run through the service-role key **server-side only**,
  gated on: token valid + unaccepted + invite email matches the signed-in user.
- **Portal tokens.** 128-bit random UUIDs, revocable, expirable, resolved
  with the service-role key. Portal pages never use the anon key.
- **Stripe webhook.** Verifies the `stripe-signature` header against
  `STRIPE_WEBHOOK_SECRET` before trusting anything; idempotency comes from
  Stripe event delivery + payment row inserts (duplicate events would need a
  dedupe guard — see P1).
- **Audit trail.** Append-only `audit_logs` (no UPDATE/DELETE policies);
  key actions log actor, entity, and metadata.
- **Secrets.** All keys live in env vars (`.env.example` documents them);
  the service-role key and Stripe secret never touch client components.

## P0 — fix before paid pilot

1. **Coarse roles.** Today every company member (including cleaners) gets
   full read/write on all company data — invoices, payments, customer PII,
   settings. For a 2–3 company friendly pilot this is acceptable; before
   charging anyone, tighten RLS so:
   - cleaners can SELECT only jobs assigned to them (+ the customer/address
     rows those jobs reference), and UPDATE only `status`/`checklist`/`notes`
     on those jobs;
   - managers get everything except `settings`, `invites`, `audit_logs`,
     and `payments`;
   - owners keep full access.
   Remediation: add `public.caller_role(cid)` helper and per-table
   role-aware policies; then re-test every page as each role.
2. **No rate limiting.** Auth endpoints, portal token resolution, and the
   cron route have no rate limits. Add platform-level rate limiting (or a
   WAF) before public launch; Supabase Auth has built-in abuse protection —
   confirm it's enabled.
3. **Backups & PITR.** Confirm Supabase point-in-time recovery is enabled
   for the production project before real customer data lands.

## P1 — fix soon after pilot starts

4. **Stripe webhook dedupe.** `checkout.session.completed` could theoretically
   double-record a payment on redelivery. Add an idempotency check
   (e.g. unique constraint on `payments.provider_ref`).
5. **Portal token expiry default.** Tokens currently live forever unless an
   expiry is set. Set a default 1-year expiry and rotate links annually.
6. **PII minimization.** `service_addresses.access_instructions` is
   sensitive; today any member can read it. The P0 role tightening covers
   this, but also consider column-level redaction in list views.
7. **Cron secret rotation.** `CRON_SECRET` is a shared secret — rotate it if
   it ever leaks, and prefer the scheduler's signed requests long-term.

## P2 — hardening

8. **Content Security Policy headers** for the marketing site and portal.
9. **File uploads** (job photos, logos): when object storage lands, use
   signed URLs with short expiries, scan uploads, and never serve
   user-controlled HTML.
10. **Session lifetime review** and step-up auth for destructive owner
    actions (delete company, revoke all portal links).

## Out of scope for this review

- Penetration testing (do before public launch, not before pilot).
- SOC 2 / compliance evidence collection.
