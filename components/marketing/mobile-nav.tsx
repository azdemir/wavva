"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";
import { FEATURE_LINKS } from "./feature-links";

const itemBase =
  "block rounded-xl px-3.5 text-sm font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600";
const linkClass = `${itemBase} py-3`;
const subLinkClass = `${itemBase} flex items-center gap-2.5 py-2`;

const otherLinks = [
  { label: "Front Office", href: "/front-office" },
  { label: "How it works", href: "/front-office#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Compare", href: "/compare" },
  { label: "FAQ", href: "/faq" },
];

/**
 * Mobile / tablet navigation: a Menu toggle plus an expandable "Features"
 * accordion. Fully keyboard accessible — every control is a real button/link
 * with visible focus states, and the accordion uses aria-expanded + a region.
 */
export function MobileNav({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const featuresRegionId = useId();

  return (
    <div className="relative lg:hidden">
      <button
        type="button"
        aria-expanded={menuOpen}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        onClick={() => setMenuOpen((v) => !v)}
        className="flex h-10 cursor-pointer items-center gap-2 rounded-full border border-line-strong bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        {menuOpen ? "Close" : "Menu"}
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform duration-300 ${menuOpen ? "rotate-180" : ""}`}
        />
      </button>

      {menuOpen && (
        <div className="absolute top-14 right-0 z-50 max-h-[70vh] w-64 overflow-y-auto rounded-2xl border border-line bg-surface p-2 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.3)]">
          <nav aria-label="Mobile">
            <button
              type="button"
              aria-expanded={featuresOpen}
              aria-controls={featuresRegionId}
              onClick={() => setFeaturesOpen((v) => !v)}
              className={`${linkClass} flex w-full items-center justify-between`}
            >
              Features
              <ChevronDownIcon
                className={`h-4 w-4 text-ink-2 transition-transform ${featuresOpen ? "rotate-180" : ""}`}
              />
            </button>
            {featuresOpen && (
              <div
                id={featuresRegionId}
                role="region"
                aria-label="Feature pages"
                className="mb-1 ml-2 border-l-2 border-line pl-2"
              >
                {FEATURE_LINKS.map((f) => (
                  <Link
                    key={f.slug}
                    href={f.href}
                    onClick={() => setMenuOpen(false)}
                    className={subLinkClass}
                  >
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                      <f.icon className="h-4 w-4" />
                    </span>
                    <span>
                      {f.title}
                      {f.slug === "mobile-app" && (
                        <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          Soon
                        </span>
                      )}
                    </span>
                  </Link>
                ))}
              </div>
            )}
            {otherLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={linkClass}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 space-y-2 border-t border-line pt-3">
              {children}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
