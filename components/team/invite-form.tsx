"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createInvite } from "@/lib/actions/team";
import { Button } from "@/components/ui/button";
import { Field, SelectField } from "@/components/ui/input";

/** Team invite form that shows server errors inline instead of crashing. */
export function InviteForm() {
  const t = useTranslations("team");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    setDone(false);
    const result = await createInvite(formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setDone(true);
    }
  }

  return (
    <form action={onSubmit} className="flex flex-wrap items-end gap-3">
      <div className="min-w-52 flex-1">
        <Field
          id="team-email"
          name="email"
          label={t("invite.emailLabel")}
          type="email"
          required
          placeholder={t("invite.emailPlaceholder")}
        />
      </div>
      <div className="w-36">
        <SelectField id="team-role" name="role" label={t("invite.roleLabel")}>
          <option value="cleaner">{t("roles.cleaner")}</option>
          <option value="manager">{t("roles.manager")}</option>
          <option value="owner">{t("roles.owner")}</option>
        </SelectField>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? t("invite.sending") : t("invite.submit")}
      </Button>
      {error && (
        <p role="alert" className="w-full text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {done && !error && (
        <p role="status" className="w-full text-sm text-green-700 dark:text-green-400">
          {t("invite.sent")}
        </p>
      )}
    </form>
  );
}
