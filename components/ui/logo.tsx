type LogoMarkProps = {
  className?: string;
};

/**
 * Switchboard brand mark — a switchboard plug sliding into its jack:
 * a ring (the jack) with the plug body and twin prongs.
 * Pure vector: crisp from 16px favicon to billboard.
 */
export function LogoMark({ className = "h-8 w-8" }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <circle
        cx="19"
        cy="20"
        r="15"
        fill="none"
        stroke="#6d5cff"
        strokeWidth="3.4"
      />
      <rect x="13.5" y="16.5" width="11" height="7" rx="3.5" fill="#6d5cff" />
      <path
        d="M24.5 18.2h7M24.5 21.8h7"
        stroke="#6d5cff"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

type LogoProps = {
  className?: string;
  markClassName?: string;
  /** Override the wordmark. Defaults to Switchboard. */
  wordmark?: string;
};

/** Full lockup: mark + wordmark. */
export function Logo({ className = "", markClassName = "h-8 w-8", wordmark }: LogoProps) {
  const name = wordmark?.trim() || "Switchboard";
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className={markClassName} />
      <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
        {name}
      </span>
    </span>
  );
}
