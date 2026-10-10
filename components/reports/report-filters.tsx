"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export type ReportFilterLabels = {
  label: string;
  presets: { value: string; label: string }[];
  from: string;
  to: string;
  apply: string;
};

/** Date-range presets + custom range. Drives the page via URL search params. */
export function ReportFilters({
  labels,
  currentPreset,
  currentFrom,
  currentTo,
}: {
  labels: ReportFilterLabels;
  currentPreset: string;
  currentFrom: string;
  currentTo: string;
}) {
  const router = useRouter();
  const [from, setFrom] = useState(currentFrom);
  const [to, setTo] = useState(currentTo);
  const [customOpen, setCustomOpen] = useState(currentPreset === "custom");

  function go(preset: string, f?: string, t?: string) {
    const qs = new URLSearchParams({ preset });
    if (preset === "custom" && f && t) {
      qs.set("from", f);
      qs.set("to", t);
    }
    router.push(`?${qs.toString()}`);
  }

  function pick(preset: string) {
    setCustomOpen(preset === "custom");
    if (preset !== "custom") go(preset);
  }

  const inputCls =
    "h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
        {labels.label}:
      </span>
      {labels.presets.map((p) => (
        <Button
          key={p.value}
          size="sm"
          variant={
            currentPreset === p.value && (p.value !== "custom" || customOpen)
              ? "primary"
              : "outline"
          }
          onClick={() => pick(p.value)}
        >
          {p.label}
        </Button>
      ))}
      {customOpen && (
        <span className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="reports-from">
            {labels.from}
          </label>
          <input
            id="reports-from"
            type="date"
            value={from}
            max={to}
            onChange={(e) => setFrom(e.target.value)}
            className={inputCls}
            aria-label={labels.from}
          />
          <span className="text-sm text-slate-500 dark:text-slate-400">–</span>
          <label className="sr-only" htmlFor="reports-to">
            {labels.to}
          </label>
          <input
            id="reports-to"
            type="date"
            value={to}
            min={from}
            onChange={(e) => setTo(e.target.value)}
            className={inputCls}
            aria-label={labels.to}
          />
          <Button
            size="sm"
            onClick={() => go("custom", from, to)}
            disabled={!from || !to || from > to}
          >
            {labels.apply}
          </Button>
        </span>
      )}
    </div>
  );
}
