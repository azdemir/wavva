"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusIcon } from "@/components/ui/icons";
import {
  saveAvailability,
  type AvailabilityWindowInput,
} from "@/lib/actions/availability";

const DAYS = [0, 1, 2, 3, 4, 5, 6];

const timeInputClass =
  "h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-2 focus:outline-offset-1 focus:outline-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

/** Weekly editor for one member's availability. Replace-all on save. */
export function AvailabilityEditor({
  membershipId,
  initial,
  title,
  description,
}: {
  membershipId: string;
  initial: AvailabilityWindowInput[];
  title: string;
  description?: string;
}) {
  const t = useTranslations("availability");
  const [windows, setWindows] = useState<AvailabilityWindowInput[]>(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const dayWindows = (day: number) =>
    windows.filter((w) => w.weekday === day).sort((a, b) => a.start.localeCompare(b.start));

  function setUnavailable(day: number) {
    setWindows((prev) => prev.filter((w) => w.weekday !== day));
  }

  function addWindow(day: number) {
    if (dayWindows(day).length >= 4) return;
    setWindows((prev) => [...prev, { weekday: day, start: "09:00", end: "17:00" }]);
  }

  function updateWindow(idx: number, patch: Partial<AvailabilityWindowInput>) {
    setWindows((prev) => prev.map((w, i) => (i === idx ? { ...w, ...patch } : w)));
  }

  function removeWindow(idx: number) {
    setWindows((prev) => prev.filter((_, i) => i !== idx));
  }

  async function save() {
    setPending(true);
    setError(null);
    setNotice(null);
    const result = await saveAvailability(membershipId, windows);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setNotice(t("saved"));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {DAYS.map((day) => {
          const list = dayWindows(day);
          return (
            <div key={day} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t(`weekdays.${day}`)}
                </span>
                {list.length === 0 ? (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {t("unavailable")}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setUnavailable(day)}
                    className="text-xs font-medium text-slate-500 hover:text-red-600 dark:text-slate-400"
                  >
                    {t("unavailable")}
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {list.map((w) => {
                  const idx = windows.indexOf(w);
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="time"
                        aria-label={t("start")}
                        value={w.start}
                        onChange={(e) => updateWindow(idx, { start: e.target.value })}
                        className={timeInputClass}
                      />
                      <span className="text-slate-500 dark:text-slate-400">–</span>
                      <input
                        type="time"
                        aria-label={t("end")}
                        value={w.end}
                        onChange={(e) => updateWindow(idx, { end: e.target.value })}
                        className={timeInputClass}
                      />
                      <button
                        type="button"
                        onClick={() => removeWindow(idx)}
                        className="text-xs font-medium text-slate-500 hover:text-red-600 dark:text-slate-400"
                      >
                        {t("remove")}
                      </button>
                    </div>
                  );
                })}
                {list.length < 4 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => addWindow(day)}>
                    <PlusIcon className="mr-1 h-4 w-4" />
                    {t("addWindow")}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
        {notice ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">{notice}</p>
        ) : null}
        <Button type="button" onClick={save} disabled={pending}>
          {pending ? t("saveAvailability") + "…" : t("saveAvailability")}
        </Button>
      </CardContent>
    </Card>
  );
}
