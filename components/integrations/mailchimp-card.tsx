"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field, SelectField } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  connectMailchimp,
  disconnectMailchimp,
  setMailchimpAudience,
  syncMailchimpCustomers,
  type MailchimpState,
} from "@/lib/actions/integrations";

/** Map action error codes to translated strings; raw API errors pass through. */
function useErrorText() {
  const t = useTranslations("integrations");
  return (code: string | undefined): string | null => {
    if (!code) return null;
    const key = `errors.${code}`;
    try {
      const translated = t(key);
      // next-intl returns the key itself when missing — fall back to the raw message.
      if (translated !== key) return translated;
    } catch {
      // fall through
    }
    return code;
  };
}

export function MailchimpCard({ initial }: { initial: MailchimpState }) {
  const t = useTranslations("integrations");
  const errorText = useErrorText();
  const [connected, setConnected] = useState(initial.connected);
  const [accountName, setAccountName] = useState(initial.accountName);
  const [audiences, setAudiences] = useState(initial.audiences);
  const [audienceId, setAudienceId] = useState(initial.audienceId ?? "");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);

  async function handleConnect() {
    setBusy(true);
    setError(null);
    setNotice(null);
    const result = await connectMailchimp(apiKey);
    setBusy(false);
    if (result.error) {
      setError(errorText(result.error));
      return;
    }
    setConnected(true);
    setAudiences(result.audiences ?? []);
    setApiKey("");
    if (result.audiences && result.audiences.length === 0) {
      setNotice(t("mailchimp.needAudience"));
    }
  }

  async function handleDisconnect() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await disconnectMailchimp();
    setBusy(false);
    if (result.error) {
      setError(errorText(result.error));
      return;
    }
    setConnected(false);
    setAccountName(null);
    setAudiences([]);
    setAudienceId("");
    setNotice(null);
  }

  async function handleSaveAudience() {
    const audience = audiences.find((a) => a.id === audienceId);
    if (!audience || busy) return;
    setBusy(true);
    setError(null);
    const result = await setMailchimpAudience(audience.id, audience.name);
    setBusy(false);
    if (result.error) {
      setError(errorText(result.error));
      return;
    }
    setNotice(t("mailchimp.audienceSaved"));
  }

  async function handleSync() {
    if (syncBusy) return;
    setSyncBusy(true);
    setError(null);
    setNotice(null);
    const result = await syncMailchimpCustomers();
    setSyncBusy(false);
    if (result.error) {
      setError(errorText(result.error));
      return;
    }
    setNotice(
      t("mailchimp.syncResult", {
        synced: result.synced ?? 0,
        skipped: result.skipped ?? 0,
        errors: result.errors ?? 0,
      }),
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{t("mailchimp.title")}</CardTitle>
          {connected && (
            <Badge tone="brand">{t("mailchimp.connected")}</Badge>
          )}
        </div>
        <CardDescription>{t("mailchimp.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!connected ? (
          <div className="space-y-3">
            <Field
              id="mc-api-key"
              label={t("mailchimp.apiKeyLabel")}
              hint={t("mailchimp.howTo")}
              type="password"
              autoComplete="off"
              placeholder={t("mailchimp.apiKeyPlaceholder")}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <Button onClick={handleConnect} disabled={busy || !apiKey.trim()}>
              {busy ? t("mailchimp.connecting") : t("mailchimp.connect")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {accountName && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t("mailchimp.account")}:{" "}
                <span className="font-medium text-slate-900 dark:text-white">{accountName}</span>
              </p>
            )}
            <SelectField
              id="mc-audience"
              label={t("mailchimp.audienceLabel")}
              value={audienceId}
              onChange={(e) => setAudienceId(e.target.value)}
            >
              <option value="">{t("mailchimp.audiencePlaceholder")}</option>
              {audiences.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — {t("mailchimp.contacts", { count: a.memberCount })}
                </option>
              ))}
            </SelectField>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleSaveAudience}
                disabled={busy || !audienceId}
              >
                {busy ? t("mailchimp.saving") : t("mailchimp.saveAudience")}
              </Button>
              <Button
                variant="outline"
                onClick={handleSync}
                disabled={syncBusy || !audienceId}
              >
                {syncBusy ? t("mailchimp.syncing") : t("mailchimp.sync")}
              </Button>
              <Button variant="danger" onClick={handleDisconnect} disabled={busy}>
                {busy ? t("mailchimp.disconnecting") : t("mailchimp.disconnect")}
              </Button>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t("mailchimp.note")}</p>
          </div>
        )}
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
