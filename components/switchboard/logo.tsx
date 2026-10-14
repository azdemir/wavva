/**
 * Switchboard marketing components — option-Q design system.
 * Self-contained: violet/indigo, Plus Jakarta Sans, pill radii.
 * Backend (auth, dashboard, APIs, data) stays TidyPro's.
 */
export function SwitchboardMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <circle cx="19" cy="20" r="15" fill="none" stroke="#6d5cff" strokeWidth="3.4" />
      <rect x="13.5" y="16.5" width="11" height="7" rx="3.5" fill="#6d5cff" />
      <path d="M24.5 18.2h7M24.5 21.8h7" stroke="#6d5cff" strokeWidth="3.4" strokeLinecap="round" />
    </svg>
  );
}

export function SwitchboardLogo({
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
      <SwitchboardMark className={markClassName} />
      <span
        className={`font-sb text-xl font-extrabold tracking-tight ${
          light ? "text-white" : "text-sb-ink"
        }`}
      >
        Switchboard
      </span>
    </span>
  );
}
