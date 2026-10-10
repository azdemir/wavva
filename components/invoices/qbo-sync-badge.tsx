import { getTranslations } from "next-intl/server";
import type { InvoiceSyncStatus } from "@/lib/quickbooks/sync";

/**
 * Small "QB" sync badge for invoices. Rendered only when the company has an
 * active QuickBooks connection; the parent page decides that via
 * getQboBadgeMap / getInvoiceSyncStatus.
 */
export async function QboSyncBadge({ status }: { status: InvoiceSyncStatus }) {
  if (status === "not_connected") return null;
  const t = await getTranslations("invoices");
  const styles: Record<Exclude<InvoiceSyncStatus, "not_connected">, string> = {
    synced:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    unsynced: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
    failed: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  };
  const labels: Record<Exclude<InvoiceSyncStatus, "not_connected">, string> = {
    synced: t("quickbooks.synced"),
    unsynced: t("quickbooks.unsynced"),
    failed: t("quickbooks.failed"),
  };
  return (
    <span
      title={t("quickbooks.title")}
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
