"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/ui/theme-provider";
import { SunIcon, MoonIcon } from "@/components/ui/icons";

/** Sun/moon switch for the nav bars. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = theme === "dark";
  // Avoid hydration mismatch: SSR and the first client render must agree on
  // the label. Only show the theme-specific label after mount.
  const label = !mounted
    ? "Toggle color theme"
    : dark
      ? "Switch to light mode"
      : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 hover:text-slate-700 sm:h-10 sm:w-10 dark:text-slate-400 dark:ring-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200 ${className}`}
    >
      {/* Placeholder until mounted so SSR and hydration agree. */}
      {!mounted ? (
        <span className="h-5 w-5" aria-hidden="true" />
      ) : dark ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
    </button>
  );
}
