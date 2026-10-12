# TidyPro — Landing Page Gap Analysis (vs. competitors)

**Date: 2026-10-11.** Comparison of the marketing landing page (`app/page.tsx`)
against competitor patterns in cleaning/field-service SaaS (Jobber, Housecall
Pro, Launch27-class, QuoteIQ-class).

Nothing here is built yet — this is a prioritised list of what could be added.

---

## What the page has today

Section order (`app/page.tsx:13`):

| # | Section | Component | CMS-driven? |
|---|---------|-----------|-------------|
| 1 | Hero (rotating headline + live dashboard tour) | `marketing/hero.tsx` | yes (`home.hero.*`) |
| 2 | Service-area marquee | `marketing/proof-strip.tsx` | yes (`site.cities`) |
| 3 | Features | `marketing/features.tsx` | yes (`home.features.*`) |
| 4 | Compare band | `marketing/compare-band.tsx` | yes (`home.compare.rows`) |
| 5 | How it works | `marketing/how-it-works.tsx` | yes (`home.how.*`) |
| 6 | Pricing (full plan cards) | `marketing/pricing.tsx` | partly |
| 7 | Customer stories | `marketing/testimonials.tsx` | yes (`home.stories.*`) |
| 8 | FAQ | `marketing/faq.tsx` | yes (`site.faqs`) |
| 9 | CTA | `marketing/cta.tsx` | yes (`home.cta.*`) |
| 10 | Footer | `marketing/footer.tsx` | partly |

**Genuinely strong, keep it:**
- Live animated product tour next to the hero (`components/marketing/dashboard-tour.tsx`) — most competitors ship a static screenshot or a video
- Dedicated comparison pages (`app/compare/jobber/page.tsx` and siblings)
- "No per-user fees" positioning is clear and consistently wired from `lib/plans.ts`
- Compare band beats a generic feature grid on differentiation

---

## Gaps, in priority order

### 1. No proof (most critical)

Competitors have all three of these; we have none:

- **Customer logo strip** ("Trusted by X cleaning businesses")
- **Hard numbers** (customer count, jobs processed, coverage)
- **Third-party review ratings** (G2 / Capterra badges)

**How we got here:** commit `5721b8c` ("Landing page: remove headline stats +
why-us cards") deleted the headline stats ($10 / 0 / 14 / 30m) and the four
why-us cards, keeping only the city marquee. The stated intent was decluttering.
The side effect was that no verifiable number remains anywhere on the page.

**Related risk — the testimonials are sample data, not customers.**
`lib/studio/registry.ts:504` still carries
`help: "Sample stories — replace with real pilot customer stories once collected"`,
and `home.stories.items` renders names, cities and 5-star ratings for people who
are not real users. The hero compounds it with "Loved by cleaning pros across
Upstate New York" (`components/marketing/hero.tsx:124`).

> **Recommendation:** until the first real pilot customers exist, either drop the
> star/avatar testimonial block or label it "Sample story" in the UI. Fabricated
> social proof is worse than no social proof — and competitors here run real
> logo walls.

### 2. "Switch from Jobber" migration section

The page never mentions that switching is easy, even though the capability
already ships:

- CSV customer import with duplicate detection — `lib/actions/import.ts:170`
- Jobber / Housecall Pro / Google Calendar importers (`IMPORT_ENCRYPTION_KEY`)
- API import, webhooks, Mailchimp

`pilot/OUTREACH_SCRIPT.md` already targets 12 Upstate NY companies. A band like
*"Moving off Jobber? Import your customers in minutes."* would serve exactly the
audience the pilot script is written for. None of this is currently marketed.

### 3. No ROI / time-savings calculator

Competitors (QuoteIQ-class in particular) ship lead magnets like "business
calculators". We have the raw material: 14 communication templates with
automatic sends (`lib/communications`), automated quote follow-up, and plan
pricing in `lib/plans.ts`. A small client component could compute
"time saved per month" and the current price. Cheap to build, good for inbound.

### 4. Integrations are invisible

Capabilities that exist but appear nowhere on the landing page:

| Capability | Where it lives |
|---|---|
| Stripe payments / invoicing | `lib/actions/invoices.ts`, `lib/stripe.ts` |
| QuickBooks sync | `app/api/webhooks/stripe`, migration `0012` (stub, see CHANGELOG) |
| Google Calendar import | `IMPORT_ENCRYPTION_KEY` gated |
| Mailchimp | comms module |
| Webhooks + API import | `lib/actions/import.ts` |

Competitors run a "Works with…" logo row. Cheap here because the features
already exist — highest ROI-per-effort item on this list.

### 5. No trust / security band

Nothing about data protection on the page: no SOC 2, no CCPA/GDPR mention, no
"data stays in your region", no encryption statement. `SECURITY.md` exists but
isn't reflected anywhere in the marketing site.

There is a good FAQ answer in `site.faqs` ("How do my customers pay me?"), but
buyers' first question is usually "is my data safe" — and that answer isn't
prominent anywhere.

### 6. "See how it works" is not a video

The secondary hero CTA (`components/marketing/hero.tsx:75`) scrolls to
`#how-it-works`. There is no video. The live dashboard tour covers part of this,
but it autoplays muted with no audio option. A 60–90s captioned product video is
table stakes for this category.

### 7. Compare band should name competitors

`home.compare.rows` (`lib/studio/registry.ts:342`) uses the generic label
**"Big platforms"** in the `them` column. Naming Jobber and Housecall Pro
directly is materially better for conversion — and we already have
`/compare/jobber` to link to from each row.

### 8. Pricing block is duplicated on the homepage

`components/marketing/pricing.tsx:142` renders the full four plan cards on the
homepage, and `/pricing` renders the same cards plus a 9-row comparison table
plus 5 billing FAQs. Visitors scroll past the same four cards twice. Most
competitors put a short summary on the homepage and link out.

---

## Suggested sequencing

**Tier 1 — no code, Studio CMS only**

1. Put real competitor names in `home.compare.rows`
2. Any proof copy updates that don't need real logos

**Tier 2 — code, highest ROI first**

3. Integration band (surfacing features that already exist)
4. "Switch from Jobber" section + CSV import callout
5. Customer logo strip — **only once real customers exist**
6. Trust/security band
7. ROI calculator

**Tier 3 — polish**

8. Product video in the hero
9. Shorten the homepage pricing block to a summary + link

---

## Blocker

Before items 5 and 7 ship, collect real pilot customer stories. Every other
item on this list is decoration on top of an empty proof section; the proof
itself is the part that needs the 12 pilot calls in `pilot/ROADMAP.md`.

Related open items (deliberately untouched, pending a pricing decision):
`STRIPE_PRICE_BASIC` missing from `.env.example`, pricing CTAs pointing at
`/demo` instead of `/signup`, and `pilot/ROADMAP.md` ($49/$99/$199)
contradicting `lib/plans.ts` ($10/$15/$35/$45).