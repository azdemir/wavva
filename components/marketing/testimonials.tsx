import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { getContent } from "@/lib/studio/content";

export type Story = {
  quote: string;
  name: string;
  role: string;
  city: string;
};

/** Initials for the avatar circle, derived from the name. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
}

export async function Testimonials() {
  const [eyebrow, title, description, disclaimer, stories] = await Promise.all([
    getContent<string>("home.stories.eyebrow"),
    getContent<string>("home.stories.title"),
    getContent<string>("home.stories.description"),
    getContent<string>("home.stories.disclaimer"),
    getContent<Story[]>("home.stories.items"),
  ]);
  return (
    <section id="stories" className="scroll-mt-20 bg-slate-50 dark:bg-slate-900 py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
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
                  {initials(s.name).toUpperCase()}
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
        {disclaimer && (
          <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
            {disclaimer}
          </p>
        )}
      </Container>
    </section>
  );
}
