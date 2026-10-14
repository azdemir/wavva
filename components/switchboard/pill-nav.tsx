"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SwitchboardLogo } from "./logo";
import { SbButton } from "./buttons";

const LINKS = [
  { href: "/features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQs" },
  { href: "/contact", label: "Contact" },
];

/**
 * Morphing nav — compact floating pill at the top of the page,
 * expands to a full-width bar once the user scrolls.
 */
export function PillNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 z-50 flex transition-all duration-500 ${
        scrolled ? "justify-stretch" : "justify-center px-4 pt-4"
      }`}
    >
      <div
        className={`pointer-events-auto flex items-center backdrop-blur-xl transition-all duration-500 ${
          scrolled
            ? "w-full justify-between border-b border-sb-line bg-white/92 px-5 py-3 shadow-[0_10px_36px_rgba(20,20,43,0.10)] sm:px-8"
            : "gap-7 rounded-full border border-white/90 bg-white/85 py-2.5 pl-6 pr-3 shadow-[0_18px_46px_rgba(20,20,43,0.13)]"
        }`}
      >
        <Link href="/" aria-label="Switchboard home" className="shrink-0">
          <SwitchboardLogo />
        </Link>
        <nav
          className={`hidden items-center gap-6 lg:flex ${
            scrolled ? "flex-1 justify-center" : ""
          }`}
        >
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-sb text-sm font-semibold text-sb-ink2 transition-colors hover:text-sb-violet-dark"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <SbButton href="/#trial" size="sm" magnetic={false} className="shrink-0">
          Start free trial
        </SbButton>
      </div>
    </div>
  );
}
