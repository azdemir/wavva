import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ArrowRightIcon } from "@/components/ui/icons";
import {
  TakeOffYourPlate,
  FrontOfficeHowItWorks,
  FrontOfficeTrust,
  FoundingClient,
  FrontOfficePricing,
} from "@/components/marketing/front-office-sections";
import { TrackedCta } from "@/components/marketing/tracked-cta";
import { FRONT_OFFICE } from "@/lib/front-office";

export const metadata: Metadata = {
  title: "Front Office Service — We run your front office. You run the cleaning.",
  description:
    "TidyPro's done-for-you Front Office Service: an AI assistant answers every call, text and email in your company's name, books your schedule, and follows up every unpaid invoice. From $300/mo, month to month.",
  alternates: { canonical: "/front-office" },
};

const FAQS = [
  {
    q: "What happens when the AI can't answer?",
    a: "Anything the assistant can't handle comes straight to you by text — including anything unusual, or any quote outside your price list. It never guesses on your behalf.",
  },
  {
    q: "Does my number change?",
    a: "No. Your business line and enquiry inbox forward to your AI assistant, and your number stays yours. Everything goes out under your company's name.",
  },
  {
    q: "Can I export my data?",
    a: "Yes. Your customers and data are yours, with a full export any time — customers, jobs, quotes, invoices and conversations.",
  },
  {
    q: "Who gets paid?",
    a: "You do. Card payments go straight to your own account; we never hold your money.",
  },
  {
    q: "What if a customer doesn't want texts?",
    a: "Follow-ups go by text and email only to customers who agreed to receive them. If a customer replies STOP or unsubscribes, we stop immediately.",
  },
  {
    q: "How fast is setup?",
    a: "It's a short online setup: enter your services, prices, service area and policies, and upload your customer list. Founding clients get free setup, including moving your current customer list and schedule for you.",
  },
];

export default function FrontOfficePage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHero
          eyebrow={`${FRONT_OFFICE.BRAND} Front Office Service`}
          title="We run your front office. You run the cleaning."
          description="Every new enquiry answered quickly, every quote followed up, every visit confirmed and every unpaid invoice followed up, under your company's name, for one flat monthly fee."
        />

        {/* The pitch */}
        <section className="bg-white py-16 dark:bg-slate-950">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
                An AI assistant replies to your customers in your
                company&apos;s name, books them into your schedule and makes
                sure every visit gets paid. Anything it can&apos;t handle
                comes straight to you by text.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <TrackedCta
                  href="/founding-client"
                  cta="claim_founding_spot"
                  page="front_office_page"
                >
                  Claim a founding spot
                  <ArrowRightIcon className="h-5 w-5" />
                </TrackedCta>
                <TrackedCta
                  href="/front-office#how-it-works"
                  cta="see_how_it_works"
                  page="front_office_page"
                  variant="outline"
                >
                  See how it works
                </TrackedCta>
              </div>
            </div>
          </Container>
        </section>

        <TakeOffYourPlate />
        <FrontOfficeHowItWorks />
        <FrontOfficeTrust />
        <FrontOfficePricing />

        {/* FAQ */}
        <section className="bg-slate-50 py-20 sm:py-24 dark:bg-slate-900">
          <Container>
            <SectionHeading
              eyebrow="Questions"
              title="Front Office questions, answered"
              description="Straight answers about how the service works and what stays in your control."
            />
            <div className="mx-auto mt-12 max-w-3xl space-y-4">
              {FAQS.map((f) => (
                <details
                  key={f.q}
                  className="group rounded-xl border border-slate-200 bg-white px-6 py-4 open:shadow-sm dark:border-slate-800 dark:bg-slate-950"
                >
                  <summary className="cursor-pointer list-none text-base font-semibold text-slate-900 dark:text-slate-100 [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center justify-between gap-4">
                      {f.q}
                      <span
                        aria-hidden="true"
                        className="text-xl font-normal text-brand-600 transition-transform group-open:rotate-45 dark:text-brand-400"
                      >
                        +
                      </span>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </Container>
        </section>

        <FoundingClient />
      </main>
      <Footer />
    </>
  );
}
