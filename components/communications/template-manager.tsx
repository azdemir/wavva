"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  VARIABLE_REGISTRY,
  renderString,
  type TemplateKey,
} from "@/lib/communications/templates";
import type { TemplateView } from "@/lib/actions/communications";
import {
  saveTemplateOverride,
  resetTemplateOverride,
} from "@/lib/actions/communications";

type Draft = {
  emailSubject: string;
  emailBody: string;
  smsBody: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
};

function draftFrom(view: TemplateView): Draft {
  return {
    emailSubject: view.emailSubject,
    emailBody: view.emailBody,
    smsBody: view.smsBody,
    emailEnabled: view.emailEnabled,
    smsEnabled: view.smsEnabled,
  };
}

/** Sample values for the live preview, from the variable registry. */
function previewValues(): Record<string, string> {
  const v: Record<string, string> = {};
  for (const doc of VARIABLE_REGISTRY) v[doc.name] = doc.sample;
  v.valid_until_sentence = " It's valid until Oct 24, 2026.";
  v.due_date_sentence = " Please pay by Oct 15, 2026.";
  return v;
}

function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        on ? "bg-brand-600" : "bg-slate-300 dark:bg-slate-700"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export function TemplateManager({
  templates,
}: {
  templates: TemplateView[];
}) {
  const t = useTranslations("communications");
  const [audience, setAudience] = useState<"customer" | "cleaner">("customer");
  const [selectedKey, setSelectedKey] = useState<TemplateKey | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [previewChannel, setPreviewChannel] = useState<"email" | "sms">("email");
  const [activeField, setActiveField] = useState<"emailSubject" | "emailBody" | "smsBody">("emailBody");
  const fieldRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});

  const list = useMemo(
    () => templates.filter((tpl) => tpl.audience === audience),
    [templates, audience],
  );
  const selected = list.find((tpl) => tpl.key === (selectedKey ?? list[0]?.key)) ?? list[0];
  const draft: Draft | null = selected
    ? (drafts[selected.key] ?? draftFrom(selected))
    : null;

  const values = useMemo(() => previewValues(), []);

  function updateDraft(patch: Partial<Draft>) {
    if (!selected) return;
    setDrafts((d) => ({ ...d, [selected.key]: { ...(d[selected.key] ?? draftFrom(selected)), ...patch } }));
  }

  function insertVariable(name: string) {
    if (!selected || !draft) return;
    const el = fieldRefs.current[activeField];
    const token = `{{${name}}}`;
    if (!el) {
      updateDraft({ [activeField]: (draft[activeField] ?? "") + token } as Partial<Draft>);
      return;
    }
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const next = el.value.slice(0, start) + token + el.value.slice(end);
    updateDraft({ [activeField]: next } as Partial<Draft>);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  }

  async function handleSave() {
    if (!selected || !draft) return;
    setSaving(selected.key);
    setNotice(null);
    try {
      const channels: ("email" | "sms")[] = selected.channels;
      for (const channel of channels) {
        const result = await saveTemplateOverride({
          key: selected.key,
          channel,
          subject: channel === "email" ? draft.emailSubject : undefined,
          body: channel === "email" ? draft.emailBody : draft.smsBody,
          enabled: channel === "email" ? draft.emailEnabled : draft.smsEnabled,
        });
        if (result.error) throw new Error(result.error);
      }
      setNotice({ kind: "ok", text: t("saved") });
      setDrafts((d) => {
        const next = { ...d };
        delete next[selected.key];
        return next;
      });
    } catch (e) {
      setNotice({ kind: "error", text: e instanceof Error ? e.message : t("saveFailed") });
    } finally {
      setSaving(null);
    }
  }

  async function handleReset() {
    if (!selected) return;
    setSaving(selected.key);
    setNotice(null);
    try {
      for (const channel of selected.channels) {
        const result = await resetTemplateOverride(selected.key, channel);
        if (result.error) throw new Error(result.error);
      }
      setDrafts((d) => {
        const next = { ...d };
        delete next[selected.key];
        return next;
      });
      setNotice({ kind: "ok", text: t("resetDone") });
    } catch (e) {
      setNotice({ kind: "error", text: e instanceof Error ? e.message : t("saveFailed") });
    } finally {
      setSaving(null);
    }
  }

  const dirty =
    selected && draft
      ? draft.emailSubject !== selected.emailSubject ||
        draft.emailBody !== selected.emailBody ||
        draft.smsBody !== selected.smsBody ||
        draft.emailEnabled !== selected.emailEnabled ||
        draft.smsEnabled !== selected.smsEnabled
      : false;

  const emailPreviewHtml = selected
    ? renderString(draft?.emailBody ?? selected.emailBody, values, { escape: true })
    : "";
  const emailPreviewSubject = selected
    ? renderString(draft?.emailSubject ?? selected.emailSubject, values, { escape: true })
    : "";
  const smsPreview = selected
    ? renderString(draft?.smsBody ?? selected.smsBody, values, { escape: false })
    : "";

  return (
    <div className="space-y-6">
      {/* Audience tabs */}
      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
        {(["customer", "cleaner"] as const).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => {
              setAudience(a);
              setSelectedKey(null);
              setNotice(null);
            }}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              audience === a
                ? "bg-brand-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            {t(`audience.${a}`)}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Template list */}
        <Card>
          <CardContent className="p-2">
            <ul className="space-y-1">
              {list.map((tpl) => {
                const active = selected?.key === tpl.key;
                const customized = tpl.emailCustomized || tpl.smsCustomized;
                const disabled =
                  (tpl.channels.includes("email") && !tpl.emailEnabled) ||
                  (tpl.channels.includes("sms") && !tpl.smsEnabled);
                return (
                  <li key={tpl.key}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedKey(tpl.key);
                        setNotice(null);
                        setPreviewChannel("email");
                      }}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                        active
                          ? "bg-brand-50 font-semibold text-brand-900 dark:bg-brand-950 dark:text-brand-100"
                          : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate">{tpl.label}</span>
                        <span className="block text-xs font-normal text-slate-400">
                          {tpl.channels.includes("email") ? "✉️ " : ""}
                          {tpl.channels.includes("sms") ? "💬 " : ""}
                          {customized ? t("customized") : t("default")}
                        </span>
                      </span>
                      {disabled && (
                        <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          {t("off")}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        {/* Editor */}
        {selected && draft && (
          <div className="space-y-6">
            <Card>
              <CardContent className="space-y-5 pt-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {selected.label}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {selected.description}
                  </p>
                </div>

                {notice && (
                  <div
                    role="alert"
                    className={`rounded-lg border px-4 py-3 text-sm ${
                      notice.kind === "ok"
                        ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300"
                        : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
                    }`}
                  >
                    {notice.text}
                  </div>
                )}

                {/* Variable chips */}
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t("variablesHint")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.variables.map((name) => {
                      const doc = VARIABLE_REGISTRY.find((d) => d.name === name);
                      return (
                        <button
                          key={name}
                          type="button"
                          title={doc?.description ?? name}
                          onClick={() => insertVariable(name)}
                          className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs text-brand-700 hover:border-brand-300 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-800 dark:text-brand-300 dark:hover:border-brand-700 dark:hover:bg-brand-950"
                        >
                          {`{{${name}}}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Email channel */}
                {selected.channels.includes("email") && (
                  <div className="space-y-4 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        ✉️ {t("emailChannel")}
                      </h3>
                      <Toggle
                        on={draft.emailEnabled}
                        onChange={(v) => updateDraft({ emailEnabled: v })}
                        label={t("enableEmail")}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t("subjectLabel")}
                      </label>
                      <input
                        ref={(el) => {
                          fieldRefs.current.emailSubject = el;
                        }}
                        type="text"
                        value={draft.emailSubject}
                        onFocus={() => setActiveField("emailSubject")}
                        onChange={(e) => updateDraft({ emailSubject: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t("bodyLabel")}
                      </label>
                      <textarea
                        ref={(el) => {
                          fieldRefs.current.emailBody = el;
                        }}
                        rows={8}
                        value={draft.emailBody}
                        onFocus={() => setActiveField("emailBody")}
                        onChange={(e) => updateDraft({ emailBody: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                      <p className="mt-1 text-xs text-slate-400">{t("htmlHint")}</p>
                    </div>
                  </div>
                )}

                {/* SMS channel */}
                {selected.channels.includes("sms") && (
                  <div className="space-y-4 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        💬 {t("smsChannel")}
                      </h3>
                      <Toggle
                        on={draft.smsEnabled}
                        onChange={(v) => updateDraft({ smsEnabled: v })}
                        label={t("enableSms")}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t("smsLabel")}
                      </label>
                      <textarea
                        ref={(el) => {
                          fieldRefs.current.smsBody = el;
                        }}
                        rows={4}
                        maxLength={1000}
                        value={draft.smsBody}
                        onFocus={() => setActiveField("smsBody")}
                        onChange={(e) => updateDraft({ smsBody: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                      <p className="mt-1 text-xs text-slate-400">
                        {t("smsCount", { count: draft.smsBody.length })}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="primary"
                    disabled={!dirty || saving !== null}
                    onClick={handleSave}
                  >
                    {saving === selected.key ? t("saving") : t("save")}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleReset} disabled={saving !== null}>
                    {t("resetDefault")}
                  </Button>
                  {!draft.emailEnabled && !draft.smsEnabled && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">{t("allDisabledHint")}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Live preview */}
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {t("previewTitle")}
                  </h3>
                  <div className="inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
                    {(["email", "sms"] as const)
                      .filter((c) => selected.channels.includes(c))
                      .map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setPreviewChannel(c)}
                          className={`rounded-md px-3 py-1 text-xs font-medium ${
                            previewChannel === c
                              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {c === "email" ? "✉️ Email" : "💬 SMS"}
                        </button>
                      ))}
                  </div>
                </div>
                {previewChannel === "email" && selected.channels.includes("email") ? (
                  <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {emailPreviewSubject}
                      </p>
                    </div>
                    <div
                      className="prose prose-sm max-w-none bg-white px-4 py-3 text-slate-700 dark:bg-slate-900 dark:text-slate-300"
                      dangerouslySetInnerHTML={{ __html: emailPreviewHtml }}
                    />
                  </div>
                ) : (
                  <div className="mx-auto max-w-sm rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                    <div className="rounded-xl rounded-tl-sm bg-white px-3 py-2 text-sm text-slate-800 shadow-sm dark:bg-slate-700 dark:text-slate-100">
                      {smsPreview}
                    </div>
                  </div>
                )}
                <p className="text-xs text-slate-400">{t("previewHint")}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
