"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SwitchboardLogo } from "./logo";
import { SbButton } from "./buttons";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQs" },
  { href: "/contact", label: "Contact" },
];

/** Floating pill nav — hides on scroll down, returns on scroll up. */
export function PillNav() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = 0;
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > 420 && y > last);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center transition-transform duration-500 ${
        hidden ? "-translate-y-[130%]" : "translate-y-0"
      }`}
    >
      <div className="pointer-events-auto flex items-center gap-7 rounded-full border border-white/90 bg-white/85 py-2.5 pl-6 pr-3 shadow-[0_18px_46px_rgba(20,20,43,0.13)] backdrop-blur-xl">
        <Link href="/" aria-label="Switchboard home">
          <SwitchboardLogo />
        </Link>
        <nav className="hidden items-center gap-6 lg:flex">
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
        <SbButton href="/#trial" size="sm" magnetic={false}>
          Start free trial
        </SbButton>
      </div>
    </div>
  );
}
