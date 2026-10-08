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
- `/signin` — placeholder page labeled as non-functional until Stage 3 auth

## What's explicitly placeholder / mockup (not real)

- Testimonial cards are **clearly labeled placeholders** — no reviews invented
- Hero dashboard preview is an illustration with fictional sample data
- Pricing is suggested, flagged "final plans confirmed at launch"
- `/demo` form and `/signin` page are non-functional UI placeholders
- No database, no authentication, no payments, no notifications exist yet —
  nothing here is production-ready

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
- **Stage 3:** auth + company onboarding wizard + database (PostgreSQL + RLS tenant isolation)
- **Stage 4:** customers, services/pricing config, quotes → bookings
- **Stage 5:** scheduling, assignments, job lifecycle, cleaner mobile views
- **Stage 6:** invoicing, Stripe Connect, customer portal
- **Stage 7:** email notifications, platform admin, audit logs, security review
- **Stage 8:** pilot with 2–3 Upstate NY cleaning companies
