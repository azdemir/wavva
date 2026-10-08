import type { HTMLAttributes } from "react";

type Tone = "brand" | "accent" | "amber" | "red" | "slate";

const toneStyles: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-700 ring-brand-200",
  accent: "bg-accent-50 text-accent-700 ring-accent-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
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

/** Status pill used across scheduling, jobs, quotes, and invoices. */
export function JobStatusPill({ status }: { status: JobStatus }) {
  return <Badge tone={jobStatusTone[status]}>{jobStatusLabel[status]}</Badge>;
}
