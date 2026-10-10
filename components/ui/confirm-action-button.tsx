"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Result = { error?: string; ok?: boolean } | void;

/**
 * Destructive-action button with a native confirm dialog. Calls the given
 * server action and surfaces any returned error inline instead of failing
 * silently. Pass a server action (or inline "use server" wrapper) as `action`.
 */
export function ConfirmActionButton({
  label,
  confirmMessage,
  pendingLabel,
  action,
  variant = "outline",
  className = "",
}: {
  label: string;
  confirmMessage: string;
  pendingLabel?: string;
  action: () => Promise<Result>;
  variant?: "outline" | "danger";
  className?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    if (!window.confirm(confirmMessage)) return;
    setPending(true);
    setError(null);
    try {
      const result = await action();
      if (result && result.error) setError(result.error);
      // Success either revalidates in place or navigates via redirect().
    } catch (e) {
      // A successful delete navigates away via redirect() — let that through.
      const digest = (e as { digest?: unknown })?.digest;
      if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) throw e;
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="inline-block">
      <Button
        type="button"
        variant={variant}
        className={className}
        disabled={pending}
        onClick={onClick}
      >
        {pending ? (pendingLabel ?? label) : label}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </span>
  );
}
