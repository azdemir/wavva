"use client";

import { useEffect, useState } from "react";

const HEADLINES = [
  "Run your cleaning business from one tidy place.",
  "Jobber and Housecall Pro charge per seat as you grow. TidyPro plans include your whole crew.",
  "Quotes that follow up themselves. Scheduling built for cleaning crews.",
];

/**
 * Rotating hero headlines — MortgageFlow-style soft fade cycling.
 * Respects prefers-reduced-motion (shows first headline statically).
 */
export function HeroHeadlines() {
  const [index, setIndex] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    if (mq.matches) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % HEADLINES.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  if (reduced) {
    return (
      <h1 className="font-serif text-4xl font-medium tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
        {HEADLINES[0]}
      </h1>
    );
  }

  return (
    <h1
      className="relative font-serif text-4xl font-medium tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl"
      aria-live="polite"
    >
      {/* Reserve height for the tallest headline to avoid layout shift */}
      <span className="invisible block" aria-hidden="true">
        {HEADLINES[1]}
      </span>
      {HEADLINES.map((line, i) => (
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
      <span className="sr-only">{HEADLINES[index]}</span>
    </h1>
  );
}
