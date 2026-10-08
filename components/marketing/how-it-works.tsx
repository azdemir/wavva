import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    n: "1",
    title: "Set up your company",
    description:
      "Add your business profile, logo, services, and pricing. Define your service area by city, county, ZIP code, or radius — then invite your team and set permissions.",
  },
  {
    n: "2",
    title: "Win jobs and schedule crews",
    description:
      "Share your online quote form, approve quotes into one-time or recurring bookings, and assign cleaners with conflict warnings keeping every day realistic.",
  },
  {
    n: "3",
    title: "Get paid faster",
    description:
      "Send invoices the moment a job is done, track what's outstanding at a glance, and let customers pay online through their portal. Reminders go out automatically.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 bg-slate-50 py-20 sm:py-24"
    >
      <Container>
        <SectionHeading
          eyebrow="How it works"
          title="From first quote to paid invoice in three steps"
          description="Built for owners who are not technically experienced — if you can send a text, you can run TidyPro."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <Card key={s.n}>
              <CardContent>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">
                  {s.n}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {s.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
