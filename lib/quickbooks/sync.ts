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
