"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { LOCALE_COOKIE, LOCALE_LABELS, locales, type Locale } from "@/i18n/config";

/**
 * Dashboard language switcher. Persists the choice in a cookie and refreshes
 * server components so every dashboard page re-renders in the new language.
 */
export function LocaleSwitcher({ className = "" }: { className?: string }) {
  const router = useRouter();
  const locale = useLocale() as Locale;

  const onChange = (value: string) => {
    if (!(locales as readonly string[]).includes(value)) return;
    document.cookie = `${LOCALE_COOKIE}=${value}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  };

  return (
    <label className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="sr-only">Language</span>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.6 3.9 5.7 3.9 9S14.5 18.4 12 21c-2.5-2.6-3.9-5.7-3.9-9S9.5 5.6 12 3Z" />
      </svg>
      <select
        value={locale}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Language"
        className="cursor-pointer rounded-lg border border-slate-200 bg-white py-1.5 pl-2 pr-7 text-sm font-medium text-slate-600 hover:border-slate-300 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600"
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {LOCALE_LABELS[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
