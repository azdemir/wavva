import Link from "next/link";

/**
 * Slim banner shown across the dashboard when the platform subscription
 * needs attention. Pilot-friendly: it warns but never locks anyone out.
 */
export function SubscriptionBanner({
  status,
  planName,
}: {
  status: string;
  planName: string;
}) {
  if (status === "past_due" || status === "unpaid") {
    return (
      <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <span className="font-semibold">Payment issue on your {planName} plan.</span>{" "}
        Update your payment method to keep your subscription active.{" "}
        <Link href="/dashboard/settings/billing" className="font-semibold underline underline-offset-2">
          Go to billing
        </Link>
      </div>
    );
  }
  if (status === "canceled") {
    return (
      <div className="mb-6 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
        <span className="font-semibold">Your subscription was canceled.</span>{" "}
        You&apos;re on the Starter plan limits now.{" "}
        <Link href="/dashboard/settings/billing" className="font-semibold underline underline-offset-2">
          Resubscribe
        </Link>
      </div>
    );
  }
  return null;
}
