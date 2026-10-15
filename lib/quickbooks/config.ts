/**
 * QuickBooks Online integration config.
 * The OAuth connect/callback flow is deferred until the Intuit Developer app
 * exists (see the integration spec). Until then `isQuickBooksConfigured()`
 * is false and all sync entry points no-op gracefully.
 */

export type QboEnvironment = "sandbox" | "production";

export function qboEnvironment(): QboEnvironment {
  return process.env.QBO_ENVIRONMENT === "production" ? "production" : "sandbox";
}

export function isQuickBooksConfigured(): boolean {
  return Boolean(
    process.env.QBO_CLIENT_ID &&
      process.env.QBO_CLIENT_SECRET &&
      process.env.QBO_REDIRECT_URI &&
      process.env.QBO_TOKEN_KEY,
  );
}

/** Base URL for the QuickBooks v3 Accounting API for one company (realm). */
export function qboApiBase(realmId: string): string {
  const host =
    qboEnvironment() === "production"
      ? "https://quickbooks.api.intuit.com"
      : "https://sandbox-quickbooks.api.intuit.com";
  return `${host}/v3/company/${realmId}`;
}

export const QBO_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
export const QBO_REVOKE_URL = "https://developer.api.intuit.com/v2/oauth2/tokens/revoke";

/** API minor version we code against. Bump deliberately, never implicitly. */
export const QBO_MINOR_VERSION = 75;

/** Default service Item name created in QBO for TidyPro line items. */
export function qboDefaultItemName(): string {
  return process.env.QBO_DEFAULT_ITEM_NAME || "Cleaning services";
}
