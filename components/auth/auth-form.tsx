"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import type { AuthResult } from "@/lib/actions/auth";

type AuthFormProps = {
  action: (formData: FormData) => Promise<AuthResult>;
  submitLabel: string;
  pendingLabel: string;
  /** Optional post-login redirect, e.g. an invite link. */
  nextPath?: string;
};

/** Shared email/password form for sign-in and sign-up. */
export function AuthForm({ action, submitLabel, pendingLabel, nextPath }: AuthFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      action={async (formData) => {
        setPending(true);
        setError(null);
        const result = await action(formData);
        // A successful action redirects (never returns). A return means error.
        setPending(false);
        if (result?.error) setError(result.error);
      }}
      className="space-y-4"
    >
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}
      {nextPath && <input type="hidden" name="next" value={nextPath} />}
      <Field
        id="auth-email"
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@company.com"
        required
      />
      <Field
        id="auth-password"
        label="Password"
        name="password"
        type="password"
        autoComplete={submitLabel === "Sign in" ? "current-password" : "new-password"}
        placeholder="••••••••"
        required
        minLength={6}
      />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
