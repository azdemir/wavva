"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createCrmContact } from "@/lib/studio/actions";
import { CRM_STAGES, CRM_SOURCES } from "@/lib/studio/crm";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/components/ui/input";

/** Manual lead entry. */
export default function NewCrmContactPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const dollars = String(fd.get("deal_value") ?? "").trim();
    const res = await createCrmContact({
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      company_name: String(fd.get("company_name") ?? ""),
      source: String(fd.get("source") ?? "manual"),
      stage: String(fd.get("stage") ?? "new"),
      deal_value_cents: dollars === "" ? null : Math.round(Number(dollars) * 100),
      notes: String(fd.get("notes") ?? ""),
    });
    setSaving(false);
    if (!res.ok || !res.id) {
      setError(res.error ?? "Couldn't create the lead.");
      return;
    }
    router.push(`/studio/crm/${res.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/studio/crm"
        className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
      >
        ← Back to CRM
      </Link>
      <Heading title="New lead" description="Add someone to the pipeline manually." />
      <Card>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <Field id="new-name" name="name" label="Name" required autoComplete="off" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="new-email" name="email" label="Email" type="email" autoComplete="off" />
              <Field id="new-phone" name="phone" label="Phone" type="tel" autoComplete="off" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="new-company" name="company_name" label="Company" autoComplete="off" />
              <Field
                id="new-deal"
                name="deal_value"
                label="Deal value (USD)"
                type="number"
                min={0}
                step="1"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="new-source"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Source
                </label>
                <select
                  id="new-source"
                  name="source"
                  defaultValue="manual"
                  className="mt-1.5 block h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {CRM_SOURCES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="new-stage"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Stage
                </label>
                <select
                  id="new-stage"
                  name="stage"
                  defaultValue="new"
                  className="mt-1.5 block h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {CRM_STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label
                htmlFor="new-notes"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Notes
              </label>
              <textarea
                id="new-notes"
                name="notes"
                rows={3}
                className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            {error && (
              <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 items-center rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? "Adding…" : "Add lead"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
