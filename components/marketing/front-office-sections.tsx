import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, MinusIcon, ArrowRightIcon } from "@/components/ui/icons";
import { TrackedCta } from "@/components/marketing/tracked-cta";
import { createServiceClient } from "@/lib/supabase/server";
import {
  FRONT_OFFICE,
  FRONT_OFFICE_PLANS,
  FRONT_OFFICE_PLAN_IDS,
  FRONT_OFFICE_NO_HIRE_LINE,
  type FrontOfficePlanId,
} from "@/lib/front-office";
import { plans as softwarePlans } from "@/lib/site";

/* ------------------------------------------------------------------ */
/* "What we take off your plate" — Front Desk vs Full Office table      */
/* ------------------------------------------------------------------ */

type PlateRow = {
  label: string;
  frontDesk: boolean;
  fullOffice: boolean;
};

/** Authoritative row list: invoices/charges/reminders and reschedules are
 *  Full Office only (per the offer — the one-page PDF misaligns these
 *  checkmarks; the offer copy wins). */
const PLATE_ROWS: PlateRow[] = [
  {
    label: "Every call answered live by an AI assistant, day or night",
    frontDesk: true,
    fullOffice: true,
  },
  {
    label: "Texts, web forms and emails answered within minutes",
    frontDesk: true,
    fullOffice: true,
  },
  {
    label:
      "Quotes sent from your price list and followed up by text and email until the customer books or says no",
    frontDesk: true,
    fullOffice: true,
  },
  {
    label:
      "New visits booked into your schedule, with confirmations and day-before reminders",
    frontDesk: true,
    fullOffice: true,
  },
  {
    label:
      "Invoices sent after each visit; cards charged automatically; payment reminders by text and email until paid",
    frontDesk: false,
    fullOffice: true,
  },
  {
    label: "Reschedules, cancellations and review requests handled",
    frontDesk: false,
    fullOffice: true,
  },
  {
    label:
      "Monday report: enquiries, bookings, open quotes, money collected and overdue",
    frontDesk: true,
    fullOffice: true,
  },
];

function PlateCell({ included }: { included: boolean }) {
  return included ? (
    <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-accent-100 text-accent-700 dark:bg-accent-950 dark:text-accent-400">
      <CheckIcon className="h-4 w-4" />
      <span className="sr-only">Included</span>
    </span>
  ) : (
    <span className="mx-auto flex h-7 w-7 items-center justify-center">
      <MinusIcon className="h-5 w-5 text-line-strong" />
      <span className="sr-only">Not included</span>
    </span>
  );
}

