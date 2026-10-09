import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/marketing/reveal";
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

/** Rotating avatar gradients so the row never looks like a placeholder grid. */
const AVATARS = [
  "from-brand-400 to-brand-700",
  "from-accent-400 to-accent-700",
  "from-amber-300 to-amber-500",
  "from-violet-400 to-violet-700",
  "from-cyan-400 to-cyan-700",
  "from-rose-400 to-rose-700",
];

function Stars() {
  return (
    <div className="mb-5 flex gap-1" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className="h-3.5 w-3.5 text-amber-400"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </div>
  );
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
    <section
      id="stories"
      className="scroll-mt-24 bg-surface py-24 sm:py-28 lg:py-32"
    >
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={eyebrow}
            title={title}
            description={description}
          />
        </Reveal>

        <div className="mt-14 grid items-start gap-5 md:grid-cols-2 lg:grid-cols-3">
          {stories.map((s, i) => (
            <Reveal
              as="article"
              key={s.name}
              delay={i * 70}
              // min-w-0: grid items default to min-width:auto, so a long
              // nowrap line inside can dictate the track width and blow out
              // the page on small screens.
              className="min-w-0 rounded-2xl border border-line bg-surface p-7 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-34px_rgba(15,23,42,0.45)]"
            >
              <Stars />
              <blockquote className="text-sm leading-relaxed text-pretty text-ink-2">
                “{s.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-5">
                <span
                  className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white ${AVATARS[i % AVATARS.length]}`}
                  aria-hidden="true"
                >
                  {initials(s.name).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">
                    {s.name}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-pretty text-ink-3">
                    {s.role} · {s.city}
                  </span>
                </span>
              </figcaption>
            </Reveal>
          ))}
        </div>

        {disclaimer && (
          <p className="mt-10 text-center text-xs text-ink-3">{disclaimer}</p>
        )}
      </Container>
    </section>
  );
}