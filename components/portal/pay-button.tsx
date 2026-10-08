"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { portalCheckout } from "@/lib/actions/portal";

export function PayButton({
  token,
  invoiceId,
  baseUrl,
  label,
}: {
  token: string;
  invoiceId: string;
  baseUrl: string;
  label: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function pay() {
    setPending(true);
    setError(null);
    const result = await portalCheckout(token, invoiceId, baseUrl);
    if (result.error) {
      setError(result.error);
      setPending(false);
    } else if (result.url) {
      window.location.href = result.url;
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <Button onClick={pay} disabled={pending} className="w-full sm:w-auto">
        {pending ? "Redirecting…" : label}
      </Button>
    </div>
  );
}
