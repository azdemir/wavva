"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/components/ui/use-reduced-motion";

/**
 * Two-line hero headline in the editorial serif:
 * the static line sits in ink, the rotating line cycles beneath it with a
 * blue→mint gradient. A soft fade carries the rotation; prefers-reduced-motion
 * pins the first line and drops the animation entirely.
 *
 * Copy arrives from the Studio CMS as props, with code defaults so the
 * component still renders standalone.
 *
 * SEO note: the visible artwork is aria-hidden and the real <h1> carries a
 * single clean sentence — crawlers and screen readers never see the rotating
 * variants concatenated into nonsense.
 */
export function HeroHeadlines({
  staticLine: staticText = "Run your cleaning business",
  dynamicLines: dynamicTexts = [
    "from one tidy place.",
    "without the missed calls.",
    "on autopilot, finally.",
  ],
}: {
  staticLine?: string;
  dynamicLines?: string[];
}) {
  const lines =
    dynamicTexts.length > 0 ? dynamicTexts : ["from one tidy place."];

  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % lines.length);
    }, 4600);
    return () => clearInterval(t);
  }, [lines.length, reduced]);

  const cleanHeadline = `${staticText} ${lines[0]}`;

  const shell =
    "font-display text-[2.75rem] leading-[0.94] tracking-[-0.03em] text-balance sm:text-6xl lg:text-[4.25rem]";

  /* The gradient must live on each line, NOT on their shared parent:
     `background-clip: text` clips the parent's background to the glyphs of
     every descendant, so all rotating phrases would be painted at once and
     the inactive ones would stay visible regardless of their opacity. */
  const gradientLine =
    "bg-gradient-to-r from-brand-600 via-brand-500 to-accent-500 bg-clip-text text-transparent dark:from-brand-300 dark:via-brand-300 dark:to-accent-300";

  const lineClass = (active: boolean) =>
    `transition-[opacity,transform,filter] duration-[900ms] ease-expo ${
      active
        ? "translate-y-0 opacity-100 blur-0"
        : "pointer-events-none translate-y-5 opacity-0 blur-[3px]"
    }`;

  if (reduced) {
    return (
      <>
        <h1 className="sr-only">{cleanHeadline}</h1>
        <div aria-hidden="true" className={shell}>
          <span className="block text-ink">{staticText}</span>
          <span className={`mt-1 block italic ${gradientLine}`}>{lines[0]}</span>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="sr-only">{cleanHeadline}</h1>
      <div aria-hidden="true" className={shell}>
        <span className="block text-ink">{staticText}</span>
        {/* Every phrase occupies the same grid cell, so the box is always as
            tall as the tallest one and the copy below never shifts — no
            measuring, no spacer, and wrapping is handled for free. */}
        <span className="mt-1 grid italic">
          {lines.map((line, i) => (
            <span
              key={line}
              className={`[grid-area:1/1] ${gradientLine} ${lineClass(i === index)}`}
            >
              {line}
            </span>
          ))}
        </span>
      </div>
    </>
  );
}