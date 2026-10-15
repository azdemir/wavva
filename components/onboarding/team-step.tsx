"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  createInvites,
  completeOnboarding,
  type CreatedInvite,
} from "@/lib/actions/onboarding";

type Row = { email: string; role: "owner" | "manager" };

export function TeamStep({ baseUrl }: { baseUrl: string }) {
  const t = useTranslations("onboarding");
  const [rows, setRows] = useState<Row[]>([{ email: "", role: "manager" }]);
  const [invites, setInvites] = useState<CreatedInvite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const set = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  async function submit() {
    setPending(true);
    setError(null);
    const result = await createInvites(
      rows
        .map((r) => ({ email: r.email.trim(), role: r.role }))
        .filter((r) => r.email.length > 0),
      baseUrl,
    );
    setPending(false);
    if (result.error) {
      setError(result.error);
    } else {
      setInvites(result.invites ?? []);
      setRows([{ email: "", role: "manager" }]);
    }
  }

  async function finish() {
    setFinishing(true);
    const result = await completeOnboarding();
    setFinishing(false);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        {t("team.intro")}
      </p>
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {invites.length > 0 && (
        <div className="space-y-2 rounded-xl border border-accent-200 bg-accent-50 p-4">
          <p className="text-sm font-semibold text-accent-800">
            {t("team.invitesCreated")}
          </p>
          {invites.map((inv) => (
            <div key={inv.link} className="flex items-center gap-2 text-sm">
              <Badge tone="accent">{inv.role}</Badge>
              <code className="min-w-0 flex-1 truncate rounded bg-white px-2 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {inv.link}
              </code>
            </div>
          ))}
        </div>
      )}

      {rows.map((r, i) => (
        <div key={i} className="flex items-end gap-3">
          <div className="flex-1">
            <Field
              id={`inv-email-${i}`}
              label={i === 0 ? t("team.email") : ""}
              type="email"
              value={r.email}
              onChange={(e) => set(i, { email: e.target.value })}
              placeholder={t("team.emailPlaceholder")}
            />
          </div>
          <div className="w-32 shrink-0">
            <label htmlFor={`inv-role-${i}`} className={`block text-sm font-medium text-slate-700 ${i === 0 ? "" : "sr-only"}`}>
              {t("team.role")}
            </label>
            <select
              id={`inv-role-${i}`}
              value={r.role}
              onChange={(e) => set(i, { role: e.target.value as Row["role"] })}
              className="mt-1.5 block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="manager">{t("team.roles.manager")}</option>
              <option value="owner">{t("team.roles.owner")}</option>
            </select>
          </div>
          {rows.length > 1 && (
            <button
              type="button"
              onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
              className="mb-2 shrink-0 text-sm font-medium text-red-600 hover:text-red-700"
            >
              {t("team.remove")}
            </button>
          )}
        </div>
      ))}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setRows((rs) => [...rs, { email: "", role: "manager" }])}
        >
          {t("team.addInvite")}
        </Button>
        <Button type="button" variant="outline" onClick={submit} disabled={pending}>
          {pending ? t("team.creating") : t("team.createInvites")}
        </Button>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
        <Button onClick={finish} className="w-full" disabled={finishing}>
          {finishing ? t("team.finishing") : t("team.finish")}
        </Button>
        <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
          {t("team.inviteLater")}
        </p>
      </div>
    </div>
  );
}
