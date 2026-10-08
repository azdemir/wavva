"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { assignJob } from "@/lib/actions/jobs";

export type CrewMember = { user_id: string; email: string; role: string };

/** Assign team members to a job. */
export function AssignCrew({
  jobId,
  crew,
  assigned,
}: {
  jobId: string;
  crew: CrewMember[];
  assigned: string[];
}) {
  const [selected, setSelected] = useState<string[]>(assigned);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggle(userId: string) {
    setSaved(false);
    setSelected((s) =>
      s.includes(userId) ? s.filter((u) => u !== userId) : [...s, userId],
    );
  }

  async function save() {
    setPending(true);
    setError(null);
    const result = await assignJob(jobId, selected);
    setPending(false);
    if (result?.error) setError(result.error);
    else setSaved(true);
  }

  if (crew.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No team members yet. Invite your crew from the Team page first.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {saved && (
        <div role="status" className="rounded-lg border border-accent-200 bg-accent-50 px-4 py-2 text-sm text-accent-800">
          Crew updated.
        </div>
      )}
      <ul className="space-y-2">
        {crew.map((m) => (
          <li key={m.user_id}>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 hover:bg-slate-50">
              <input
                type="checkbox"
                checked={selected.includes(m.user_id)}
                onChange={() => toggle(m.user_id)}
                className="h-5 w-5 rounded border-slate-300 text-brand-600"
              />
              <span className="flex-1 text-sm text-slate-900">{m.email}</span>
              <span className="text-xs text-slate-500">{m.role}</span>
            </label>
          </li>
        ))}
      </ul>
      <Button onClick={save} disabled={pending}>
        {pending ? "Saving…" : "Save assignment"}
      </Button>
    </div>
  );
}
