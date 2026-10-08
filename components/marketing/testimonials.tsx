import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Badge } from "@/components/ui/badge";

/**
 * Clearly labeled placeholders — real customer stories will replace these
 * after the pilot program. No reviews are invented.
 */
const placeholders = [
  {
    quote:
      "We're piloting TidyPro with cleaning companies now. The first real owner stories will appear here.",
  },
  {
    quote:
      "Placeholder for a customer story — no review has been written or collected yet.",
  },
  {
    quote:
      "Placeholder for a customer story — no performance claims are made until real customers report them.",
  },
];

export function Testimonials() {
  return (
    <section id="stories" className="scroll-mt-20 bg-slate-50 py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Customer stories"
          title="Loved by cleaning businesses"
          description="Real stories from real owners — coming soon."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {placeholders.map((p, i) => (
            <figure
              key={i}
              className="flex flex-col rounded-xl border-2 border-dashed border-slate-300 bg-white p-6"
            >
              <Badge tone="slate" className="mb-4 self-start">
                Placeholder
              </Badge>
              <blockquote className="flex-1 text-sm leading-relaxed text-slate-500 italic">
                “{p.quote}”
              </blockquote>
              <figcaption className="mt-4 text-sm font-medium text-slate-400">
                — Name withheld until pilot completes
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
