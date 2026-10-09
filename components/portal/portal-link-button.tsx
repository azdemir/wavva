"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getOrCreatePortalLink, revokePortalLinks } from "@/lib/actions/portal";
import { sendPortalLinkEmail } from "@/lib/actions/portal-share";

/** Generate / show / share / revoke a customer's portal link (company staff only). */
export function PortalLinkButton({
  customerId,
  baseUrl,
  customerName,
  customerEmail,
  customerPhone,
}: {
  customerId: string;
  baseUrl: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
}) {
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [emailState, setEmailState] = useState<"idle" | "sending" | "sent" | "failed">("idle");

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
    setEmailState("idle");
  }

  async function sendEmail() {
    if (!link) return;
    setEmailState("sending");
    setError(null);
    const result = await sendPortalLinkEmail(customerId, link);
    if (result.ok) setEmailState("sent");
    else {
      setEmailState("failed");
      setError(result.error ?? "Could not send the email.");
    }
  }

  const smsBody = encodeURIComponent(
    `Hi ${customerName}, here's your customer portal link: ${link ?? ""} — view quotes, visits, and invoices. Please keep it private.`,
  );
  const smsHref = customerPhone
    ? `sms:${encodeURIComponent(customerPhone)}?&body=${smsBody}`
    : `sms:?&body=${smsBody}`;

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
          <div className="flex flex-wrap gap-2">
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
              onClick={sendEmail}
              disabled={emailState === "sending" || !customerEmail}
              title={customerEmail ? `Send to ${customerEmail}` : "No email on file"}
            >
              {emailState === "sending"
                ? "Sending…"
                : emailState === "sent"
                  ? "Email sent ✓"
                  : "Send via email"}
            </Button>
            <a
              href={smsHref}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 px-4 text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Send via text
            </a>
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
          {!customerEmail && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Add an email address to this customer to enable “Send via email”.
            </p>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">
            “Send via text” opens your messaging app with the link pre-filled —
            the text sends from your number. Anyone with this link can view
            quotes, bookings, and invoices for this customer — treat it like a
            password.
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
