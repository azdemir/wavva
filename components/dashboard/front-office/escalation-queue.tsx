"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TextareaField } from "@/components/ui/input";
import { formatDateTime } from "@/lib/format";
import {
  resolveFrontOfficeEscalation,
  type EscalationView,
} from "@/lib/actions/front-office";

const KIND_LABEL: Record<string, string> = {
  off_price_quote: "Off-price-list quote",
  unusual: "Needs a human",
};

const STATUS_TONE: Record<string, "brand" | "slate" | "accent" | "red"> = {
  pending: "brand",
  approved: "accent",
  edited: "slate",
  declined: "red",
};

/**
 * The "Needs your OK" queue: quotes outside the price list and anything
 * unusual the assistant escalated. Approve, edit (with your correction),
 * or decline.
 */
export function EscalationQueue({ initial }: { initial: EscalationView[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function resolve(
    id: string,
    resolution: "approved" | "edited" | "declined",
    editedDetail = "",
  ) {
    setBusy(id);
    setError(null);
    const res = await resolveFrontOfficeEscalation({ id, resolution, editedDetail });
    setBusy(null);
    if (!res.ok) {
      setError(res.error ?? "Couldn't save your decision.");
      return;
    }
    setItems((list) =>
      list.map((e) => (e.id === id ? { ...e, status: resolution } : e)),
    );
    setEditing(null);
    setEditText("");
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="font-medium text-slate-900 dark:text-slate-100">
            Nothing needs your OK
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Quotes outside your price list and anything unusual will appear
            here for your decision.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </div>
      )}
      {items.map((e) => (
        <Card key={e.id} className={e.status === "pending" ? "border-brand-300 dark:border-brand-800" : ""}>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={STATUS_TONE[e.status] ?? "slate"}>{e.status}</Badge>
              <Badge tone="slate">{KIND_LABEL[e.kind] ?? e.kind}</Badge>
              <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
                {formatDateTime(e.created_at)}
              </span>
            </div>
            <h3 className="mt-3 font-semibold text-slate-900 dark:text-slate-100">
              {e.title}
            </h3>
            {e.detail && (
              <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {e.detail}
              </p>
            )}
            {e.status === "pending" && editing !== e.id && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => resolve(e.id, "approved")}
                  disabled={busy === e.id}
                >
                  {busy === e.id ? "Saving…" : "Approve"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditing(e.id);
                    setEditText(e.detail);
                  }}
                  disabled={busy === e.id}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => resolve(e.id, "declined")}
                  disabled={busy === e.id}
                >
                  Decline
                </Button>
              </div>
            )}
            {e.status === "pending" && editing === e.id && (
              <div className="mt-4 space-y-3">
                <TextareaField
                  id={`edit-${e.id}`}
                  label="Your correction"
                  value={editText}
                  onChange={(ev) => setEditText(ev.target.value)}
                  rows={3}
                  hint="The assistant will use your version."
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => resolve(e.id, "edited", editText)}
                    disabled={busy === e.id}
                  >
                    {busy === e.id ? "Saving…" : "Save correction"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(null);
                      setEditText("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
