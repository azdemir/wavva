"use client";

/**
 * Hero "effortless" card — a small frosted-glass floating card that answers
 * the visitor's unspoken objection ("will I be able to use this?") with
 * quiet confidence: a magic-wand mark, "No tech skills required",
 * "Up and running in minutes".
 *
 * Deliberately NOT a starburst sticker: premium products whisper, they
 * don't shout. Decorative (the trial note carries the message for AT).
 */
export function HeroBadge({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    >
      <div className="motion-safe:animate-hero-badge-float">
        <div className="flex items-center gap-3 rounded-2xl bg-white/85 py-3 pr-5 pl-3 shadow-[0_16px_40px_-12px_rgba(15,40,90,0.35)] ring-1 ring-slate-900/10 backdrop-blur-xl dark:bg-slate-900/85 dark:ring-white/15">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 shadow-inner">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
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
              <path d="M9.5 4.5 v1.6 M8.7 5.3 h1.6" strokeWidth="1.4" />
            </svg>
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-tight whitespace-nowrap text-slate-900 dark:text-white">
              No tech skills required
            </span>
            <span className="mt-0.5 block text-xs whitespace-nowrap text-slate-500 dark:text-slate-400">
              Up and running in minutes
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
