"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Result = { error?: string; ok?: boolean };

/**
 * Destructive-action button with an in-DOM confirm dialog. Calls the given
 * server action and surfaces any returned error inline instead of failing
 * silently. Pass a server action (or inline "use server" wrapper) as `action`.
 *
 * Uses a real modal, not window.confirm(): native dialogs block the main
 * thread, can't be styled, and hang automated browsers.
 */
export function ConfirmActionButton({
  label,
  confirmMessage,
  confirmLabel,
  pendingLabel,
  action,
  onSuccess,
  variant = "outline",
  className = "",
  children,
}: {
  label: string;
  confirmMessage: string;
  confirmLabel?: string;
  pendingLabel?: string;
  action: () => Promise<Result | void>;
  /** Called after the action succeeds (no error). Use to refresh local state. */
  onSuccess?: () => void | Promise<void>;
  variant?: "outline" | "danger";
  className?: string;
  /** Custom trigger content (replaces the default Button). */
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open ]);

  async function onConfirm() {
    setPending(true);
    setError(null);
    try {
      const result = await action();
      if (result && result.error) {
        setError(result.error);
        setOpen(false);
      } else {
        setOpen(false);
        await onSuccess?.();
      }
      // Success either revalidates in place or navigates via redirect().
    } catch (e) {
      // A successful delete navigates away via redirect() — let that through.
      const digest = (e as { digest?: unknown })?.digest;
      if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) throw e;
      setError("Something went wrong. Please try again.");
      setOpen(false);
    } finally {
      setPending(false);
    }
  }

  function openDialog() {
    setError(null);
    setOpen(true);
  }

  return (
    <span className="inline-block">
      {children ? (
        <span
          role="button"
          tabIndex={0}
          aria-label={label}
          onClick={openDialog}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openDialog();
            }
          }}
          className={className}
        >
          {children}
        </span>
      ) : (
        <Button
          type="button"
          variant={variant}
          className={className}
          disabled={pending}
          onClick={openDialog}
        >
          {pending ? (pendingLabel ?? label) : label}
        </Button>
      )}
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {open && (
        // NOTE: the backdrop deliberately does NOT dismiss on click. A
        // destructive confirm dialog must not vanish from an errant click —
        // Cancel and the confirm button are the only exits (besides Escape).
        <span
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <span
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {confirmMessage}
            </p>
            <span className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                autoFocus
                disabled={pending}
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={pending}
                onClick={onConfirm}
              >
                {pending ? (pendingLabel ?? "Working…") : (confirmLabel ?? label)}
              </Button>
            </span>
          </span>
        </span>
      )}
    </span>
  );
}
