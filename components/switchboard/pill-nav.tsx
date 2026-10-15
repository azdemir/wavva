"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { WavvaLogo } from "./logo";
import { SbButton } from "./buttons";

const DROPDOWN_LINKS = [
  { href: "#how", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQs" },
  { href: "/contact", label: "Contact" },
];

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/** Floating pill nav — hides on scroll down, returns on scroll up. */
export function PillNav({ signedIn = false }: { signedIn?: boolean }) {
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open ]);

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center transition-transform duration-500 ${
        hidden ? "-translate-y-[130%]" : "translate-y-0"
      }`}
    >
      <div className="pointer-events-auto flex items-center gap-7 rounded-full border border-white/90 bg-white/85 py-2.5 pl-6 pr-3 shadow-[0_18px_46px_rgba(20,20,43,0.13)] backdrop-blur-xl">
        <Link href="/" aria-label="Wavva home">
          <WavvaLogo />
        </Link>
        <nav className="hidden items-center gap-6 lg:flex">
          <div
            ref={menuRef}
            className="relative"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
          >
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="font-sb flex items-center gap-1.5 text-sm font-semibold text-sb-ink2 transition-colors hover:text-sb-violet-dark"
            >
              Features
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              />
            </button>
            <div
              className={`absolute left-1/2 top-full z-50 w-52 -translate-x-1/2 pt-3 transition-all duration-200 ${
                open
                  ? "pointer-events-auto translate-y-0 opacity-100"
                  : "pointer-events-none -translate-y-1 opacity-0"
              }`}
            >
              <div className="rounded-2xl border border-white/90 bg-white/95 p-2 shadow-[0_18px_46px_rgba(20,20,43,0.16)] backdrop-blur-xl">
                {DROPDOWN_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="font-sb block rounded-xl px-4 py-2.5 text-sm font-semibold text-sb-ink2 transition-colors hover:bg-sb-violet/10 hover:text-sb-violet-dark"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <Link
            href={signedIn ? "/dashboard" : "/signin"}
            className="font-sb text-sm font-semibold text-sb-ink2 transition-colors hover:text-sb-violet-dark"
          >
            {signedIn ? "Dashboard" : "Sign in"}
          </Link>
        </nav>
        <SbButton href="/#trial" size="sm" magnetic={false}>
          Start free trial
        </SbButton>
      </div>
    </div>
  );
}
