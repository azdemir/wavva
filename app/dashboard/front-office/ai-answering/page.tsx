import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAiAnsweringView } from "@/lib/data/ai-answering-view";
import { AiAnsweringForm } from "@/components/dashboard/front-office/ai-answering-form";

export const metadata: Metadata = {
  title: "AI Answering",
};

function formatMinutes(min: number): string {
  return `${min.toLocaleString()} min`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function AiAnsweringPage() {
  const view = await getAiAnsweringView();
  const pct = Math.min(100, Math.round((view.minutesUsed / Math.max(1, view.minutesIncluded)) * 100));
  const over = view.minutesUsed > view.minutesIncluded;
  const overageCents = over
    ? (view.minutesUsed - view.minutesIncluded) * view.overagePerMinuteCents
    : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            AI Answering
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Your AI assistant answers your business line in your company&apos;s name — quotes from
            your price list, takes booking requests, and texts you when it needs you.
          </p>
        </div>
        <Badge tone={view.voiceConfigured ? "brand" : "amber"}>
          {view.voiceConfigured ? "Voice line live" : "Voice not connected"}
        </Badge>
      </div>

      {!view.voiceConfigured && (
        <Card className="border-amber-300 dark:border-amber-800">
          <CardContent>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              Connect your voice line to go live
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER, then point the
              number&apos;s voice webhook at <code>/api/webhooks/voice</code> and its status
              callback at <code>/api/webhooks/voice/status</code>. Until then, calls are answered
              by the built-in greeting only.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Usage */}
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Minutes this month
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-bold text-slate-900 dark:text-white">
                {formatMinutes(view.minutesUsed)}
              </span>{" "}
              of {formatMinutes(view.minutesIncluded)} included ({view.planName})
            </p>
          </div>
          <div
            className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="AI-answered minutes used this month"
          >
            <div
              className={`h-full rounded-full transition-all ${over ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-brand-600"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {over ? (
              <>
                Over your included minutes — overage so far:{" "}
                <span className="font-semibold text-slate-900 dark:text-white">
                  ${(overageCents / 100).toFixed(2)}
                </span>{" "}
                at ${(view.overagePerMinuteCents / 100).toFixed(2)}/min.
              </>
            ) : pct >= 80 ? (
              <>You&apos;re at {pct}% of your included minutes. Overage is ${(view.overagePerMinuteCents / 100).toFixed(2)}/min after that.</>
            ) : (
              <>Minutes reset on the 1st. Only time the AI spends on the line counts — texts and emails are unlimited.</>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardContent>
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
            Answering settings
          </h2>
          {view.settings ? (
            <AiAnsweringForm initial={view.settings} />
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Finish the{" "}
              <a href="/dashboard/front-office/setup" className="font-medium underline">
                front office setup
              </a>{" "}
              first — the AI needs your services, prices and business line before it can answer.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent calls */}
      <Card>
        <CardContent>
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
            Recent AI-answered calls
          </h2>
          {view.recentCalls.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              No answered calls yet. Once your line is live, every call lands here with its outcome.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <th className="py-2 pr-4 font-medium">When</th>
                    <th className="py-2 pr-4 font-medium">From</th>
                    <th className="py-2 pr-4 font-medium">Length</th>
                    <th className="py-2 pr-4 font-medium">Outcome</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {view.recentCalls.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                    >
                      <td className="py-2.5 pr-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                        {formatDateTime(c.started_at)}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-900 dark:text-slate-100">
                        {c.from_number || "—"}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400">
                        {c.duration_seconds > 0
                          ? `${Math.max(1, Math.round(c.duration_seconds / 60))} min`
                          : "—"}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400">
                        {c.outcome || "—"}
                      </td>
                      <td className="py-2.5">
                        {c.escalated ? (
                          <Badge tone="amber">Owner notified</Badge>
                        ) : (
                          <Badge tone="brand">Handled</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
