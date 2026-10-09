/**
 * Locale configuration — safe to import from client components.
 * (The request config in ./request.ts imports next/headers and is
 * server-only.)
 */

export const locales = ["en", "es", "uk"] as const;
export type Locale = (typeof locales)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "tidypro-locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Español",
  uk: "Українська",
};

export function parseLocale(value: unknown): Locale {
  return (locales as readonly string[]).includes(value as string)
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

/**
 * Message namespaces, one JSON file per locale per namespace:
 *   messages/<locale>/<namespace>.json
 */
export const NAMESPACES = [
  "common",
  "nav",
  "dashboard",
  "customers",
  "bookings",
  "quotes",
  "invoices",
  "jobs",
  "myjobs",
  "schedule",
  "team",
  "services",
  "reports",
  "billing",
  "settings",
  "communications",
  "audit",
  "onboarding",
] as const;
