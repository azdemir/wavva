type LogoMarkProps = {
  className?: string;
};

/**
 * Wavva brand mark — waveform bars tracing a W: voice, visualized.
 * Pure vector: crisp from 16px favicon to billboard.
 */
export function LogoMark({ className = "h-8 w-8" }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 137 96" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="wavva-mark-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b7cff" />
          <stop offset="1" stopColor="#5b3df0" />
        </linearGradient>
      </defs>
      <rect x="6" y="14" width="11" height="68" rx="5.5" fill="url(#wavva-mark-g)" />
      <rect x="25" y="25" width="11" height="46" rx="5.5" fill="url(#wavva-mark-g)" />
      <rect x="44" y="33" width="11" height="30" rx="5.5" fill="url(#wavva-mark-g)" />
      <rect x="63" y="21" width="11" height="54" rx="5.5" fill="url(#wavva-mark-g)" />
      <rect x="82" y="33" width="11" height="30" rx="5.5" fill="url(#wavva-mark-g)" />
      <rect x="101" y="25" width="11" height="46" rx="5.5" fill="url(#wavva-mark-g)" />
      <rect x="120" y="14" width="11" height="68" rx="5.5" fill="url(#wavva-mark-g)" />
    </svg>
  );
}

type LogoProps = {
  className?: string;
  markClassName?: string;
  /** Override the wordmark. Defaults to Wavva. */
  wordmark?: string;
};

/** Full lockup: mark + wordmark. */
export function Logo({ className = "", markClassName = "h-8 w-8", wordmark }: LogoProps) {
  const name = wordmark?.trim() || "Wavva";
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className={markClassName} />
      <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
        {name}
      </span>
    </span>
  );
}
