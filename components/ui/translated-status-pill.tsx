import { getTranslations } from "next-intl/server";
import {
  JobStatusPill,
  QuoteStatusPill,
  InvoiceStatusPill,
  type JobStatus,
  type QuoteStatus,
  type InvoiceStatus,
} from "./badge";

/**
 * Translated status pills for the dashboard. The base pills in badge.tsx
 * stay translation-free (the customer portal renders them without an intl
 * provider); these wrappers look up the label from the "common" namespace.
 */
export async function TJobStatusPill({
  status,
  className,
}: {
  status: JobStatus;
  className?: string;
}) {
  const t = await getTranslations("common");
  return (
    <JobStatusPill
      status={status}
      className={className}
      label={t(`status.job.${status}`)}
    />
  );
}

export async function TQuoteStatusPill({
  status,
  className,
}: {
  status: QuoteStatus;
  className?: string;
}) {
  const t = await getTranslations("common");
  return (
    <QuoteStatusPill
      status={status}
      className={className}
      label={t(`status.quote.${status}`)}
    />
  );
}

export async function TInvoiceStatusPill({
  status,
  className,
}: {
  status: InvoiceStatus;
  className?: string;
}) {
  const t = await getTranslations("common");
  return (
    <InvoiceStatusPill
      status={status}
      className={className}
      label={t(`status.invoice.${status}`)}
    />
  );
}
