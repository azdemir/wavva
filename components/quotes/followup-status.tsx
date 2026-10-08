import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";

/**
 * Shows the automated follow-up sequence for a quote: what's scheduled,
 * what already went out. Only rendered while relevant (sent quotes).
 */
export async function FollowupStatus({ quoteId, companyId }: { quoteId: string; companyId: string }) {
  const supabase = await createClient();
  const { data: touches } = await supabase
    .from("quote_followups")
    .select("step, scheduled_for, sent_at")
    .eq("company_id", companyId)
    .eq("quote_id", quoteId)
    .order("step");

  if (!touches || touches.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Automatic follow-ups</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {touches.map((t) => (
            <li key={t.step} className="flex min-w-0 items-center justify-between gap-3">
              <span className="min-w-0 truncate text-slate-600">
                Follow-up {t.step}
                <span className="text-slate-400">
                  {" "}· {t.sent_at ? `sent ${formatDateTime(t.sent_at)}` : `scheduled ${formatDateTime(t.scheduled_for)}`}
                </span>
              </span>
              <Badge tone={t.sent_at ? "accent" : "amber"} className="shrink-0">
                {t.sent_at ? "Sent" : "Scheduled"}
              </Badge>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          Sending stops automatically if the customer approves, declines, or the quote expires.
          Configure this in Settings.
        </p>
      </CardContent>
    </Card>
  );
}
