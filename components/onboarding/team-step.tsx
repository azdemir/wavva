"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  createInvites,
  completeOnboarding,
  type CreatedInvite,
} from "@/lib/actions/onboarding";

type Row = { email: string; role: "owner" | "manager" | "cleaner" };

export function TeamStep({ baseUrl }: { baseUrl: string }) {
  const [rows, setRows] = useState<Row[]>([{ email: "", role: "cleaner" }]);
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
      setRows([{ email: "", role: "cleaner" }]);
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
        Invite managers and cleaners. They&apos;ll get a private link to join
        your workspace — share it with them directly for now.
      </p>
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {invites.length > 0 && (
        <div className="space-y-2 rounded-xl border border-accent-200 bg-accent-50 p-4">
          <p className="text-sm font-semibold text-accent-800">
            Invites created — share these links:
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
              label={i === 0 ? "Email" : ""}
              type="email"
              value={r.email}
              onChange={(e) => set(i, { email: e.target.value })}
              placeholder="teammate@example.com"
            />
          </div>
          <div className="w-32 shrink-0">
            <label htmlFor={`inv-role-${i}`} className={`block text-sm font-medium text-slate-700 ${i === 0 ? "" : "sr-only"}`}>
              Role
            </label>
            <select
              id={`inv-role-${i}`}
              value={r.role}
              onChange={(e) => set(i, { role: e.target.value as Row["role"] })}
              className="mt-1.5 block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="cleaner">Cleaner</option>
              <option value="manager">Manager</option>
              <option value="owner">Owner</option>
            </select>
          </div>
          {rows.length > 1 && (
            <button
              type="button"
              onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
              className="mb-2 shrink-0 text-sm font-medium text-red-600 hover:text-red-700"
            >
              Remove
            </button>
          )}
        </div>
      ))}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setRows((rs) => [...rs, { email: "", role: "cleaner" }])}
        >
          + Add invite
        </Button>
        <Button type="button" variant="outline" onClick={submit} disabled={pending}>
          {pending ? "Creating…" : "Create invites"}
        </Button>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
        <Button onClick={finish} className="w-full" disabled={finishing}>
          {finishing ? "Finishing…" : "Finish setup →"}
        </Button>
        <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
          You can invite your team later from the Team page too.
        </p>
      </div>
    </div>
  );
}
