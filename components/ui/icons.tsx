import type { SVGProps } from "react";

function Base({ children, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-6 w-6"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function SparkleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
    </Base>
  );
}

export function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </Base>
  );
}

export function QuoteIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M6 3.5h9L19.5 8v12.5h-13.5V3.5z" />
      <path d="M15 3.5V8h4.5M9.5 12h5M9.5 15.5h5" />
    </Base>
  );
}

export function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19.5c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" />
      <circle cx="16.8" cy="9" r="2.5" />
      <path d="M16.5 14.7c2.3.3 3.7 1.9 4.1 4.3" />
    </Base>
  );
}

export function CardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="M3 10h18M7 14.5h4" />
    </Base>
  );
}

export function BellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M6 9.5a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15C4.5 15 6 13.5 6 9.5z" />
      <path d="M10 19a2.2 2.2 0 0 0 4 0" />
    </Base>
  );
}

export function PortalIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="4" y="3.5" width="16" height="13" rx="2.5" />
      <path d="M9 20.5h6M12 16.5v4" />
    </Base>
  );
}

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M4.5 12.5l5 5 10-11" />
    </Base>
  );
}

export function MinusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M6 12h12" />
    </Base>
  );
}

/** Half-filled circle — "sort of, with caveats" in the comparison table. */
export function PartialIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path
        d="M12 3.5a8.5 8.5 0 0 1 0 17z"
        fill="currentColor"
        stroke="none"
      />
    </Base>
  );
}

export function ChevronDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M6 9.5l6 6 6-6" />
    </Base>
  );
}

export function PhoneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
      <path d="M10.5 18.5h3" />
    </Base>
  );
}

export function ArrowRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M4 12h15M13.5 6.5L19 12l-5.5 5.5" />
    </Base>
  );
}

export function PlayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function PauseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M8.5 5.5v13M15.5 5.5v13" strokeWidth={2.5} />
    </Base>
  );
}

export function SunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5 5l1.8 1.8M17.2 17.2L19 19M19 5l-1.8 1.8M6.8 17.2L5 19" />
    </Base>
  );
}

export function MoonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />
    </Base>
  );
}

export function MapPinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M12 21s6.5-5.6 6.5-10.5A6.5 6.5 0 0 0 5.5 10.5C5.5 15.4 12 21 12 21z" />
      <circle cx="12" cy="10.5" r="2.3" />
    </Base>
  );
}

export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M4 11l8-7 8 7" />
      <path d="M6 9.5V20h12V9.5" />
      <path d="M10 20v-5h4v5" />
    </Base>
  );
}

export function TagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M3.5 12V4.5A1 1 0 0 1 4.5 3.5H12L20.5 12a1.4 1.4 0 0 1 0 2L14 20.5a1.4 1.4 0 0 1-2 0L3.5 12z" />
      <circle cx="9" cy="9" r="1.4" />
    </Base>
  );
}

export function GearIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1z" />
    </Base>
  );
}

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M12 5v14M5 12h14" />
    </Base>
  );
}

export function DownloadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" />
    </Base>
  );
}

export function PrinterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M7 8V4h10v4M7 17H4v-7h16v7h-3M7 14h10v6H7z" />
    </Base>
  );
}

export function CameraIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M4 8h3l2-2h6l2 2h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </Base>
  );
}

export function ClockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Base>
  );
}

export function LockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </Base>
  );
}

export function ChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M2.5 20h19" />
    </Base>
  );
}

export function PlugIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M9 3.5V9M15 3.5V9" />
      <path d="M6.5 9h11v3.5a5.5 5.5 0 0 1-11 0V9z" />
      <path d="M12 18v3.5" />
    </Base>
  );
}

/**
 * Message template — a speech bubble with text lines. Used for the
 * pre-written email/SMS templates (a bell says "notification", not
 * "template").
 */
export function TemplateIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M7 5h6a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H8.5L5 19.5V17H7a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3z" />
      <path d="M8 9.5h5M8 12.5h3.2" />
    </Base>
  );
}

/**
 * Live conversation — a rounded speech bubble with three dots. Used where a
 * call is already represented by PhoneIcon and this marks the reply side.
 */
export function ChatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M20.5 11.3c0 4.1-3.8 7.4-8.5 7.4-1 0-2-.2-2.9-.5l-4.6 2.5a.5.5 0 0 1-.8-.6l.9-3.7A7.1 7.1 0 0 1 3.5 11.3C3.5 7.2 7.3 4 12 4s8.5 3.2 8.5 7.3z" />
      <path d="M9 11.4h.01M12 11.4h.01M15 11.4h.01" strokeWidth={2.4} />
    </Base>
  );
}

/**
 * Automation trigger — a solid lightning bolt. Reads instantly as
 * "fires automatically", where a clock only says "time".
 */
export function BoltIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path
        d="M13 2.5L5.5 13.5H11l-1 8 7.5-11H12l1-8z"
        fill="currentColor"
        stroke="none"
      />
    </Base>
  );
}

/**
 * Delivery channels — a paper plane. Email and SMS are how messages
 * travel; a checkmark says "done", not "channel".
 */
export function SendIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M21.5 2.5L11 13" />
      <path d="M21.5 2.5L14.5 21.5l-3.5-8.5-8.5-3.5L21.5 2.5z" />
    </Base>
  );
}

export function GamepadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="2.5" y="7" width="19" height="11" rx="5.5" />
      <path d="M7.5 10.5v4M5.5 12.5h4" />
      <circle cx="15.5" cy="11.3" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="18" cy="13.8" r="1.1" fill="currentColor" stroke="none" />
    </Base>
  );
}
