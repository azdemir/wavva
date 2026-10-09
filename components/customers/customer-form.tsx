"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field, TextareaField } from "@/components/ui/input";
import type { ActionResult } from "@/lib/actions/customers";

export type CustomerFields = {
  name: string;
  customer_type: "residential" | "commercial";
  email: string;
  phone: string;
  notes: string;
  sms_consent: boolean;
};

export function CustomerForm({
  initial,
  action,
  submitLabel,
}: {
  initial?: Partial<CustomerFields>;
  action: (formData: FormData) => Promise<ActionResult>;
  submitLabel: string;
}) {
  const t = useTranslations("customers");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [type, setType] = useState<"residential" | "commercial">(
    initial?.customer_type ?? "residential",
  );

  const customerTypes = [
    { value: "residential", label: t("form.typeResidential"), hint: t("form.typeResidentialHint") },
    { value: "commercial", label: t("form.typeCommercial"), hint: t("form.typeCommercialHint") },
  ] as const;

  return (
    <form
      action={async (formData) => {
        setPending(true);
        setError(null);
        const result = await action(formData);
        setPending(false);
        if (result?.error) setError(result.error);
      }}
      className="space-y-4"
    >
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div>
        <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {t("form.typeLabel")}
        </span>
        <div className="mt-1.5 grid grid-cols-2 gap-2" role="radiogroup" aria-label={t("form.typeLabel")}>
          {customerTypes.map((t) => (
            <label
              key={t.value}
              className={`cursor-pointer rounded-lg border px-4 py-3 text-sm transition-colors ${
                type === t.value
                  ? "border-brand-600 bg-brand-50 dark:border-brand-500 dark:bg-brand-950"
                  : "border-slate-300 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              }`}
            >
              <input
                type="radio"
                name="customer_type"
                value={t.value}
                checked={type === t.value}
                onChange={() => setType(t.value)}
                className="sr-only"
              />
              <span className={`block font-semibold ${type === t.value ? "text-brand-700 dark:text-brand-300" : "text-slate-700 dark:text-slate-200"}`}>
                {t.label}
              </span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">{t.hint}</span>
            </label>
          ))}
        </div>
      </div>
      <Field
        id="cust-name"
        name="name"
        label={type === "commercial" ? t("form.nameLabelBusiness") : t("form.nameLabelPerson")}
        required
        defaultValue={initial?.name ?? ""}
        placeholder={type === "commercial" ? t("form.namePlaceholderBusiness") : t("form.namePlaceholderPerson")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="cust-email"
          name="email"
          label={t("form.emailLabel")}
          type="email"
          defaultValue={initial?.email ?? ""}
          placeholder={t("form.emailPlaceholder")}
        />
        <Field
          id="cust-phone"
          name="phone"
          label={t("form.phoneLabel")}
          type="tel"
          defaultValue={initial?.phone ?? ""}
          placeholder={t("form.phonePlaceholder")}
        />
      </div>
      <TextareaField
        id="cust-notes"
        name="notes"
        label={t("form.notesLabel")}
        rows={3}
        defaultValue={initial?.notes ?? ""}
        placeholder={t("form.notesPlaceholder")}
      />
      <label className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
        <input
          type="checkbox"
          name="sms_consent"
          defaultChecked={initial?.sms_consent ?? false}
          className="mt-1 h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-brand-600 dark:text-brand-400"
        />
        <span>
          {t("form.smsConsent")}
        </span>
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? t("form.saving") : submitLabel}
      </Button>
    </form>
  );
}
