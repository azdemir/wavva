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

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

function NavLinks({ centered = false }: { centered?: boolean }) {
  return (
    <nav
      className={`hidden items-center gap-6 lg:flex ${
        centered ? "flex-1 justify-center" : ""
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
  );
}

/**
 * Cross-fading nav — compact floating pill at the top of the page,
 * full-width bar once the user scrolls. Opacity + transform only,
 * so the switch is butter-smooth with no layout jank.
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
    <div className="fixed inset-x-0 top-0 z-50">
      {/* Compact pill — visible at the very top */}
      <div
        className={`flex justify-center px-4 pt-4 transition-all duration-500 ${EASE} ${
          scrolled
            ? "pointer-events-none -translate-y-3 opacity-0"
            : "translate-y-0 opacity-100"
        }`}
      >
        <div className="flex items-center gap-7 rounded-full border border-white/90 bg-white/85 py-2.5 pl-6 pr-3 shadow-[0_18px_46px_rgba(20,20,43,0.13)] backdrop-blur-xl">
          <Link href="/" aria-label="Switchboard home">
            <SwitchboardLogo />
          </Link>
          <NavLinks />
          <SbButton href="/#trial" size="sm" magnetic={false}>
            Start free trial
          </SbButton>
        </div>
      </div>

      {/* Full-width bar — fades in on scroll, no border line */}
      <div
        className={`absolute inset-x-0 top-0 transition-all duration-500 ${EASE} ${
          scrolled
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-3 opacity-0"
        }`}
      >
        <div className="flex w-full items-center justify-between bg-white/92 px-5 py-3 shadow-[0_10px_36px_rgba(20,20,43,0.10)] backdrop-blur-xl sm:px-8">
          <Link href="/" aria-label="Switchboard home" className="shrink-0">
            <SwitchboardLogo />
          </Link>
          <NavLinks centered />
          <SbButton href="/#trial" size="sm" magnetic={false} className="shrink-0">
            Start free trial
          </SbButton>
        </div>
      </div>
    </div>
  );
}
