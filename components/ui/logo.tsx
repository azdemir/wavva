type LogoMarkProps = {
  className?: string;
};

/**
 * TidyPro brand mark — a geometric "T" in white on a deep-blue squircle,
 * with the crossbar dissolving into a four-point sparkle (tidy + shine).
 * Pure vector: crisp from 16px favicon to billboard.
 */
export function LogoMark({ className = "h-8 w-8" }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="tidypro-mark-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1e40af" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#tidypro-mark-bg)" />
      {/* T stem */}
      <rect x="27" y="22" width="10" height="28" rx="5" fill="#ffffff" />
      {/* T crossbar */}
      <rect x="14" y="14" width="30" height="10" rx="5" fill="#ffffff" />
      {/* Sparkle the crossbar dissolves into */}
      <path
        d="M44 8 C44.8 14.5 46.5 16.8 55 19 C46.5 21.2 44.8 23.5 44 30 C43.2 23.5 41.5 21.2 33 19 C41.5 16.8 43.2 14.5 44 8 Z"
        fill="#ffffff"
      />
    </svg>
  );
}

type LogoProps = {
  className?: string;
  markClassName?: string;
};

/** Full lockup: mark + wordmark. */
export function Logo({ className = "", markClassName = "h-8 w-8" }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className={markClassName} />
      <span className="text-lg font-bold tracking-tight text-slate-900">
        Tidy<span className="text-brand-600">Pro</span>
      </span>
    </span>
  );
}
