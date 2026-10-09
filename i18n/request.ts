import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  NAMESPACES,
  parseLocale,
  type Locale,
} from "./config";

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  for (const [key, value] of Object.entries(source)) {
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      typeof target[key] === "object" &&
      target[key] !== null &&
      !Array.isArray(target[key])
    ) {
      target[key] = deepMerge(
        target[key] as Record<string, unknown>,
        value as Record<string, unknown>
      );
    } else {
      target[key] = value;
    }
  }
  return target;
}

async function loadMessages(locale: Locale) {
  const merged: Record<string, unknown> = {};
  for (const ns of NAMESPACES) {
    try {
      const mod = await import(`../messages/${locale}/${ns}.json`);
      merged[ns] = (mod as { default: unknown }).default;
    } catch {
      // Namespace file missing for this locale — fall back to English below.
    }
  }
  if (locale !== DEFAULT_LOCALE) {
    // Fill any gaps from English so a partially-translated locale never
    // renders raw keys.
    for (const ns of NAMESPACES) {
      if (merged[ns] === undefined) {
        try {
          const mod = await import(`../messages/${DEFAULT_LOCALE}/${ns}.json`);
          merged[ns] = (mod as { default: unknown }).default;
        } catch {
          // ignore
        }
      } else {
        try {
          const mod = await import(`../messages/${DEFAULT_LOCALE}/${ns}.json`);
          merged[ns] = deepMerge(
            structuredClone((mod as { default: Record<string, unknown> }).default),
            merged[ns] as Record<string, unknown>
          );
        } catch {
          // ignore
        }
      }
    }
  }
  return merged;
}

export default getRequestConfig(async () => {
  const store = await cookies();
  const locale = parseLocale(store.get(LOCALE_COOKIE)?.value);
  return {
    locale,
    messages: await loadMessages(locale),
  };
});
