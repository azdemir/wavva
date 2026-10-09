import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { CardIcon, CheckIcon } from "@/components/ui/icons";
import { isQuickBooksConfigured } from "@/lib/quickbooks/config";

export async function QuickBooksCard() {
  const t = await getTranslations("settings.quickbooks");
  const connected = isQuickBooksConfigured();

  return (
    <Card>
      <CardContent className="flex items-start gap-4 py-6">
        <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <CardIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
        </span>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-slate-900 dark:text-slate-100">{t("title")}</p>
            <span
              className={
                connected
                  ? "inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              }
            >
              {connected && <CheckIcon className="h-3 w-3" />}
              {connected ? t("connected") : t("setupPending")}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("description")}</p>
          <ul className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-400">
            <li>• {t("bulletCustomers")}</li>
            <li>• {t("bulletInvoices")}</li>
            <li>• {t("bulletPayments")}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
