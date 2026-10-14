<p align="center">
  <img src="public/wavva-logo.svg" alt="Wavva — The AI front office for every business" width="280" />
</p>

# Wavva — The AI front office for every business

Wavva answers every call in your business's name, books appointments, follows
up quotes, and collects invoices — one flat monthly fee.

> **Every call answered. Every job booked.**

The logo is a waveform tracing a "W" — seven rounded bars in a violet gradient
(#8B7CFF → #5B3DF0) next to the Wavva wordmark. Pure-vector outlined SVG
(`components/ui/logo.tsx`: `WavvaMark` / `WavvaLogo`; favicon `app/icon.svg`),
Plus Jakarta Sans shaped with HarfBuzz kerning and converted to path outlines,
so there is no font dependency. It renders on light and dark.

Built with Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + React 19.
Vercel auto-deploys from `main`. (Repo is still named `TidyPro` on GitHub —
the product brand is Wavva; internal identifiers such as DB tables and
storage keys were intentionally left untouched by the rebrand.)

## The product: AI call answering

- **Real voice pipeline** — Twilio Voice webhooks (`/api/webhooks/voice`,
  `/turn`, `/status`): TwiML Gather/Say turn loop with signature verification,
  replacing the old stub.
- **AI brain** (`lib/front-office/ai-brain.ts`) — per-company system prompt
  with an OpenAI tool loop: `get_quote` (quotes only from the company price
  list, never invented), `request_booking`, `escalate`, `end_call`.
- **Minute metering** — Essential includes 250 AI-answered minutes/month,
  Complete includes 600; **30¢/min overage**. Usage is tracked live in the
  dashboard. Migration `0020_ai_answering.sql` (`ai_*` settings columns,
  booking-request escalation kind, `ai_calls` log table).
- **Dashboard** — `/dashboard/front-office/ai-answering`: usage vs. included
  minutes, settings form, recent calls.
- **Live demo on the front page** — the hero's sample-call player
  (`#chatdemo`) plays a real 41-second two-voice AI call with a synced
  transcript and progress bar. The MP3 ships as 12 base64 text chunks in
  `public/call-audio/` (c01–c12), fetched and reassembled into a Blob URL in
  the browser — binary assets can't travel through the GitHub file tools, so
  the chunks are the portable format.
- **Transparency rules** — callers are always told they're speaking with the
  business's AI assistant. Anything unusual, or outside the price list, is
  texted to the owner immediately; the AI never guesses on your behalf.

**Pricing:** Essential **$299/mo** · Complete **$599/mo**. Month to month,
7-day free trial, no card. (Founding 50 offer on the marketing site.)

## What's underneath: multi-tenant operations platform

The same codebase runs a full business-management dashboard — scheduling,
customers, quotes → bookings with job generation, crew, checklists, invoices,
Stripe payments, customer portal, team roles, audit logs:

- PostgreSQL (Supabase) with **Row-Level Security on every table** — tenant
  isolation is enforced in the database via `company_id`, not in
  application code. Migrations: `supabase/migrations/0001`–`0020`.
- Integrations: Stripe Connect (payments), Resend (email), Twilio
  (SMS/Voice), OpenAI (AI brain); QuickBooks Online integration spec'd
  (awaiting Intuit app credentials).
- Dashboard and onboarding are multilingual (`en`/`es`/`uk`) via next-intl;
  marketing pages stay static English.

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build check
npm run lint     # eslint
```

1. Copy `.env.example` to `.env.local` and fill in the Supabase keys.
   (For local dev, disable "Confirm email" in Supabase Auth settings.)
2. Run migrations `0001`–`0020` on your Supabase project in order
   (plus the two composite indexes from `0006`).
3. For AI call answering: `TWILIO_*` keys + `OPENAI_API_KEY`, run migration
   `0020`, and point your Twilio number's voice webhook at
   `/api/webhooks/voice` (status callback at `/api/webhooks/voice/status`).
4. `STRIPE_*` + `RESEND_API_KEY` unlock online payments and email; everything
   key-gated degrades gracefully with explicit UI notes.

## Project structure

```
app/
  page.tsx                      # Wavva marketing home (hero + sample-call player)
  pricing/page.tsx              # Essential $299 / Complete $599
  front-office/page.tsx         # AI answering product page
  dashboard/front-office/ai-answering/  # usage + settings + recent calls
  api/webhooks/voice/           # Twilio voice, /turn, /status webhooks
components/
  ui/logo.tsx                   # WavvaMark / WavvaLogo
  switchboard/                  # marketing design system (pill nav, hero, pricing, FAQ)
lib/
  site.ts                       # brand name, tagline, FAQs
  front-office/ai-brain.ts      # per-company prompt + tool loop
  plans.ts                      # plan definitions (informational — real charges
                                # come from STRIPE_PRICE_* env vars)
supabase/migrations/            # 0001–0020 schema + RLS
public/
  wavva-logo.svg                # brand lockup (this README's header)
  call-audio/c01–c12.txt        # sample call, base64 chunks → reassembled in browser
```

## Current status

- Marketing site, AI-answering pipeline, dashboard, and billing are built,
  typechecked, linted, and production-build green (92 routes).
- The texting half stays dark until Twilio 10DLC campaign approval lands
  (registration packet ready; reviews run ~10–15 days).
- Binary assets (PNG favicons, the source `sample-call.mp3`) can't travel
  through the GitHub file tools — they need a real `git push` from a
  credentialed machine; the SVG favicon and base64 audio chunks cover the
  gap until then.
