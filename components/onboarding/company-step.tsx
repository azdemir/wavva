"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field, SelectField } from "@/components/ui/input";
import { LogoField } from "@/components/company/logo-field";
import { saveCompanyProfile } from "@/lib/actions/onboarding";
import type { Company } from "@/lib/auth";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
];

export function CompanyStep({
  company,
  logoPreviewUrl,
}: {
  company?: Company | null;
  logoPreviewUrl: string | null;
}) {
  const t = useTranslations("onboarding");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      action={async (formData) => {
        setPending(true);
        setError(null);
        const result = await saveCompanyProfile(formData);
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
      <Field
        id="ob-name"
        name="name"
        label={t("company.businessName")}
        placeholder={t("company.businessNamePlaceholder")}
        defaultValue={company?.name ?? ""}
        required
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="ob-phone"
          name="phone"
          label={t("company.phone")}
          type="tel"
          placeholder={t("company.phonePlaceholder")}
          defaultValue={company?.phone ?? ""}
        />
        <Field
          id="ob-owner-phone"
          name="owner_phone"
          label={t("company.ownerPhone")}
          type="tel"
          placeholder={t("company.ownerPhonePlaceholder")}
          hint={t("company.ownerPhoneHint")}
          defaultValue=""
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="ob-email"
          name="email"
          label={t("company.email")}
          type="email"
          placeholder={t("company.emailPlaceholder")}
          defaultValue={company?.email ?? ""}
        />
        <SelectField
          id="ob-timezone"
          name="timezone"
          label={t("company.timezone")}
          defaultValue={company?.timezone ?? "America/New_York"}
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz.replace("_", " ")}
            </option>
          ))}
        </SelectField>
      </div>
      <Field
        id="ob-website"
        name="website"
        label={t("company.website")}
        placeholder={t("company.websitePlaceholder")}
        defaultValue={company?.website ?? ""}
      />
      <LogoField
        inputId="ob-logo"
        label={t("company.logo")}
        optionalLabel={t("company.optional")}
        hint={t("company.logoHint")}
        previewUrl={logoPreviewUrl}
        previewAlt={t("company.logoPreviewAlt")}
      />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? t("common.saving") : t("common.continue")}
      </Button>
    </form>
  );
}
