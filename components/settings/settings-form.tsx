"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field, SelectField, TextareaField } from "@/components/ui/input";
import { LogoField } from "@/components/company/logo-field";
import { updateCompanySettings } from "@/lib/actions/settings";
import type { Company } from "@/lib/auth";

const timezones = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
];

export function SettingsForm({
  company,
  logoPreviewUrl,
}: {
  company: Company;
  logoPreviewUrl: string | null;
}) {
  const t = useTranslations("settings");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  const settings = company.settings as {
    default_tax_rate?: number;
    cancellation_policy?: string | null;
    frequency_multipliers?: { weekly?: number; biweekly?: number; monthly?: number };
    followup_enabled?: boolean;
    followup_days?: number[];
  };

  return (
    <form
      action={async (formData) => {
        setPending(true);
        setError(null);
        setSaved(false);
        const result = await updateCompanySettings(formData);
        setPending(false);
        if (result?.error) setError(result.error);
        else setSaved(true);
      }}
      className="space-y-8"
    >
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {saved && (
        <div role="status" className="rounded-lg border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-800">
          {t("form.saved")}
        </div>
      )}

      <section className="space-y-4">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t("form.profile")}</h3>
        <Field id="set-name" name="name" label={t("fields.businessName")} defaultValue={company.name} required />
        <LogoField
          inputId="set-logo"
          label={t("fields.logo")}
          optionalLabel={t("fields.optional")}
          hint={t("fields.logoHint")}
          previewUrl={logoPreviewUrl}
          previewAlt={t("fields.logoPreviewAlt")}
          removeLabel={t("fields.removeLogo")}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="set-phone" name="phone" label={t("fields.phone")} type="tel" defaultValue={company.phone ?? ""} />
          <Field id="set-email" name="email" label={t("fields.email")} type="email" defaultValue={company.email ?? ""} hint={t("fields.emailHint")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="set-website" name="website" label={t("fields.website")} defaultValue={company.website ?? ""} />
          <SelectField
            id="set-timezone"
            name="timezone"
            label={t("fields.timezone")}
            defaultValue={company.timezone}
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>{tz.replace("_", " ")}</option>
            ))}
          </SelectField>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t("form.pricing")}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="set-tax"
            name="default_tax_rate"
            label={t("fields.taxRate")}
            type="number"
            min="0"
            max="1"
            step="0.0001"
            defaultValue={settings.default_tax_rate ?? 0}
          />
        </div>
        <TextareaField
          id="set-cancel"
          name="cancellation_policy"
          label={t("fields.cancellationPolicy")}
          rows={3}
          placeholder={t("fields.cancellationPlaceholder")}
          defaultValue={settings.cancellation_policy ?? ""}
        />
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("form.multipliersTitle")}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">{t("form.multipliersDescription")}</p>
          <div className="mt-2 grid gap-4 sm:grid-cols-3">
            <Field
              id="set-weekly"
              name="freq_weekly"
              label={t("fields.weekly")}
              type="number" min="0" max="2" step="0.01"
              defaultValue={settings.frequency_multipliers?.weekly ?? 1}
            />
            <Field
              id="set-biweekly"
              name="freq_biweekly"
              label={t("fields.biweekly")}
              type="number" min="0" max="2" step="0.01"
              defaultValue={settings.frequency_multipliers?.biweekly ?? 1}
            />
            <Field
              id="set-monthly"
              name="freq_monthly"
              label={t("fields.monthly")}
              type="number" min="0" max="2" step="0.01"
              defaultValue={settings.frequency_multipliers?.monthly ?? 1}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t("form.followups")}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
          {t("form.followupsDescription")}
        </p>
        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            name="followup_enabled"
            defaultChecked={settings.followup_enabled !== false}
            className="h-5 w-5 rounded accent-brand-600"
          />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("form.followupsEnable")}</span>
        </label>
        <Field
          id="set-followup-days"
          name="followup_days"
          label={t("fields.followupDays")}
          placeholder={t("fields.followupDaysPlaceholder")}
          defaultValue={(settings.followup_days ?? [2, 5]).join(", ")}
          hint={t("fields.followupDaysHint")}
        />
      </section>

      <Button type="submit" disabled={pending}>
        {pending ? t("form.saving") : t("form.save")}
      </Button>
    </form>
  );
}
