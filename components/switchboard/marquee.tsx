import { VERTICALS } from "./copy";

/** Infinite marquee of business verticals. */
export function Marquee() {
  const items = [...VERTICALS, ...VERTICALS];
  return (
    <div className="overflow-hidden bg-white py-12">
      <div className="animate-sb-mq flex w-max gap-4 hover:[animation-play-state:paused]">
        {items.map((v, i) => (
          <span
            key={`${v}-${i}`}
            className="whitespace-nowrap rounded-full border border-sb-ink/10 bg-sb-bg2 px-6 py-3 font-sb text-sm font-bold text-sb-ink2"
          >
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}
