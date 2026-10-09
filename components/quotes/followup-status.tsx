import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";

/**
 * Shows the automated follow-up sequence for a quote: what's scheduled,
 * what already went out. Only rendered while relevant (sent quotes).
 */
export async function FollowupStatus({ quoteId, companyId }: { quoteId: string; companyId: string }) {
  const t = await getTranslations("quotes");
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
        <CardTitle>{t("followup.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {touches.map((tch) => (
            <li key={tch.step} className="flex min-w-0 items-center justify-between gap-3">
              <span className="min-w-0 truncate text-slate-600 dark:text-slate-400 dark:text-slate-500">
                {t("followup.step", { n: tch.step })}
                <span className="text-slate-400 dark:text-slate-500">
                  {" "}· {tch.sent_at ? t("followup.sentAt", { when: formatDateTime(tch.sent_at) }) : t("followup.scheduledFor", { when: formatDateTime(tch.scheduled_for) })}
                </span>
              </span>
              <Badge tone={tch.sent_at ? "accent" : "amber"} className="shrink-0">
                {tch.sent_at ? t("followup.sent") : t("followup.scheduled")}
              </Badge>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">
          {t("followup.note")}
        </p>
      </CardContent>
    </Card>
  );
}
