"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { SelectField } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import {
  getFrontOfficeConversations,
  type ConversationView,
} from "@/lib/actions/front-office";

const CHANNEL_TONE: Record<string, "brand" | "accent" | "slate"> = {
  call: "brand",
  sms: "accent",
  email: "slate",
};

/**
 * Conversation log (calls, texts, emails) with a per-customer filter.
 */
export function ConversationLog({
  customers,
  initial,
}: {
  customers: { id: string; name: string }[];
  initial: ConversationView[];
}) {
  const [customerId, setCustomerId] = useState("");
  const [rows, setRows] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function onFilter(id: string) {
    setCustomerId(id);
    setLoading(true);
    const data = await getFrontOfficeConversations(id || undefined);
    setRows(data);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <SelectField
          id="conv-customer"
          label="Customer"
          value={customerId}
          onChange={(e) => onFilter(e.target.value)}
        >
          <option value="">All customers</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectField>
      </div>
      {loading ? (
        <p className="text-sm text-slate-500">Loading conversations…</p>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="font-medium text-slate-900 dark:text-slate-100">
              No conversations yet
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Calls, texts and emails handled by your AI assistant will appear
              here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ol className="space-y-3">
          {rows.map((r) => (
            <li key={r.id}>
              <Card>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge tone={CHANNEL_TONE[r.channel] ?? "slate"}>
                      {r.channel}
                    </Badge>
                    <Badge tone="slate">
                      {r.direction === "in" ? "From customer" : "From assistant"}
                    </Badge>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {r.customer_name}
                    </span>
                    <span className="ml-auto text-slate-500 dark:text-slate-400">
                      {formatDateTime(r.created_at)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                    {r.body}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
