import { getTranslations } from "next-intl/server";
import { requireCompany } from "@/lib/auth";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AvailabilityEditor } from "@/components/availability/availability-editor";
import { TimeOffForm } from "@/components/availability/time-off-form";
import { TimeOffList } from "@/components/availability/time-off-list";
import { StaffAvailabilityView } from "@/components/availability/staff-availability-view";
import {
  getAvailability,
  listTimeOff,
  listAvailabilityRoster,
} from "@/lib/actions/availability";

/** Availability & PTO tracking — every role, no tier gating. */
// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export default async function AvailabilityPage() {
  const { membership } = await requireCompany();
  const t = await getTranslations("availability");
  const isStaff = membership.role === "owner" || membership.role === "manager";

  const [{ windows: ownWindows, error: windowsError }, { requests, error: requestsError }] =
    await Promise.all([
      getAvailability(membership.id),
      listTimeOff(),
    ]);

  const setupMissing = Boolean(
    windowsError === t("errors.migrationMissing") ||
      requestsError === t("errors.migrationMissing"),
  );
  if (setupMissing) {
    return (
      <div className="max-w-3xl space-y-6">
        <Heading title={t("title")} description={t("description")} />
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-amber-700 dark:text-amber-300">{t("setupHint")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isStaff) {
    // Cleaner: manage own availability, request own time off.
    return (
      <div className="max-w-3xl space-y-6">
        <Heading title={t("title")} description={t("description")} />
        <AvailabilityEditor
          membershipId={membership.id}
          initial={ownWindows}
          title={t("myAvailability")}
          description={t("myAvailabilityHint")}
        />
        <TimeOffForm mode="request" />
        <TimeOffList
          initial={requests}
          isStaff={false}
          ownMembershipId={membership.id}
          showEmail={false}
          title={t("myRequests")}
        />
      </div>
    );
  }

  // Staff: edit any member's availability, log time off, decide requests.
  const { members } = await listAvailabilityRoster();
  const firstWindows = members[0]
    ? (await getAvailability(members[0].id)).windows
    : [];
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = requests.filter(
    (r) => r.status === "approved" && r.ends_on >= today,
  );

  return (
    <div className="max-w-3xl space-y-6">
      <Heading title={t("title")} description={t("description")} />
      <StaffAvailabilityView members={members} initialWindows={firstWindows} />
      <TimeOffList
        initial={requests}
        isStaff
        ownMembershipId={membership.id}
        showEmail
        title={t("timeOffRequests")}
      />
      <Card>
        <CardHeader>
          <CardTitle>{t("upcomingTimeOff")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">{t("noUpcoming")}</p>
          ) : (
            upcoming.map((r) => (
              <p key={r.id} className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {r.email}
                </span>
                {" · "}
                {r.starts_on}
                {r.ends_on !== r.starts_on ? ` – ${r.ends_on}` : ""}
                {r.reason ? ` · ${r.reason}` : ""}
              </p>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
