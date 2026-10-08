import { site } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ArrowRightIcon } from "@/components/ui/icons";
import { DashboardTour } from "@/components/marketing/dashboard-tour";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 to-white dark:from-brand-950/50 dark:to-slate-950">
      <Container>
        <div className="grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-up">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl lg:text-6xl">
              Run your cleaning business from{" "}
              <span className="text-brand-600 dark:text-brand-400">one tidy place</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-600 dark:text-slate-400">
              {site.name} handles your quotes, schedule, crew, invoices, and
              customer messages — so you spend less time on paperwork and more
              time on jobs. Made for residential and commercial cleaners, from
              solo operators to growing teams.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/demo" size="lg">
                Start free trial
                <ArrowRightIcon className="h-5 w-5" />
              </Button>
              <Button href="#how-it-works" variant="outline" size="lg">
                See how it works
              </Button>
            </div>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Free 14-day trial · No credit card required · Cancel anytime
            </p>
          </div>

          {/* Auto-playing dashboard tour — sample data, not a screenshot */}
          <div className="animate-fade-in min-w-0">
            <DashboardTour />
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 py-8">
          <p className="text-center text-xs font-semibold tracking-widest text-slate-400 uppercase">
            Set your service area anywhere — for example
          </p>
          <p className="mt-3 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
            {site.cities.join("  ·  ")}
          </p>
        </div>
      </Container>
    </section>
  );
}
