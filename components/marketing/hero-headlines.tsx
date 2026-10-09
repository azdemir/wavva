"use client";

import { useEffect, useState } from "react";

const STATIC_LINE = "Run your cleaning business";
const DYNAMIC_LINES = [
  "from one tidy place.",
  "without missed calls.",
  "that follows up for you.",
];

// Tallest dynamic phrase — reserved as invisible text so the rotating
// line never shifts the layout below it.
const TALLEST = "that follows up for you.";

/**
 * Two-line hero headline, mortgage-sample style:
 * first line static in ink, second line cycling in brand blue.
 * Soft fade cycling; prefers-reduced-motion shows the first line statically.
 */
export function HeroHeadlines() {
  const [index, setIndex] = useState(0);
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    if (mq.matches) {
      return () => mq.removeEventListener("change", onChange);
    }
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % DYNAMIC_LINES.length);
    }, 4500);
    return () => {
      clearInterval(t);
      mq.removeEventListener("change", onChange);
    };
  }, []);

  const staticLine = (
    <span className="block text-slate-900 dark:text-slate-50">
      {STATIC_LINE}
    </span>
  );

  if (reduced) {
    return (
      <h1 className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">
        {staticLine}
        <span className="block text-brand-600 dark:text-brand-400">
          {DYNAMIC_LINES[0]}
        </span>
      </h1>
    );
  }

  return (
    <h1 className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">
      {staticLine}
      <span
        className="relative block text-brand-600 dark:text-brand-400"
        aria-live="polite"
      >
        {/* Reserve height for the tallest phrase to avoid layout shift */}
        <span className="invisible block" aria-hidden="true">
          {TALLEST}
        </span>
        {DYNAMIC_LINES.map((line, i) => (
          <span
            key={line}
            aria-hidden={i !== index}
            className={`absolute inset-0 transition-all duration-700 ease-out ${
              i === index
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-4 opacity-0"
            }`}
          >
            {line}
          </span>
        ))}
        <span className="sr-only">{DYNAMIC_LINES[index]}</span>
      </span>
    </h1>
  );
}
