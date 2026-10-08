import { site } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Badge, JobStatusPill } from "@/components/ui/badge";
import { ArrowRightIcon } from "@/components/ui/icons";

/**
 * Fictional sample data — used only to illustrate the product in the hero visual.
 */
const sampleJobs = [
  {
    time: "9:00 AM",
    customer: "Maple Street Residence",
    address: "Albany, NY",
    crew: "Crew A · Maria & Jen",
    status: "in_progress" as const,
  },
  {
    time: "11:30 AM",
    customer: "Lakeside Dental Office",
    address: "Saratoga Springs, NY",
    crew: "Crew B · Devon",
    status: "scheduled" as const,
  },
  {
    time: "2:00 PM",
    customer: "Elm Avenue Residence",
    address: "Schenectady, NY",
    crew: "Crew A · Maria & Jen",
    status: "scheduled" as const,
  },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 to-white">
      <Container>
        <div className="grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-up">
            <Badge tone="brand" className="mb-5">
              Built for cleaning businesses in Upstate New York
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Run your cleaning business from{" "}
              <span className="text-brand-600">one tidy place</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-600">
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
            <p className="mt-4 text-sm text-slate-500">
              Free 14-day trial · No credit card required · Cancel anytime
            </p>
          </div>

          {/* Illustrative product preview — sample data, not a screenshot */}
          <div className="animate-fade-in">
            <div
              aria-hidden="true"
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-brand-600/5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Today&apos;s schedule
                  </p>
                  <p className="text-xs text-slate-500">
                    Thursday · {sampleJobs.length} jobs scheduled
                  </p>
                </div>
                <Badge tone="accent">2 new quote requests</Badge>
              </div>
              <ul className="divide-y divide-slate-100">
                {sampleJobs.map((job) => (
                  <li key={job.customer} className="flex items-center gap-4 py-4">
                    <div className="w-16 shrink-0 text-sm font-semibold text-slate-700">
                      {job.time}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {job.customer}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {job.address} · {job.crew}
                      </p>
                    </div>
                    <JobStatusPill status={job.status} />
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                <p className="text-sm text-slate-600">Outstanding invoices</p>
                <p className="text-sm font-bold text-slate-900">$1,240.00</p>
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-slate-400">
              Illustrative preview — sample data shown
            </p>
          </div>
        </div>

        <div className="border-t border-slate-200 py-8">
          <p className="text-center text-xs font-semibold tracking-widest text-slate-400 uppercase">
            Set your service area anywhere — for example
          </p>
          <p className="mt-3 text-center text-sm font-medium text-slate-500">
            {site.cities.join("  ·  ")}
          </p>
        </div>
      </Container>
    </section>
  );
}
