"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "@/components/ui/use-reduced-motion";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger in milliseconds — useful for sibling grids. */
  delay?: number;
  /** Element to render. Defaults to a div so it composes with grids. */
  as?: "div" | "section" | "li" | "article" | "header" | "span";
};

/**
 * Reveals its children once they scroll into view.
 *
 * The content is always present in the HTML (crawlers and screen readers get
 * it immediately) — only the entrance transform is deferred, so a failed
 * hydration can never hide the page. Reduced-motion users see it instantly.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    // IntersectionObserver is baseline in every browser Next 16 supports, so
    // there's no meaningful no-observer path to guard here.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <Tag
      ref={ref as never}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as never) : undefined}
    >
      {children}
    </Tag>
  );
}