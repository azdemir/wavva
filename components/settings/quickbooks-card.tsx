import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import { getQuickBooksStatus } from "@/lib/actions/quickbooks";
import { QuickBooksButtons } from "./quickbooks-buttons";

/**
 * Settings → QuickBooks integration card.
 * OAuth is deferred until the Intuit Developer app exists, so the card has
 * three states: upgrade prompt (non-Pro), setup-pending (Pro, no Intuit app
 * yet), and connected (once OAuth lands and a company connects).
 */
export async function QuickBooksCard() {
  const t = await getTranslations("settings");
  const status = await getQuickBooksStatus();

  if (!status.planAllows) {
    return <UpgradePrompt feature="quickbooks" />;
  }

  return (
    <Card>
      <CardContent className="py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              {t("quickbooks.title")}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t("quickbooks.description")}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
              status.connected
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
            }`}
          >
            {status.connected ? t("quickbooks.connected") : t("quickbooks.setupPending")}
          </span>
        </div>

        <ul className="mt-4 space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
          <li>• {t("quickbooks.bulletCustomers")}</li>
          <li>• {t("quickbooks.bulletInvoices")}</li>
          <li>• {t("quickbooks.bulletPayments")}</li>
        </ul>

        <div className="mt-5">
          <QuickBooksButtons
            connected={status.connected}
            configured={status.configured}
            companyName={status.companyName}
            lastSyncAt={status.lastSyncAt}
          />
        </div>
      </CardContent>
    </Card>
  );
}
