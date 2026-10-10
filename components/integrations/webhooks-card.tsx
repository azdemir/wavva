"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getIntegrationState,
  saveZapierWebhook,
  updateZapierWebhook,
  deleteZapierWebhook,
  testZapierWebhook,
  type IntegrationWebhook,
} from "@/lib/actions/integrations";
import type { EVENT_CATALOG } from "@/lib/integrations/webhooks";

type EventItem = (typeof EVENT_CATALOG)[number];

function useErrorText() {
  const t = useTranslations("integrations");
  return (code: string | undefined): string | null => {
    if (!code) return null;
    const normalized = code.startsWith("TEST_FAILED") ? "TEST_FAILED" : code;
    const key = `errors.${normalized}`;
    try {
      const translated = t(key);
      if (translated !== key) return translated;
    } catch {
      // fall through
    }
    return code;
  };
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function WebhooksCard({
  initial,
  events,
}: {
  initial: IntegrationWebhook[];
  events: readonly EventItem[];
}) {
  const t = useTranslations("integrations");
  const errorText = useErrorText();
  const [webhooks, setWebhooks] = useState(initial);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function refresh() {
    const state = await getIntegrationState();
    if (!state.setupRequired) setWebhooks(state.webhooks);
  }

  function toggleEvent(event: string) {
    setPicked((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  }

  async function handleAdd() {
    setAdding(true);
    setError(null);
    setNotice(null);
    const result = await saveZapierWebhook({ name, url, events: picked });
    setAdding(false);
    if (result.error) {
      setError(errorText(result.error));
      return;
    }
    setName("");
    setUrl("");
    setPicked([]);
    await refresh();
  }

  async function handleToggle(hook: IntegrationWebhook) {
    setBusyId(hook.id);
    setError(null);
    const result = await updateZapierWebhook(hook.id, { active: !hook.active });
    if (result.error) setError(errorText(result.error));
    else await refresh();
    setBusyId(null);
  }

  async function handleDelete(hook: IntegrationWebhook) {
    if (!window.confirm(t("webhooks.deleteConfirm"))) return;
    setBusyId(hook.id);
    setError(null);
    const result = await deleteZapierWebhook(hook.id);
    if (result.error) setError(errorText(result.error));
    else await refresh();
    setBusyId(null);
  }

  async function handleTest(hook: IntegrationWebhook) {
    setBusyId(hook.id);
    setError(null);
    setNotice(null);
    const result = await testZapierWebhook(hook.id);
    setBusyId(null);
    if (result.error) {
      setError(errorText(result.error));
      return;
    }
    setNotice(t("webhooks.testSent"));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("webhooks.title")}</CardTitle>
        <CardDescription>{t("webhooks.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {t("webhooks.setupTitle")}
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-400">
            {[0, 1, 2, 3].map((i) => (
              <li key={i}>{t(`webhooks.setupSteps.${i}`)}</li>
            ))}
          </ol>
        </div>

        {webhooks.length > 0 ? (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {webhooks.map((hook) => (
              <li key={hook.id} className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{hook.name}</p>
                    <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      {hook.urlMasked}
                    </p>
                  </div>
                  <Badge tone={hook.active ? "brand" : "slate"}>
                    {hook.active ? t("webhooks.active") : t("webhooks.paused")}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {hook.events.map((e) => (
                    <Badge key={e} tone="slate">
                      {(() => {
                        const catalogEntry = events.find((c) => c.event === e);
                        const key = catalogEntry
                          ? catalogEntry.descriptionKey
                          : `events.${e}`;
                        try {
                          return t(key);
                        } catch {
                          return e;
                        }
                      })()}
                    </Badge>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {hook.lastTriggeredAt
                    ? t("webhooks.lastTriggered", { date: formatDate(hook.lastTriggeredAt) ?? "" })
                    : t("webhooks.neverTriggered")}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTest(hook)}
                    disabled={busyId === hook.id}
                  >
                    {busyId === hook.id ? t("webhooks.testing") : t("webhooks.test")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggle(hook)}
                    disabled={busyId === hook.id}
                  >
                    {hook.active ? t("webhooks.paused") : t("webhooks.active")}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(hook)}
                    disabled={busyId === hook.id}
                  >
                    {busyId === hook.id ? t("webhooks.deleting") : t("webhooks.delete")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t("webhooks.none")}</p>
        )}

        <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {t("webhooks.addTitle")}
          </p>
          <Field
            id="wh-name"
            label={t("webhooks.nameLabel")}
            placeholder={t("webhooks.namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Field
            id="wh-url"
            label={t("webhooks.urlLabel")}
            placeholder={t("webhooks.urlPlaceholder")}
            type="url"
            autoComplete="off"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <fieldset>
            <legend className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("webhooks.eventsLabel")}
            </legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {events.map((e) => {
                const checked = picked.includes(e.event);
                const label = (() => {
                  try {
                    return t(e.descriptionKey);
                  } catch {
                    return e.event;
                  }
                })();
                const desc = (() => {
                  try {
                    return t(`${e.descriptionKey}Desc`);
                  } catch {
                    return null;
                  }
                })();
                return (
                  <label
                    key={e.event}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-sm ${
                      checked
                        ? "border-brand-500 bg-brand-50 dark:border-brand-600 dark:bg-brand-950"
                        : "border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 accent-brand-600"
                      checked={checked}
                      onChange={() => toggleEvent(e.event)}
                    />
                    <span>
                      <span className="block font-medium text-slate-900 dark:text-white">
                        {label}
                      </span>
                      {desc && (
                        <span className="block text-xs text-slate-500 dark:text-slate-400">
                          {desc}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <Button
            onClick={handleAdd}
            disabled={adding || !name.trim() || !url.trim() || picked.length === 0}
          >
            {adding ? t("webhooks.adding") : t("webhooks.add")}
          </Button>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        {notice && (
          <p className="text-sm text-emerald-700 dark:text-emerald-400">{notice}</p>
        )}
      </CardContent>
    </Card>
  );
}
