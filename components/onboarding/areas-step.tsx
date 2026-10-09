"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { saveServiceAreas } from "@/lib/actions/onboarding";

type Row = { area_type: "city" | "county" | "zip" | "radius"; value: string };

export function AreasStep() {
  const t = useTranslations("onboarding");
  const [rows, setRows] = useState<Row[]>([{ area_type: "city", value: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const set = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  async function submit() {
    setPending(true);
    setError(null);
    const result = await saveServiceAreas(
      rows.map((r) => ({ area_type: r.area_type, value: r.value.trim() })),
    );
    setPending(false);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        {t("areas.intro")}
      </p>
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {rows.map((r, i) => (
        <div key={i} className="flex items-end gap-3">
          <div className="w-32 shrink-0">
            <label htmlFor={`area-type-${i}`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("areas.type")}
            </label>
            <select
              id={`area-type-${i}`}
              value={r.area_type}
              onChange={(e) => set(i, { area_type: e.target.value as Row["area_type"] })}
              className="mt-1.5 block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="city">{t("areas.types.city")}</option>
              <option value="county">{t("areas.types.county")}</option>
              <option value="zip">{t("areas.types.zip")}</option>
              <option value="radius">{t("areas.types.radius")}</option>
            </select>
          </div>
          <div className="flex-1">
            <Field
              id={`area-value-${i}`}
              label={t("areas.value")}
              value={r.value}
              onChange={(e) => set(i, { value: e.target.value })}
              placeholder={t(`areas.hints.${r.area_type}`)}
            />
          </div>
          {rows.length > 1 && (
            <button
              type="button"
              onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
              className="mb-2 shrink-0 text-sm font-medium text-red-600 hover:text-red-700"
            >
              {t("areas.remove")}
            </button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => setRows((rs) => [...rs, { area_type: "city", value: "" }])}
      >
        {t("areas.addAnother")}
      </Button>
      <Button onClick={submit} className="w-full" disabled={pending}>
        {pending ? t("common.saving") : t("common.continue")}
      </Button>
    </div>
  );
}
