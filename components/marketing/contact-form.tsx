"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, TextareaField } from "@/components/ui/input";
import { sendContactMessage } from "@/lib/actions/contact";

export function ContactForm() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  if (sent) {
    return (
      <div
        role="status"
        className="rounded-lg border border-green-200 bg-green-50 px-4 py-6 text-center dark:border-green-900 dark:bg-green-950"
      >
        <p className="text-base font-semibold text-green-800 dark:text-green-200">
          Message sent!
        </p>
        <p className="mt-1 text-sm text-green-700 dark:text-green-300">
          Thanks for reaching out — we&apos;ll reply within one business day.
        </p>
      </div>
    );
  }

  return (
    <form
      action={async (formData) => {
        setPending(true);
        setError(null);
        const result = await sendContactMessage(formData);
        setPending(false);
        if (result?.error) setError(result.error);
        else setSent(true);
      }}
      className="space-y-4"
    >
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </div>
      )}
      <Field
        id="contact-name"
        name="name"
        label="Your name"
        type="text"
        autoComplete="name"
        placeholder="Jordan Smith"
        required
      />
      <Field
        id="contact-company"
        name="company"
        label="Company name"
        type="text"
        autoComplete="organization"
        placeholder="Capital Region Clean Co."
      />
      <Field
        id="contact-email"
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@company.com"
        required
      />
      <TextareaField
        id="contact-message"
        name="message"
        label="Message"
        placeholder="We run a 4-person residential cleaning crew in Albany and…"
        required
      />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
