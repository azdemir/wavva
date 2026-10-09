import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/marketing/reveal";
import { CheckIcon, MapPinIcon } from "@/components/ui/icons";
import { getContent } from "@/lib/studio/content";

export type Proof = { title: string; body: string };
export type Stat = { value: string; label: string };

/**
 * The persuasion band directly under the hero: hard numbers, then the four
 * reasons we beat the big platforms, then a slow marquee of service cities.
 */
export async function ProofStrip() {
  const [proofs, stats, cities] = await Promise.all([
    getContent<Proof[]>("home.proofs"),
    getContent<Stat[]>("home.stats.items"),
    getContent<string[]>("site.cities"),
  ]);

  const marqueeCities = [...cities, ...cities];

  return (
    <section className="relative border-y border-line bg-surface-2">
      <Container>
        {/* Headline numbers ------------------------------------------------ */}
        {stats.length > 0 && (
          <Reveal className="grid grid-cols-2 lg:grid-cols-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`px-2 py-8 text-center sm:px-6 ${
                  i < 2 ? "border-b border-line lg:border-b-0" : ""
                } ${i % 2 === 1 ? "border-l border-line lg:border-l-0" : ""}`}
              >
                <p className="font-display text-4xl leading-none tracking-[-0.02em] text-ink sm:text-5xl">
                  {s.value}
                </p>
                <p className="mt-2.5 text-sm text-ink-3">{s.label}</p>
              </div>
            ))}
          </Reveal>
        )}

        {/* Why-us cards ---------------------------------------------------- */}
        <Reveal
          delay={80}
          className="mt-10 mb-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:mt-14 lg:grid-cols-4"
        >
          {proofs.map((item) => (
            <div key={item.title} className="group bg-surface p-6 sm:p-7">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent-100 text-accent-700 transition-transform duration-300 group-hover:scale-110 dark:bg-accent-950 dark:text-accent-400">
                <CheckIcon className="h-4 w-4" />
              </span>
              <h3 className="mt-4 text-[0.9375rem] leading-snug font-semibold text-balance text-ink">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-3">
                {item.body}
              </p>
            </div>
          ))}
        </Reveal>
      </Container>

      {/* Service-area marquee -------------------------------------------- */}
      {cities.length > 0 && (
        <div className="relative flex items-center gap-4 overflow-hidden border-t border-line py-4">
          <p className="z-10 flex shrink-0 items-center gap-2 bg-surface-2 pr-4 pl-5 font-mono text-[11px] tracking-[0.14em] text-ink-3 uppercase sm:pl-8 lg:pl-10">
            <MapPinIcon className="h-3.5 w-3.5" />
            Now serving
          </p>
          <div
            className="pointer-events-none flex min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]"
            aria-hidden="true"
          >
            <div className="flex w-max shrink-0 items-center gap-8 pr-8 animate-marquee-slow motion-reduce:animate-none">
              {marqueeCities.map((city, i) => (
                <span
                  key={`${city}-${i}`}
                  className="font-display text-lg whitespace-nowrap text-ink-3/80"
                >
                  {city}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}