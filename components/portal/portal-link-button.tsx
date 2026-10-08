"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getOrCreatePortalLink, revokePortalLinks } from "@/lib/actions/portal";

/** Generate / show / revoke a customer's portal link (company staff only). */
export function PortalLinkButton({
  customerId,
  baseUrl,
}: {
  customerId: string;
  baseUrl: string;
}) {
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function generate() {
    setPending(true);
    setError(null);
    const result = await getOrCreatePortalLink(customerId, baseUrl);
    setPending(false);
    if (result.error) setError(result.error);
    else if (result.link) setLink(result.link);
  }

  async function revoke() {
    setPending(true);
    await revokePortalLinks(customerId);
    setPending(false);
    setLink(null);
  }

  return (
    <div className="space-y-3">
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {link ? (
        <div className="space-y-2">
          <code className="block break-all rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-300">
            {link}
          </code>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigator.clipboard?.writeText(link)}
            >
              Copy link
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
              onClick={revoke}
              disabled={pending}
            >
              Revoke links
            </Button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">
            Anyone with this link can view quotes, bookings, and invoices for
            this customer — treat it like a password.
          </p>
        </div>
      ) : (
        <Button type="button" variant="outline" onClick={generate} disabled={pending}>
          {pending ? "Generating…" : "Get portal link"}
        </Button>
      )}
    </div>
  );
}
