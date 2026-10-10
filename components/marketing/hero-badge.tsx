"use client";

/**
 * The hero's reassurance note — the answer to the visitor's unspoken
 * objection ("will I actually be able to use this?").
 *
 * Placement matters more than ever here: this used to float over the product
 * tour's lower-left corner, where it collided with the tour caption at tablet
 * widths. It now sits ABOVE the frame, in the hero's own empty margin, so it
 * decorates the composition instead of covering the UI. Hidden below `lg`,
 * where that margin doesn't exist and space is genuinely tight.
 *
 * Deliberately quiet: premium products whisper. A single line of ink with one
 * hairline-separated detail — no sticker, no badge. The trial note under the
 * buttons carries the same message for assistive tech (this is aria-hidden).
 */
export function HeroBadge({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none hidden select-none lg:block ${className}`}
    >
      <div className="motion-safe:animate-hero-badge-float">
        <div className="flex items-center gap-3 rounded-full bg-surface/85 py-2 pr-5 pl-2 shadow-[0_14px_34px_-14px_rgba(15,40,90,0.35)] ring-1 ring-black/[0.06] backdrop-blur-xl dark:bg-night-soft/85 dark:ring-white/10">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
            >
              {/* wand */}
              <path d="M6 21 L14.5 12.5" />
              {/* tip star */}
              <path
                d="M17 3.5 c.5 2.8 1.2 3.6 4 4.1 c-2.8.5 -3.5 1.3 -4 4.1 c-.5 -2.8 -1.2 -3.6 -4 -4.1 c2.8 -.5 3.5 -1.3 4 -4.1 Z"
                fill="currentColor"
                stroke="none"
              />
              {/* satellite sparkles */}
              <path d="M20.5 13.5 v2 M19.5 14.5 h2" strokeWidth="1.5" />
            </svg>
          </span>

          <span className="flex items-baseline gap-2.5 text-[0.8125rem] whitespace-nowrap">
            <span className="font-semibold tracking-tight text-ink">
              No tech skills required
            </span>
            <span aria-hidden="true" className="h-3 w-px bg-line-strong" />
            <span className="text-ink-3"></span>
          </span>
        </div>
      </div>
    </div>
  );
}