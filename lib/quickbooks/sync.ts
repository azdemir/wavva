import { isQuickBooksConfigured } from "@/lib/quickbooks/config";

/**
 * Pushes an invoice to QuickBooks Online. Real sync logic lands with the
 * OAuth integration; until then this is a guarded no-op so callers can wire
 * it in ahead of time without risking the invoice save that triggers it.
 */
export async function pushInvoice(invoiceId: string): Promise<void> {
  if (!isQuickBooksConfigured()) return;
  void invoiceId;
}

/**
 * Sync status for the invoice QB badge. Real statuses land with the OAuth
 * integration; until then this guarded no-op reports "not_connected" so the
 * badge renders nothing.
 */
export type InvoiceSyncStatus =
  | "not_connected"
  | "unsynced"
  | "synced"
  | "failed";

export async function getInvoiceSyncStatus(
  companyId: string,
  invoice: { id: string; qbo_id: string | null },
): Promise<InvoiceSyncStatus> {
  void companyId;
  void invoice;
  return "not_connected";
}

/**
 * Badge statuses for a page of invoices with a single round trip.
 * Real logic lands with the OAuth integration (needs the
 * quickbooks_connections / quickbooks_sync_log tables from migration 0012);
 * until then this guarded no-op returns null so the caller renders no badges.
 */
export async function getQboBadgeMap(
  companyId: string,
  invoices: { id: string; qbo_id: string | null }[],
): Promise<Map<string, Exclude<InvoiceSyncStatus, "not_connected">> | null> {
  void companyId;
  void invoices;
  return null;
}
