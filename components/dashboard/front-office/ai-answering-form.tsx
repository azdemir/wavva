"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, SelectField, TextareaField } from "@/components/ui/input";
import {
  saveAiAnsweringSettings,
  type AiAnsweringSettings,
} from "@/lib/actions/ai-answering";

export function AiAnsweringForm({ initial }: { initial: AiAnsweringSettings }) {
  const [enabled, setEnabled] = useState(initial.ai_answering_enabled);
  const [greeting, setGreeting] = useState(initial.ai_greeting_override);
  const [model, setModel] = useState<"gpt-4o-mini" | "gpt-4o">(initial.ai_model);
  const [ownerPhone, setOwnerPhone] = useState(initial.owner_phone);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await saveAiAnsweringSettings({
      ai_answering_enabled: enabled,
      ai_greeting_override: greeting,
      ai_model: model,
      owner_phone: ownerPhone,
    });
    setSaving(false);
    setMessage(
      res.ok
        ? { ok: true, text: "Saved. Your AI answering settings are live." }
        : { ok: false, text: res.error ?? "Couldn't save." },
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="mt-1 h-5 w-5 accent-brand-600"
        />
        <span>
          <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            AI answers your business line
          </span>
          <span className="block text-sm text-slate-500 dark:text-slate-400">
            When off, callers hear that the line isn&apos;t set up for automated answering.
          </span>
        </span>
      </label>

      <TextareaField
        id="ai-greeting"
        label="Custom greeting (optional)"
        hint="Leave blank for the default: AI disclosure + recording notice + your business name. Your custom greeting must still start by saying it's your business's AI assistant."
        rows={3}
        value={greeting}
        onChange={(e) => setGreeting(e.target.value)}
        placeholder="Hi, thanks for calling Acme — you're speaking with Acme's AI assistant…"
      />

      <SelectField
        id="ai-model"
        label="AI model"
        hint="Mini is cheaper and handles greetings, quotes and booking well. Full is smarter for complex calls — and costs more per minute."
        value={model}
        onChange={(e) => setModel(e.target.value as "gpt-4o-mini" | "gpt-4o")}
      >
        <option value="gpt-4o-mini">Mini — lower cost per minute (recommended)</option>
        <option value="gpt-4o">Full — smartest, higher cost per minute</option>
      </SelectField>

      <Field
        id="owner-phone"
        label="Owner phone for escalations"
        hint="The AI texts this number immediately when a call needs you — unusual requests, off-price-list quotes, booking requests."
        type="tel"
        value={ownerPhone}
        onChange={(e) => setOwnerPhone(e.target.value)}
        placeholder="+1 555 010 2030"
      />

      {message && (
        <p
          role={message.ok ? "status" : "alert"}
          className={`text-sm font-medium ${message.ok ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
        >
          {message.text}
        </p>
      )}

      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save AI answering settings"}
      </Button>
    </form>
  );
}