export function TakeOffYourPlate() {
  return (
    <section className="scroll-mt-20 bg-slate-50 py-20 sm:py-24 dark:bg-slate-900">
      <Container>
        <SectionHeading
          eyebrow="Front Office Service"
          title="What we take off your plate"
          description="Your AI assistant answers, quotes, books, reminds — and on Full Office, invoices and collects. All under your company's name."
        />
        <div className="mx-auto mt-12 max-w-4xl overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse overflow-hidden rounded-xl bg-white text-left shadow-sm dark:bg-slate-950">
            <caption className="sr-only">
              Front Office Service plans: Front Desk versus Full Office
            </caption>
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th scope="col" className="p-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  <span className="sr-only">What&apos;s included</span>
                </th>
                {FRONT_OFFICE_PLAN_IDS.map((id) => (
                  <th key={id} scope="col" className="p-4 text-center">
                    <span className="block text-base font-bold text-slate-900 dark:text-slate-100">
                      {FRONT_OFFICE_PLANS[id].name}
                    </span>
                    <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">
                      <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        ${FRONT_OFFICE_PLANS[id].price}
                      </span>
                      /month
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PLATE_ROWS.map((row) => (
                <tr
                  key={row.label}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                >
                  <th
                    scope="row"
                    className="p-4 text-sm font-normal text-slate-700 dark:text-slate-300"
                  >
                    {row.label}
                  </th>
                  <td className="p-4 text-center">
                    <PlateCell included={row.frontDesk} />
                  </td>
                  <td className="p-4 text-center">
                    <PlateCell included={row.fullOffice} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {FRONT_OFFICE_NO_HIRE_LINE}
        </p>
        <div className="mt-6 text-center">
          <TrackedCta href="/founding-client" cta="claim_founding_spot" page="home_plate">
            Claim a founding spot
            <ArrowRightIcon className="h-5 w-5" />
          </TrackedCta>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* How it works — the 4 steps, exact offer copy                        */
/* ------------------------------------------------------------------ */

const STEPS = [
  {
    title: "A short online setup",
    body: "Enter services, prices, service area and policies, and upload your customer list.",
  },
  {
    title: "We connect",
    body: "Your business line and enquiry inbox forward to your AI assistant. Your number stays yours. Everything goes out under your company's name.",
  },
  {
    title: "Every day, automatically",
    body: "The assistant answers calls, quotes from your price list, follows up, books and reminds (Full Office also invoices and collects). Anything unusual, or any quote outside your price list, comes straight to you by text.",
  },
  {
    title: "Every Monday",
    body: "A one-page report is emailed to you.",
  },
];

export function FrontOfficeHowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 bg-white py-20 sm:py-24 dark:bg-slate-950"
    >
      <Container>
        <SectionHeading
          eyebrow="How it works"
          title="Set up once. We handle the front office from there."
          description="Four steps, and your AI assistant starts answering in your company's name."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Card key={s.title}>
              <CardContent>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {s.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* "What stays in your control" — trust section, exact offer copy       */
/* ------------------------------------------------------------------ */

const TRUST_ITEMS = [
  {
    title: "Your brand",
    body: "Customers only ever see your company's name.",
  },
  {
    title: "Honest with your customers",
    body: "Callers are told they're speaking with your company's AI assistant. It never makes automated sales calls. Follow-ups go by text and email, and only to customers who agreed to receive them.",
  },
  {
    title: "Your prices and rules",
    body: "It quotes from your price list; anything outside it waits for your OK.",
  },
  {
    title: "Your customers and data",
    body: "They're yours, with a full export any time.",
  },
  {
    title: "Your money",
    body: "Card payments go straight to your own account; we never hold your money.",
  },
  {
    title: "No contract",
    body: "Month to month, cancel any month.",
  },
];

export function FrontOfficeTrust() {
  return (
    <section className="scroll-mt-20 bg-slate-50 py-20 sm:py-24 dark:bg-slate-900">
      <Container>
        <SectionHeading
          eyebrow="In your control"
          title="What stays in your control"
          description="The assistant works for you — your brand, your prices, your rules."
        />
        <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TRUST_ITEMS.map((item) => (
            <Card key={item.title}>
              <CardContent>
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-700 dark:bg-accent-950 dark:text-accent-400">
                    <CheckIcon className="h-4 w-4" />
                  </span>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {item.title}
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {item.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Founding-client offer                                               */
/* ------------------------------------------------------------------ */

/** Spots left = config total minus approved applications. Never hardcoded:
 *  the count comes from the database; on any error we show the full total. */
async function spotsRemaining(): Promise<number> {
  try {
    const sb = await createServiceClient();
    const { count, error } = await sb
      .from("founding_applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved");
    if (error) throw error;
    return Math.max(0, FRONT_OFFICE.FOUNDING_SPOTS_TOTAL - (count ?? 0));
  } catch {
    return FRONT_OFFICE.FOUNDING_SPOTS_TOTAL;
  }
}

export async function FoundingClient() {
  const remaining = await spotsRemaining();
  return (
    <section className="scroll-mt-20 bg-brand-700 py-20 sm:py-24 dark:bg-brand-900">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <Badge tone="brand" className="bg-white/15 px-3 py-1 text-sm text-white">
            Founding clients
          </Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Five founding spots for Upstate New York cleaning companies
          </h2>
          <p className="mt-4 text-lg text-brand-100">
            We&apos;re taking on five cleaning companies in Upstate New York as
            founding clients. Free setup, including moving your current
            customer list and schedule. Your founding price is locked for 12
            months.
          </p>
          <p
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-base font-semibold text-white"
            role="status"
            aria-live="polite"
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-300"
              aria-hidden="true"
            />
            {remaining} of {FRONT_OFFICE.FOUNDING_SPOTS_TOTAL} spots remaining
          </p>
          <div className="mt-8">
            <TrackedCta
              href="/founding-client"
              cta="claim_founding_spot"
              page="home_founding"
              className="bg-white text-brand-700 shadow-sm hover:bg-brand-50 focus-visible:outline-white"
            >
              Claim a founding spot
              <ArrowRightIcon className="h-5 w-5" />
            </TrackedCta>
          </div>
          <p className="mt-4 text-sm text-brand-200">
            Month to month after that — cancel any month.
          </p>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Pricing — two groups: done-for-you + self-serve software             */
/* ------------------------------------------------------------------ */

function FrontOfficePlanCard({ id }: { id: FrontOfficePlanId }) {
  const plan = FRONT_OFFICE_PLANS[id];
  const featured = id === "full_office";
  return (
    <Card
      className={
        featured ? "relative border-2 border-brand-600 shadow-lg" : ""
      }
    >
      {featured && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <Badge tone="brand" className="px-3 py-1 text-xs">
            Most value
          </Badge>
        </div>
      )}
      <CardContent className="flex h-full flex-col">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {plan.name}
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {plan.blurb}
        </p>
        <p className="mt-4">
          <span className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            ${plan.price}
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400"> /month</span>
        </p>
        <ul className="mt-6 flex-1 space-y-3">
          {plan.features.map((f) => (
            <li
              key={f}
              className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400"
            >
              <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-accent-600" />
              {f}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          Month to month. No per-call charges.
        </p>
        <TrackedCta
          href={`/founding-client?plan=${plan.id}`}
          cta={`plan_${plan.id}`}
          page="home_pricing"
          variant={featured ? "primary" : "outline"}
          className="mt-4 w-full"
        >
          Claim a founding spot
        </TrackedCta>
      </CardContent>
    </Card>
  );
}

export function FrontOfficePricing() {
  return (
    <section id="pricing" className="scroll-mt-20 bg-white py-20 sm:py-24 dark:bg-slate-950">
      <Container>
        <SectionHeading
          eyebrow="Pricing"
          title="One flat monthly fee. No per-call charges."
          description="Choose done-for-you, or run the software yourself."
        />

        <h3 className="mt-14 text-center text-xl font-bold text-slate-900 dark:text-slate-100">
          Done-for-you Front Office
        </h3>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500 dark:text-slate-400">
          We run your front office. You run the cleaning.
        </p>
        <div className="mx-auto mt-8 grid max-w-3xl items-stretch gap-6 sm:grid-cols-2">
          {FRONT_OFFICE_PLAN_IDS.map((id) => (
            <FrontOfficePlanCard key={id} id={id} />
          ))}
        </div>

        <h3 className="mt-16 text-center text-xl font-bold text-slate-900 dark:text-slate-100">
          Self-serve software
        </h3>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500 dark:text-slate-400">
          The same engine, run by you and your team. 14-day free trial.
        </p>
        <div className="mt-8 grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {softwarePlans.map((plan) => (
            <Card key={plan.name}>
              <CardContent className="flex h-full flex-col">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {plan.name}
                </h4>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {plan.blurb}
                </p>
                <p className="mt-4">
                  <span className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    ${plan.price}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400"> /month</span>
                </p>
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400"
                    >
                      <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-accent-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                <TrackedCta
                  href="/demo"
                  cta={`software_plan_${plan.name.toLowerCase()}`}
                  page="home_pricing"
                  variant="outline"
                  className="mt-8 w-full"
                >
                  {plan.cta}
                </TrackedCta>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Founding-client stories — honest placeholder (no fake testimonials)  */
/* ------------------------------------------------------------------ */

export function FoundingStories() {
  return (
    <section className="scroll-mt-20 bg-slate-50 py-20 sm:py-24 dark:bg-slate-900">
      <Container>
        <SectionHeading
          eyebrow="Founding clients"
          title="Founding-client stories coming soon"
          description="We're onboarding our first five Upstate New York cleaning companies now. Their stories — in their own words — will appear here once they're live."
        />
        <div className="mx-auto mt-10 max-w-2xl text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Want your company to be one of the five?{" "}
            <Link
              href="/founding-client"
              className="font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800 dark:text-brand-400"
            >
              Claim a founding spot
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
