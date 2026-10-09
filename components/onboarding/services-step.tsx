"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { saveServices } from "@/lib/actions/onboarding";

type Row = {
  name: string;
  category: "residential" | "commercial";
  description: string;
  price: string;
  unit: "per_visit" | "per_hour" | "per_sqft";
};

const emptyRow = (): Row => ({
  name: "",
  category: "residential",
  description: "",
  price: "",
  unit: "per_visit",
});

export function ServicesStep({ initial }: { initial?: Row[] }) {
  const t = useTranslations("onboarding");
  const [rows, setRows] = useState<Row[]>(
    initial && initial.length > 0 ? initial : [emptyRow()],
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const set = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  async function submit() {
    setPending(true);
    setError(null);
    const payload = rows.map((r) => ({
      name: r.name.trim(),
      category: r.category,
      description: r.description.trim(),
      base_price_cents: Math.round(Number(r.price || 0) * 100),
      unit: r.unit,
    }));
    const result = await saveServices(payload);
    setPending(false);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        {t("services.intro")}
      </p>
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {rows.map((r, i) => (
        <div key={i} className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t("services.serviceNumber", { n: i + 1 })}
            </span>
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
                className="text-sm font-medium text-red-600 hover:text-red-700"
              >
                {t("services.remove")}
              </button>
            )}
          </div>
          <Field
            id={`svc-name-${i}`}
            label={t("services.name")}
            value={r.name}
            onChange={(e) => set(i, { name: e.target.value })}
            placeholder={t("services.namePlaceholder")}
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor={`svc-cat-${i}`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("services.type")}
              </label>
              <select
                id={`svc-cat-${i}`}
                value={r.category}
                onChange={(e) => set(i, { category: e.target.value as Row["category"] })}
                className="mt-1.5 block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="residential">{t("services.residential")}</option>
                <option value="commercial">{t("services.commercial")}</option>
              </select>
            </div>
            <Field
              id={`svc-price-${i}`}
              label={t("services.basePrice")}
              type="number"
              min="0"
              step="0.01"
              value={r.price}
              onChange={(e) => set(i, { price: e.target.value })}
              placeholder={t("services.basePricePlaceholder")}
            />
            <div>
              <label htmlFor={`svc-unit-${i}`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("services.priced")}
              </label>
              <select
                id={`svc-unit-${i}`}
                value={r.unit}
                onChange={(e) => set(i, { unit: e.target.value as Row["unit"] })}
                className="mt-1.5 block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                {(["per_visit", "per_hour", "per_sqft"] as const).map((u) => (
                  <option key={u} value={u}>
                    {t(`services.units.${u}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => setRows((rs) => [...rs, emptyRow()])}
      >
        {t("services.addAnother")}
      </Button>
      <Button onClick={submit} className="w-full" disabled={pending}>
        {pending ? t("common.saving") : t("common.continue")}
      </Button>
    </div>
  );
}
