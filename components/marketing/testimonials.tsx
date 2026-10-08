import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

/**
 * SAMPLE testimonials — fictional companies written for the pre-launch
 * landing page. Replace with real pilot customer stories once collected.
 */
const stories = [
  {
    quote:
      "We switched from a per-user platform that kept raising our bill every time we hired. TidyPro's flat pricing alone sold us — then the quote follow-up started booking jobs we'd written off.",
    name: "Maria Santos",
    role: "Owner, Spotless Home Cleaning",
    city: "Albany, NY",
    initials: "MS",
  },
  {
    quote:
      "The automated quote follow-up is unreal. I send a quote in the morning and by the afternoon half of them have booked themselves. I used to lose those jobs to silence.",
    name: "James Carter",
    role: "Owner, Carter Commercial Clean",
    city: "Syracuse, NY",
    initials: "JC",
  },
  {
    quote:
      "My cleaners actually use the mobile app — that never happened with our old software. Checklists, job notes, everything's just there. Training a new hire takes an afternoon now.",
    name: "Priya Raman",
    role: "Operations Manager, FreshNest Maids",
    city: "Rochester, NY",
    initials: "PR",
  },
  {
    quote:
      "I run a two-person operation and every other tool felt built for a 50-truck franchise. TidyPro feels like it was designed for exactly my size — simple where I need it, powerful where it counts.",
    name: "Dan Whitfield",
    role: "Owner, Whitfield Cleaning Co.",
    city: "Schenectady, NY",
    initials: "DW",
  },
  {
    quote:
      "Invoicing used to eat my Sundays. Now quotes turn into bookings, bookings turn into invoices, and customers pay from the portal link. I got my weekends back.",
    name: "Lisa Nguyen",
    role: "Owner, Crystal Clear Homes",
    city: "Troy, NY",
    initials: "LN",
  },
  {
    quote:
      "We tried two of the big names before this. Both charged extra for every seat and every feature that mattered. TidyPro gave us the whole toolkit on day one for less than we were paying.",
    name: "Robert Hayes",
    role: "Owner, Hayes Janitorial Services",
    city: "Utica, NY",
    initials: "RH",
  },
];

export function Testimonials() {
  return (
    <section id="stories" className="scroll-mt-20 bg-slate-50 dark:bg-slate-900 py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Customer stories"
          title="Loved by cleaning businesses"
          description="Owners who switched to TidyPro and never looked back."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stories.map((s) => (
            <figure
              key={s.name}
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-4 flex gap-1" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    className="h-4 w-4 text-amber-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
                  </svg>
                ))}
              </div>
              <blockquote className="flex-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                “{s.quote}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                  aria-hidden="true"
                >
                  {s.initials}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                    {s.name}
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    {s.role} · {s.city}
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
