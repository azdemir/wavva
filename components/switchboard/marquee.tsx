import { VERTICALS } from "./copy";

/**
 * Infinite marquee of business verticals.
 *
 * Seamless loop: the track holds two identical halves, each ending with a
 * trailing `pr-4` so both halves are exactly the same width — translating
 * -50% lands pixel-perfect with no jump (a plain `gap` on the whole track
 * is off by half a gap per loop).
 */
export function Marquee() {
  return (
    <section
      aria-label="Businesses Wavva answers calls for"
      className="relative overflow-hidden bg-white py-14"
    >
      {/* Edge fades — pills glide in/out instead of popping at the edges */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-28 bg-gradient-to-r from-white via-white/70 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-28 bg-gradient-to-l from-white via-white/70 to-transparent"
      />
      <div className="sb-marquee flex w-max">
        {[0, 1].map((half) => (
          <div
            key={half}
            aria-hidden={half === 1}
            className="flex shrink-0 items-center gap-4 pr-4"
          >
            {VERTICALS.map((v) => (
              <span
                key={v}
                className="inline-flex items-center gap-2.5 whitespace-nowrap rounded-full border border-sb-ink/10 bg-gradient-to-b from-white to-sb-bg2 px-6 py-3 font-sb text-sm font-bold text-sb-ink2 shadow-[0_1px_2px_rgba(28,20,60,0.06)]"
              >
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full bg-sb-violet"
                />
                {v}
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
