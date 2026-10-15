"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { syncNowQuickBooks, disconnectQuickBooks } from "@/lib/actions/quickbooks";

export function QuickBooksButtons({
  connected,
  configured,
  companyName,
  lastSyncAt,
}: {
  connected: boolean;
  configured: boolean;
  companyName: string | null;
  lastSyncAt: string | null;
}) {
  const t = useTranslations("settings");
  const [busy, setBusy] = useState<"sync" | "disconnect" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSync() {
    setBusy("sync");
    setMessage(null);
    const r = await syncNowQuickBooks();
    setBusy(null);
    setMessage(
      r.ok
        ? t("quickbooks.synced", {
            customers: r.pushedCustomers ?? 0,
            invoices: r.pushedInvoices ?? 0,
            payments: r.pulledPayments ?? 0,
          })
        : t("quickbooks.error", { message: r.error ?? "" }),
    );
  }

  async function onDisconnect() {
    setBusy("disconnect");
    setMessage(null);
    const r = await disconnectQuickBooks();
    setBusy(null);
    setMessage(r.ok ? t("quickbooks.disconnected") : t("quickbooks.error", { message: r.error ?? "" }));
  }

  // OAuth is deferred: no live "Connect" yet. Show the pending state instead
  // of a button that goes nowhere.
  if (!configured || !connected) {
    return (
      <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
        {!configured ? t("quickbooks.awaitingSetup") : t("quickbooks.notConnected")}
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        {t("quickbooks.connectedTo", { company: companyName ?? "" })}
        {lastSyncAt
          ? ` · ${t("quickbooks.lastSync", { when: new Date(lastSyncAt).toLocaleString() })}`
          : ""}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={onSync} disabled={busy !== null}>
          {busy === "sync" ? t("quickbooks.syncing") : t("quickbooks.syncNow")}
        </Button>
        <ConfirmActionButton
          label={t("quickbooks.disconnect")}
          confirmMessage={t("quickbooks.confirmDisconnect")}
          pendingLabel={t("quickbooks.disconnecting")}
          variant="outline"
          action={onDisconnect}
        />
      </div>
      {message && (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{message}</p>
      )}
    </div>
  );
}
