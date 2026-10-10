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
