/**
 * Wavva marketing mark — waveform bars tracing a W (option-Q design system).
 * Self-contained: violet gradient, Plus Jakarta Sans wordmark.
 */
export function WavvaMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 137 96" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="wavva-sw-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b7cff" />
          <stop offset="1" stopColor="#5b3df0" />
        </linearGradient>
      </defs>
      <rect x="6" y="14" width="11" height="68" rx="5.5" fill="url(#wavva-sw-g)" />
      <rect x="25" y="25" width="11" height="46" rx="5.5" fill="url(#wavva-sw-g)" />
      <rect x="44" y="33" width="11" height="30" rx="5.5" fill="url(#wavva-sw-g)" />
      <rect x="63" y="21" width="11" height="54" rx="5.5" fill="url(#wavva-sw-g)" />
      <rect x="82" y="33" width="11" height="30" rx="5.5" fill="url(#wavva-sw-g)" />
      <rect x="101" y="25" width="11" height="46" rx="5.5" fill="url(#wavva-sw-g)" />
      <rect x="120" y="14" width="11" height="68" rx="5.5" fill="url(#wavva-sw-g)" />
    </svg>
  );
}

export function WavvaLogo({
  className = "",
  markClassName = "h-8 w-8",
  light = false,
}: {
  className?: string;
  markClassName?: string;
  light?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <WavvaMark className={markClassName} />
      <span
        className={`font-sb text-xl font-extrabold tracking-tight ${
          light ? "text-white" : "text-sb-ink"
        }`}
      >
        Wavva
      </span>
    </span>
  );
}
