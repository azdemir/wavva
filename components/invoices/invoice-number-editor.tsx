"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { updateInvoiceNumber } from "@/lib/actions/invoices";

/** Inline invoice-number editor with an Edit/Save toggle. */
export function InvoiceNumberEditor({
  invoiceId,
  current,
}: {
  invoiceId: string;
  current: string;
}) {
  const t = useTranslations("invoices");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setError(null);
          setEditing(true);
        }}
        className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
      >
        {t("numberEditor.editNumber")}
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        const result = await updateInvoiceNumber(invoiceId, formData);
        if (result?.error) {
          setError(result.error);
        } else {
          setEditing(false);
        }
      }}
      className="flex flex-wrap items-end gap-2"
    >
      <div className="w-44">
        <Field
          id="invoice-number"
          name="invoice_number"
          label={t("numberEditor.invoiceNumber")}
          defaultValue={current}
          required
          maxLength={50}
        />
      </div>
      <Button type="submit" size="sm">
        {t("numberEditor.save")}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setError(null);
          setEditing(false);
        }}
      >
        {t("numberEditor.cancel")}
      </Button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}
