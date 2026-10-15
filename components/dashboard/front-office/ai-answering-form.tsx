"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, SelectField, TextareaField } from "@/components/ui/input";
import {
  saveAiAnsweringSettings,
  type AiAnsweringSettings,
} from "@/lib/actions/ai-answering";

const DAYS = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
] as const;

type DayHours = { closed: boolean; open: string; close: string };

function initialHours(raw: AiAnsweringSettings["ai_business_hours"]): Record<string, DayHours> {
  const out: Record<string, DayHours> = {};
  for (const d of DAYS) {
    const pairs = Array.isArray(raw?.[d.key]) ? raw[d.key] : [];
    const first = pairs[0];
    out[d.key] =
      first && first[0] && first[1]
        ? { closed: false, open: first[0], close: first[1] }
        : { closed: d.key === "sat" || d.key === "sun", open: "09:00", close: "17:00" };
  }
  return out;
}

export function AiAnsweringForm({ initial }: { initial: AiAnsweringSettings }) {
  const [enabled, setEnabled] = useState(initial.ai_answering_enabled);
  const [greeting, setGreeting] = useState(initial.ai_greeting_override);
  const [model, setModel] = useState<"gpt-4o-mini" | "gpt-4o">(initial.ai_model);
  const [ownerPhone, setOwnerPhone] = useState(initial.owner_phone);
  const [bookingEnabled, setBookingEnabled] = useState(initial.ai_booking_enabled);
  const [slotMinutes, setSlotMinutes] = useState(initial.ai_slot_minutes);
  const [bufferMinutes, setBufferMinutes] = useState(initial.ai_buffer_minutes);
  const [daysAhead, setDaysAhead] = useState(initial.ai_max_days_ahead);
  const [hours, setHours] = useState<Record<string, DayHours>>(() => initialHours(initial.ai_business_hours));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function setDay(key: string, patch: Partial<DayHours>) {
    setHours((h) => ({ ...h, [key]: { ...h[key], ...patch } }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const ai_business_hours: Record<string, Array<[string, string]>> = {};
    for (const d of DAYS) {
      const h = hours[d.key];
      ai_business_hours[d.key] = h.closed ? [] : [[h.open, h.close]];
    }
    const res = await saveAiAnsweringSettings({
      ai_answering_enabled: enabled,
      ai_greeting_override: greeting,
      ai_model: model,
      owner_phone: ownerPhone,
      ai_booking_enabled: bookingEnabled,
      ai_slot_minutes: slotMinutes,
      ai_buffer_minutes: bufferMinutes,
      ai_max_days_ahead: daysAhead,
      ai_business_hours,
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
        placeholder="Hi, thanks for calling — you're speaking with our AI assistant…"
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

      {/* ------------------------------------------------ Booking & availability */}
      <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={bookingEnabled}
            onChange={(e) => setBookingEnabled(e.target.checked)}
            className="mt-1 h-5 w-5 accent-brand-600"
          />
          <span>
            <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Let the AI book appointments directly
            </span>
            <span className="block text-sm text-slate-500 dark:text-slate-400">
              The AI offers real open slots from your hours below and books on the spot —
              you get a text for every booking. When off, it takes a request for you to confirm.
            </span>
          </span>
        </label>

        <div className={`mt-4 space-y-4 ${bookingEnabled ? "" : "opacity-50"}`}>
          <div className="grid gap-3 sm:grid-cols-3">
            <SelectField
              id="ai-slot"
              label="Appointment length"
              value={String(slotMinutes)}
              onChange={(e) => setSlotMinutes(Number(e.target.value))}
              disabled={!bookingEnabled}
            >
              {[30, 45, 60, 90, 120].map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </SelectField>
            <SelectField
              id="ai-buffer"
              label="Buffer between bookings"
              value={String(bufferMinutes)}
              onChange={(e) => setBufferMinutes(Number(e.target.value))}
              disabled={!bookingEnabled}
            >
              {[0, 15, 30, 45, 60].map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </SelectField>
            <SelectField
              id="ai-horizon"
              label="Bookable ahead"
              value={String(daysAhead)}
              onChange={(e) => setDaysAhead(Number(e.target.value))}
              disabled={!bookingEnabled}
            >
              {[7, 14, 21, 30].map((d) => (
                <option key={d} value={d}>
                  {d} days
                </option>
              ))}
            </SelectField>
          </div>

          <fieldset disabled={!bookingEnabled}>
            <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Business hours the AI can book in
            </legend>
            <div className="mt-2 space-y-1.5">
              {DAYS.map((d) => {
                const h = hours[d.key];
                return (
                  <div key={d.key} className="flex items-center gap-3 text-sm">
                    <span className="w-24 shrink-0 text-slate-600 dark:text-slate-400">
                      {d.label}
                    </span>
                    <label className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <input
                        type="checkbox"
                        checked={h.closed}
                        onChange={(e) => setDay(d.key, { closed: e.target.checked })}
                        className="h-4 w-4 accent-brand-600"
                      />
                      Closed
                    </label>
                    {!h.closed && (
                      <>
                        <input
                          type="time"
                          aria-label={`${d.label} opens`}
                          value={h.open}
                          onChange={(e) => setDay(d.key, { open: e.target.value })}
                          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
                        />
                        <span className="text-slate-400">–</span>
                        <input
                          type="time"
                          aria-label={`${d.label} closes`}
                          value={h.close}
                          onChange={(e) => setDay(d.key, { close: e.target.value })}
                          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </fieldset>
        </div>
      </div>

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
