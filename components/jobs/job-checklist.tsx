"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { saveChecklist } from "@/lib/actions/jobs";

export type ChecklistItem = { label: string; done: boolean };

/** Interactive per-job checklist. Saves on every toggle. */
export function JobChecklist({
  jobId,
  initial,
  readOnly,
}: {
  jobId: string;
  initial: ChecklistItem[];
  readOnly?: boolean;
}) {
  const [items, setItems] = useState<ChecklistItem[]>(initial);
  const [newLabel, setNewLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function persist(next: ChecklistItem[]) {
    setItems(next);
    const result = await saveChecklist(jobId, next);
    if (result?.error) setError(result.error);
    else setError(null);
  }

  const done = items.filter((i) => i.done).length;

  return (
    <div className="space-y-3">
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {items.length > 0 && (
        <p className="text-sm text-slate-500">
          {done} of {items.length} done
        </p>
      )}
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
            <input
              type="checkbox"
              checked={item.done}
              disabled={readOnly}
              onChange={() => persist(items.map((it, j) => (j === i ? { ...it, done: !it.done } : it)))}
              className="h-5 w-5 rounded border-slate-300 text-brand-600"
              aria-label={item.label}
            />
            <span className={`flex-1 text-sm ${item.done ? "text-slate-400 line-through" : "text-slate-900"}`}>
              {item.label}
            </span>
            {!readOnly && (
              <button
                type="button"
                onClick={() => persist(items.filter((_, j) => j !== i))}
                className="text-xs font-medium text-slate-400 hover:text-red-600"
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
      {!readOnly && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const label = newLabel.trim();
            if (!label) return;
            setNewLabel("");
            void persist([...items, { label, done: false }]);
          }}
          className="flex gap-2"
        >
          <div className="flex-1">
            <Field
              id="checklist-new"
              label="Add checklist item"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Vacuum all bedrooms"
            />
          </div>
          <Button type="submit" variant="outline" className="mt-7">
            Add
          </Button>
        </form>
      )}
    </div>
  );
}
