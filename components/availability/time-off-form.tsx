"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  requestTimeOff,
  addTimeOffForMember,
} from "@/lib/actions/availability";

const dateInputClass =
  "h-11 rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 focus:outline-2 focus:outline-offset-1 focus:outline-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

/**
 * Cleaner view: request time off for oneself. Staff view: log time off
 * directly for the selected member (pre-approved).
 */
export function TimeOffForm({
  mode,
  membershipId,
  onDone,
}: {
  mode: "request" | "log";
  membershipId?: string;
  onDone?: () => void;
}) {
  const t = useTranslations("availability");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isLog = mode === "log";

  async function submit() {
    if (!startsOn || !endsOn) return;
    setPending(true);
    setError(null);
    setNotice(null);
    const payload = { startsOn, endsOn, reason: reason.trim() };
    const result = isLog
      ? await addTimeOffForMember(membershipId ?? "", payload)
      : await requestTimeOff(payload);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setStartsOn("");
    setEndsOn("");
    setReason("");
    setNotice(isLog ? t("timeOffLogged") : t("requestSubmitted"));
    onDone?.();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isLog ? t("logTimeOff") : t("requestTimeOff")}</CardTitle>
        {isLog ? <CardDescription>{t("logTimeOffHint")}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor={isLog ? "log-starts" : "req-starts"}
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              {t("startsOn")}
            </label>
            <input
              id={isLog ? "log-starts" : "req-starts"}
              type="date"
              value={startsOn}
              onChange={(e) => setStartsOn(e.target.value)}
              className={`mt-1.5 block w-full ${dateInputClass}`}
            />
          </div>
          <div>
            <label
              htmlFor={isLog ? "log-ends" : "req-ends"}
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              {t("endsOn")}
            </label>
            <input
              id={isLog ? "log-ends" : "req-ends"}
              type="date"
              value={endsOn}
              onChange={(e) => setEndsOn(e.target.value)}
              className={`mt-1.5 block w-full ${dateInputClass}`}
            />
          </div>
        </div>
        <Field
          id={isLog ? "log-reason" : "req-reason"}
          label={t("reason")}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
        />
        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
        {notice ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">{notice}</p>
        ) : null}
        <Button type="button" onClick={submit} disabled={pending || !startsOn || !endsOn}>
          {pending
            ? (isLog ? t("logTimeOff") : t("submitRequest")) + "…"
            : isLog
              ? t("logTimeOff")
              : t("submitRequest")}
        </Button>
      </CardContent>
    </Card>
  );
}
