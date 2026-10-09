/**
 * QuickBooks Online is not yet integrated — this flag lets callers no-op
 * safely until OAuth credentials are provisioned.
 */
export function isQuickBooksConfigured(): boolean {
  return !!(process.env.QUICKBOOKS_CLIENT_ID && process.env.QUICKBOOKS_CLIENT_SECRET);
}
