import type { HTMLAttributes } from "react";

type Tone = "brand" | "accent" | "amber" | "red" | "slate";

const toneStyles: Record<Tone, string> = {
  brand:
    "bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-950 dark:text-brand-300 dark:ring-brand-800",
  accent:
    "bg-accent-50 text-accent-700 ring-accent-200 dark:bg-accent-950 dark:text-accent-300 dark:ring-accent-800",
  amber:
    "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800",
  red: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-800",
  slate:
    "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
};

export function Badge({ tone = "slate", className = "", ...rest }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${toneStyles[tone]} ${className}`}
      {...rest}
    />
  );
}

export type JobStatus = "scheduled" | "in_progress" | "completed" | "canceled";

const jobStatusTone: Record<JobStatus, Tone> = {
  scheduled: "brand",
  in_progress: "amber",
  completed: "accent",
  canceled: "slate",
};

const jobStatusLabel: Record<JobStatus, string> = {
  scheduled: "Scheduled",
  in_progress: "In progress",
  completed: "Completed",
  canceled: "Canceled",
};

/**
 * Status pill used across scheduling, jobs, quotes, and invoices.
 * Pass `label` to render a translated label (dashboard); without it the
 * English default renders (used by the customer portal, which has no
 * intl provider).
 */
export function JobStatusPill({
  status,
  className,
  label,
}: {
  status: JobStatus;
  className?: string;
  label?: string;
}) {
  return (
    <Badge tone={jobStatusTone[status]} className={className}>
      {label ?? jobStatusLabel[status]}
    </Badge>
  );
}

/**
 * Human-friendly label for snake_case enum values: "in_progress" → "In progress".
 * Use instead of rendering raw status strings inside badges.
 */
export function statusLabel(status: string): string {
  return status
    .split("_")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export type QuoteStatus = "draft" | "sent" | "approved" | "declined" | "expired";

const quoteStatusTone: Record<QuoteStatus, Tone> = {
  draft: "slate",
  sent: "brand",
  approved: "accent",
  declined: "red",
  expired: "slate",
};

/** Status pill for quotes — one shared mapping across dashboard and portal. */
export function QuoteStatusPill({
  status,
  className,
  label,
}: {
  status: QuoteStatus;
  className?: string;
  label?: string;
}) {
  return (
    <Badge tone={quoteStatusTone[status]} className={className}>
      {label ?? statusLabel(status)}
    </Badge>
  );
}

export type InvoiceStatus = "draft" | "sent" | "overdue" | "paid" | "void";

const invoiceStatusTone: Record<InvoiceStatus, Tone> = {
  draft: "slate",
  sent: "brand",
  overdue: "red",
  paid: "accent",
  void: "slate",
};

/** Status pill for invoices — one shared mapping across dashboard and portal. */
export function InvoiceStatusPill({
  status,
  className,
  label,
}: {
  status: InvoiceStatus;
  className?: string;
  label?: string;
}) {
  return (
    <Badge tone={invoiceStatusTone[status]} className={className}>
      {label ?? statusLabel(status)}
    </Badge>
  );
}
