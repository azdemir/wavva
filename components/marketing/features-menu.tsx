"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";
import { FEATURE_LINKS } from "./feature-links";

const linkBase =
  "rounded-md px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:focus-visible:outline-brand-400";

/**
 * Desktop "Features" dropdown. Opens on hover (with a small grace delay so
 * moving the cursor between button and panel doesn't flicker it shut) and on
 * click, and supports full keyboard navigation per the menu-button pattern:
 * ArrowDown opens, Arrow keys move, Escape closes and refocuses the button.
 *
 * Hover-open + click can race (hover opens, then the click toggles it shut),
 * so the open source is tracked: a click only closes a menu that was opened
 * by click/keyboard, never one that hover just opened.
 */
export function FeaturesMenu() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openSource = useRef<"hover" | "click" | "keyboard" | null>(null);
  const panelId = useId();

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const doOpen = (source: "hover" | "click" | "keyboard") => {
    cancelClose();
    openSource.current = source;
    setOpen(true);
  };

  const doClose = () => {
    openSource.current = null;
    setOpen(false);
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(doClose, 120);
  };

  const closeAndRefocus = () => {
    doClose();
    buttonRef.current?.focus();
  };

  const focusItem = (index: number) => {
    const items = itemRefs.current;
    const clamped = (index + items.length) % items.length;
    items[clamped]?.focus();
  };

  // Close on outside click while open.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) doClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open ]);

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={() => {
        if (!open) doOpen("hover");
        else cancelClose();
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          // A click right after hover-open keeps the menu open (and claims
          // ownership, so a second click closes it); otherwise toggle.
          if (open && openSource.current === "hover") {
            openSource.current = "click";
            return;
          }
          if (open) doClose();
          else doOpen("click");
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape" && open) {
            e.preventDefault();
            doClose();
            return;
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            if (!open) doOpen("keyboard");
            // Focus settles after the panel renders.
            requestAnimationFrame(() => focusItem(0));
          }
        }}
        className={`${linkBase} inline-flex items-center gap-1.5`}
      >
        Features
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          id={panelId}
          role="menu"
          aria-label="Features"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              closeAndRefocus();
              return;
            }
            const current = itemRefs.current.indexOf(
              document.activeElement as HTMLAnchorElement
            );
            if (e.key === "ArrowDown") {
              e.preventDefault();
              focusItem(current + 1);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              focusItem(current - 1);
            } else if (e.key === "Home") {
              e.preventDefault();
              focusItem(0);
            } else if (e.key === "End") {
              e.preventDefault();
              focusItem(FEATURE_LINKS.length - 1);
            }
          }}
          className="absolute left-1/2 top-full z-50 mt-2 w-80 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900"
        >
          {FEATURE_LINKS.map((f, i) => (
            <Link
              key={f.slug}
              href={f.href}
              role="menuitem"
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              onClick={doClose}
              className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:focus-visible:outline-brand-400"
            >
              <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                <f.icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {f.title}
                  {f.slug === "mobile-app" && (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 align-middle text-[11px] font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Coming soon
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-[13px] leading-snug text-slate-500 dark:text-slate-400">
                  {f.blurb}
                </span>
              </span>
            </Link>
          ))}
          <div className="mt-1 border-t border-slate-100 px-3 pt-2 pb-1 dark:border-slate-800">
            <Link
              href="/features"
              onClick={doClose}
              className="text-[13px] font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              View all features →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
