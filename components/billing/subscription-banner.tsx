import Link from "next/link";
import { getTranslations } from "next-intl/server";

/**
 * Slim banner shown across the dashboard when the platform subscription
 * needs attention. Pilot-friendly: it warns but never locks anyone out.
 */
export async function SubscriptionBanner({
  status,
  planName,
}: {
  status: string;
  planName: string;
}) {
  const t = await getTranslations("common");
  if (status === "past_due" || status === "unpaid") {
    return (
      <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <span className="font-semibold">{t("subscriptionBanner.pastDueTitle", { plan: planName })}</span>{" "}
        {t("subscriptionBanner.pastDueBody")}{" "}
        <Link href="/dashboard/settings/billing" className="font-semibold underline underline-offset-2">
          {t("subscriptionBanner.goToBilling")}
        </Link>
      </div>
    );
  }
  if (status === "canceled") {
    return (
      <div className="mb-6 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
        <span className="font-semibold">{t("subscriptionBanner.canceledTitle")}</span>{" "}
        {t("subscriptionBanner.canceledBody", { plan: planName })}{" "}
        <Link href="/dashboard/settings/billing" className="font-semibold underline underline-offset-2">
          {t("subscriptionBanner.resubscribe")}
        </Link>
      </div>
    );
  }
  return null;
}
