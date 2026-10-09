"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Sticky header shell that only materialises its border + blur once the page
 * has scrolled. At the top of the page it stays fully transparent so the hero
 * reads as one continuous canvas; a few pixels down it becomes frosted glass.
 */
export function StickyHeader({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-[background-color,border-color,backdrop-filter,box-shadow] duration-300 ${
        scrolled
          ? "border-b border-line bg-surface/80 shadow-[0_1px_0_rgba(15,23,42,0.02)] backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      {children}
    </header>
  );
}