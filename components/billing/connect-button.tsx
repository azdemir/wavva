"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { startConnectOnboarding } from "@/lib/actions/billing";

export function ConnectButton({ baseUrl }: { baseUrl: string }) {
  const t = useTranslations("billing");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function start() {
    setPending(true);
    setError(null);
    const result = await startConnectOnboarding(baseUrl);
    if (result.error) {
      setError(result.error);
      setPending(false);
    } else if (result.url) {
      window.location.href = result.url;
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <Button onClick={start} disabled={pending}>
        {pending ? t("buttons.connecting") : t("buttons.connect")}
      </Button>
    </div>
  );
}
