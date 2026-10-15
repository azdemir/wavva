"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  listTimeOff,
  decideTimeOff,
  deleteTimeOff,
  type TimeOffRequest,
} from "@/lib/actions/availability";

const statusTone = { pending: "amber", approved: "accent", denied: "red" } as const;

/**
 * Time-off request list. Staff get Approve/Deny on pending requests and may
 * delete anything; cleaners only see their own requests and may delete
 * their own pending ones.
 */
export function TimeOffList({
  initial,
  isStaff,
  ownMembershipId,
  showEmail,
  title,
}: {
  initial: TimeOffRequest[];
  isStaff: boolean;
  ownMembershipId: string;
  showEmail: boolean;
  title: string;
}) {
  const t = useTranslations("availability");
  const [requests, setRequests] = useState<TimeOffRequest[]>(initial);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const { requests: fresh } = await listTimeOff();
    setRequests(fresh);
  }

  async function decide(id: string, decision: "approved" | "denied") {
    setError(null);
    const result = await decideTimeOff(id, decision);
    if (result?.error) {
      setError(result.error);
      return;
    }
    await refresh();
  }

  async function remove(id: string) {
    setError(null);
    const result = await deleteTimeOff(id);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }

  const canDelete = (r: TimeOffRequest) =>
    isStaff || (r.membership_id === ownMembershipId && r.status === "pending");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t("noRequests")}</p>
        ) : (
          requests.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {showEmail ? (
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {r.email}
                    </span>
                  ) : null}
                  <Badge tone={statusTone[r.status]}>{t(`status.${r.status}`)}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {r.starts_on}
                  {r.ends_on !== r.starts_on ? ` – ${r.ends_on}` : ""}
                  {r.reason ? ` · ${r.reason}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isStaff && r.status === "pending" ? (
                  <>
                    <Button size="sm" onClick={() => decide(r.id, "approved")}>
                      {t("approve")}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => decide(r.id, "denied")}>
                      {t("deny")}
                    </Button>
                  </>
                ) : null}
                {canDelete(r) ? (
                  <ConfirmActionButton
                    label={t("delete")}
                    confirmMessage={t("deleteConfirm")}
                    variant="outline"
                    className="h-auto border-0 p-0 text-xs font-medium text-slate-500 hover:bg-transparent hover:text-red-600 dark:text-slate-400"
                    action={() => remove(r.id)}
                  />
                ) : null}
              </div>
            </div>
          ))
        )}
        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
