import { NarrowContainer } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/marketing/reveal";
import { getContent } from "@/lib/studio/content";

export type FaqItem = { q: string; a: string };

export async function Faq() {
  const [eyebrow, title, description, faqs] = await Promise.all([
    getContent<string>("home.faq.eyebrow"),
    getContent<string>("home.faq.title"),
    getContent<string>("home.faq.description"),
    getContent<FaqItem[]>("site.faqs"),
  ]);
  return (
    <section
      id="faq"
      className="scroll-mt-24 bg-surface-2 py-24 sm:py-28 lg:py-32"
    >
      <NarrowContainer>
        <Reveal>
          <SectionHeading
            eyebrow={eyebrow}
            title={title}
            description={description}
          />
        </Reveal>

        <Reveal
          delay={80}
          className="mt-14 overflow-hidden rounded-2xl bg-surface shadow-[0_24px_60px_-34px_rgba(15,23,42,0.3)]"
        >
          {faqs.map((f, i) => (
            <details
              key={f.q}
              name="faq"
              className={`group px-6 open:bg-surface-2/70 sm:px-7 ${
                i > 0 ? "border-t border-line" : ""
              }`}
            >
              {/* min-h-12 keeps the whole row tappable, not just the text. */}
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-6 py-3 text-left text-[0.9375rem] font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {f.q}
                <span
                  aria-hidden="true"
                  className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line text-ink-3 transition-all duration-300 group-open:rotate-45 group-open:border-brand-300 group-open:bg-brand-50 group-open:text-brand-700 dark:group-open:border-brand-700 dark:group-open:bg-brand-950 dark:group-open:text-brand-300"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </summary>
              <p className="max-w-2xl pb-5 text-sm leading-relaxed text-pretty text-ink-2">
                {f.a}
              </p>
            </details>
          ))}
        </Reveal>
      </NarrowContainer>
    </section>
  );
}