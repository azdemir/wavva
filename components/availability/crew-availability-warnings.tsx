import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { getDayStatus, fitsInsideWindows } from "@/lib/availability/conflicts";

/** "17:50" -> "5:50 PM" — crew-facing times use 12-hour format. */
function to12h(hhmm: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return hhmm;
  const h24 = parseInt(m[1], 10);
  if (h24 > 23) return hhmm;
  const suffix = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m[2]} ${suffix}`;
}

/**
 * Read-only conflict warnings for the crew assignment area: warns when an
 * assigned crew member has approved time off covering the job date, or the
 * job time falls outside their weekly availability windows. Renders nothing
 * when there are no conflicts (or migration 0017 hasn't run yet).
 */
export async function CrewAvailabilityWarnings({
  companyId,
  crew,
  dateISO,
  startHHMM,
  endHHMM,
}: {
  companyId: string;
  crew: { membershipId: string; email: string }[];
  dateISO: string;
  startHHMM: string;
  endHHMM: string;
}) {
  const t = await getTranslations("availability");

  const warnings: string[] = [];
  await Promise.all(
    crew.map(async (member) => {
      const status = await getDayStatus(companyId, member.membershipId, dateISO);
      if (!status) return;
      const approved = status.timeOff.filter((x) => x.status === "approved");
      if (approved.length > 0) {
        warnings.push(
          t("conflict.pto", {
            email: member.email,
            starts: approved[0].starts_on,
            ends: approved[0].ends_on,
          }),
        );
      } else if (!fitsInsideWindows(status.windows, startHHMM, endHHMM)) {
        if (startHHMM === endHHMM) {
          warnings.push(
            t("conflict.outsideSingle", {
              email: member.email,
              time: to12h(startHHMM),
            }),
          );
        } else {
          warnings.push(
            t("conflict.outside", {
              email: member.email,
              start: to12h(startHHMM),
              end: to12h(endHHMM),
            }),
          );
        }
      }
    }),
  );

  if (warnings.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        {t("conflict.title")}
      </p>
      {warnings.map((w, i) => (
        <Badge key={i} tone="amber" className="normal-case">
          {w}
        </Badge>
      ))}
    </div>
  );
}
