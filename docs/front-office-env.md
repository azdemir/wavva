# Front Office Service — environment variables & third-party accounts

Every variable the Front Office Service needs, what it's for, and whether
it's live or stubbed. Set these in Vercel (Project → Settings → Environment
Variables) and in `.env.local` for local development.

## Status legend

- **LIVE** — wired up and used today.
- **STUBBED** — the interface and factory exist (`lib/front-office/providers/`),
  but the concrete provider implementation throws "not configured" until the
  keys are set AND the TODO implementation lands. Nothing silently pretends
  to work.

## Email (Resend) — LIVE

Already used by the app for notifications. The Front Office Service uses it
for the founding-client application notification and the Monday report.

| Variable | Required | Notes |
|---|---|---|
| `RESEND_API_KEY` | Yes for sending | Without it, the founding form still saves but logs a line instead of emailing the owner; the Monday report is recorded but not emailed. |
| `CONTACT_EMAIL` | Recommended | Where founding-client application notifications go. Defaults to `azizdemir6@gmail.com`. |

Third-party account: [resend.com](https://resend.com) — verify the sending
domain before production (the code sends from `no-reply@<your-site-host>`).

## SMS + Voice / AI call answering (Twilio) — STUBBED

| Variable | Required | Notes |
|---|---|---|
| `TWILIO_ACCOUNT_SID` | Yes | Enables `getSmsProvider()` / `getVoiceProvider()`. |
| `TWILIO_AUTH_TOKEN` | Yes | — |
| `TWILIO_PHONE_NUMBER` | Yes | The number the assistant texts from / answers on (E.164). The client's business line forwards to this; the client's own number never changes. |

Third-party account: [twilio.com](https://www.twilio.com) — a phone number
with Voice + SMS capability, plus (for AI answering) a conversational-AI /
media-streams setup, which is not built yet. The interfaces are ready; the
Twilio webhook handlers and TwiML are the remaining work.

Compliance note: STOP / unsubscribe is honored in code
(`lib/front-office/compliance.ts`), and quiet hours (default 8am–9pm
company-local) gate every outbound text. Register for 10DLC before texting
real customers.

## Payments — card charges to the client's own account (Stripe Connect) — STUBBED

| Variable | Required | Notes |
|---|---|---|
| `STRIPE_SECRET_KEY` | Yes | Enables `getPaymentsProvider()`. |
| `STRIPE_CONNECT_CLIENT_ID` | For onboarding | Used when each cleaning company connects their own Stripe account via OAuth (not built yet). |

Third-party account: [stripe.com](https://stripe.com) with **Stripe Connect**
enabled. The design is destination charges: money flows customer → the
cleaning company's connected account. The platform never holds customer
funds — `assertClientAccount()` in `lib/front-office/providers/payments.ts`
refuses any charge that doesn't name a real `acct_...` connected account.

## Cron / scheduler — LIVE

| Variable | Required | Notes |
|---|---|---|
| `CRON_SECRET` | Yes | Bearer token guarding `/api/cron/monday-report` (same pattern as the other cron routes). |

`vercel.json` schedules `/api/cron/monday-report` hourly
(`0 * * * *`); the route only sends inside each company's Monday
07:00–07:59 local window and is idempotent per week.

## Supabase — LIVE (existing)

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` — unchanged. Run
`supabase/migrations/0019_front_office.sql` to create the Front Office
tables (`founding_applications`, `analytics_events`,
`front_office_settings`, `front_office_escalations`,
`front_office_conversations`, `front_office_reports`) and the consent
columns on `customers`.

## What still needs a human

1. Create the Twilio account + number, then set the three `TWILIO_*` vars.
2. Create/verify the Resend sending domain, then set `RESEND_API_KEY`.
3. Enable Stripe Connect, then set `STRIPE_SECRET_KEY` (+ client ID for
   OAuth onboarding when that's built).
4. Generate `CRON_SECRET` (any long random string) and set it both in
   Vercel env and wherever the cron caller runs.
5. Set `CONTACT_EMAIL` to the inbox that should receive founding-client
   applications.
6. Run migration `0019_front_office.sql` on the Supabase project.
