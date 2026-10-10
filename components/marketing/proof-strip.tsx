import { MapPinIcon } from "@/components/ui/icons";
import { getContent } from "@/lib/studio/content";

export type Proof = { title: string; body: string };
export type Stat = { value: string; label: string };

/**
 * Service-area marquee directly under the hero.
 *
 * (The headline stats and why-us cards that used to share this band were
 * removed on 2026-10-10.)
 */
export async function ProofStrip() {
  const cities = await getContent<string[]>("site.cities");
  const marqueeCities = [...cities, ...cities];

  return (
    <section className="relative border-y border-line bg-surface-2">
      {cities.length > 0 && (
        <div className="relative flex items-center gap-4 overflow-hidden py-4">
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
