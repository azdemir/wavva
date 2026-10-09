"use client";

import { useEffect, useState } from "react";

/**
 * Two-line hero headline, mortgage-sample style:
 * first line static in ink, second line cycling in brand blue.
 * Soft fade cycling; prefers-reduced-motion shows the first line statically.
 * Copy comes from the Studio CMS (props) with code defaults.
 */
export function HeroHeadlines({
  staticLine: staticText = "Run your cleaning business",
  dynamicLines: dynamicTexts = [
    "from one tidy place.",
    "without missed calls.",
    "that follows up for you.",
  ],
}: {
  staticLine?: string;
  dynamicLines?: string[];
}) {
  const lines =
    dynamicTexts.length > 0 ? dynamicTexts : ["from one tidy place."];
  // Reserve height for the tallest phrase so the rotating line never
  // shifts the layout below it.
  const tallest = lines.reduce((a, b) => (a.length >= b.length ? a : b));
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
      setIndex((i) => (i + 1) % lines.length);
    }, 4500);
    return () => {
      clearInterval(t);
      mq.removeEventListener("change", onChange);
    };
  }, [lines.length]);

  const staticLine = (
    <span className="block text-slate-900 dark:text-slate-50">
      {staticText}
    </span>
  );

  // SEO: crawlers and screen readers get ONE clean headline. The rotating
  // animation is purely visual (aria-hidden) so the H1 is never a jumble
  // of concatenated variants.
  const cleanHeadline = `${staticText} ${lines[0]}`;

  if (reduced) {
    return (
      <>
        <h1 className="sr-only">{cleanHeadline}</h1>
        <div
          aria-hidden="true"
          className="font-serif text-4xl font-medium tracking-tight sm:text-5xl"
        >
          {staticLine}
          <span className="block text-brand-600 dark:text-brand-400">
            {lines[0]}
          </span>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="sr-only">{cleanHeadline}</h1>
      <div
        aria-hidden="true"
        className="font-serif text-4xl font-medium tracking-tight sm:text-5xl"
      >
        {staticLine}
        <span className="relative block text-brand-600 dark:text-brand-400">
          {/* Reserve height for the tallest phrase to avoid layout shift */}
          <span className="invisible block">{tallest}</span>
          {lines.map((line, i) => (
            <span
              key={line}
              className={`absolute inset-0 transition-all duration-700 ease-out ${
                i === index
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-4 opacity-0"
              }`}
            >
              {line}
            </span>
          ))}
        </span>
      </div>
    </>
  );
}
