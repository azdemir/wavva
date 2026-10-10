"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";
import { FEATURE_LINKS } from "./feature-links";

const linkClass =
  "block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800";

/**
 * Mobile navigation: a Menu toggle plus an expandable "Features" accordion.
 * Fully keyboard accessible — every control is a real button/link with
 * visible focus states, and the accordion uses aria-expanded + a region.
 */
export function MobileNav({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const featuresRegionId = useId();

  return (
    <div className="relative md:hidden">
      <button
        type="button"
        aria-expanded={menuOpen}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        onClick={() => setMenuOpen((v) => !v)}
        className="cursor-pointer rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:focus-visible:outline-brand-400"
      >
        {menuOpen ? "Close" : "Menu"}
      </button>

      {menuOpen && (
        <div className="absolute top-12 right-0 z-50 max-h-[70vh] w-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900">
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
                className={`h-4 w-4 text-slate-400 transition-transform ${featuresOpen ? "rotate-180" : ""}`}
              />
            </button>
            {featuresOpen && (
              <div
                id={featuresRegionId}
                role="region"
                aria-label="Feature pages"
                className="mb-1 ml-2 border-l-2 border-slate-100 pl-2 dark:border-slate-800"
              >
                {FEATURE_LINKS.map((f) => (
                  <Link
                    key={f.slug}
                    href={f.href}
                    onClick={() => setMenuOpen(false)}
                    className={`${linkClass} flex items-center gap-2.5 py-2`}
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
            <Link
              href="/#how-it-works"
              onClick={() => setMenuOpen(false)}
              className={linkClass}
            >
              How it works
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMenuOpen(false)}
              className={linkClass}
            >
              Pricing
            </Link>
            <Link
              href="/faq"
              onClick={() => setMenuOpen(false)}
              className={linkClass}
            >
              FAQ
            </Link>
            <div className="mt-2 space-y-2 border-t border-slate-200 dark:border-slate-800 pt-2">
              {children}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
