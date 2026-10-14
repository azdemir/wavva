import { Container } from "@/components/ui/container";
import { ArrowRightIcon, PhoneIcon } from "@/components/ui/icons";
import { TrackedCta } from "@/components/marketing/tracked-cta";
import { FRONT_OFFICE } from "@/lib/front-office";

/**
 * Homepage hero for the Front Office Service. Leads with the done-for-you
 * offer; the software is the engine behind it, described further down.
 */
export function FrontOfficeHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 to-white dark:from-brand-950/50 dark:to-slate-950">
      <Container>
        <div className="mx-auto max-w-3xl py-16 text-center lg:py-24">
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-950 dark:text-brand-300">
            <PhoneIcon className="h-4 w-4" aria-hidden="true" />
            {FRONT_OFFICE.BRAND} Front Office Service
          </p>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
            We run your front office. You run the cleaning.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            Every new enquiry answered quickly, every quote followed up, every
            visit confirmed and every unpaid invoice followed up, under your
            company&apos;s name, for one flat monthly fee.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-500 dark:text-slate-500">
            An AI assistant replies to your customers in your company&apos;s
            name, books them into your schedule and makes sure every visit
            gets paid. Anything it can&apos;t handle comes straight to you by
            text.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <TrackedCta
              href="/founding-client"
              cta="claim_founding_spot"
              page="home_hero"
            >
              Claim a founding spot
              <ArrowRightIcon className="h-5 w-5" />
            </TrackedCta>
            <TrackedCta
              href="/front-office#how-it-works"
              cta="see_how_it_works"
              page="home_hero"
              variant="outline"
            >
              See how it works
            </TrackedCta>
          </div>
          <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">
            Five founding spots for Upstate New York cleaning companies ·
            Free setup · Month to month
          </p>
        </div>
      </Container>
    </section>
  );
}
