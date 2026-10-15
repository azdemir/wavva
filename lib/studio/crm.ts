/**
 * Founder CRM — the SaaS's own lead/customer pipeline.
 *
 * CLIENT-SAFE: constants, types, and label helpers only. Server data access
 * lives in `./crm-server` so client components can import from here without
 * pulling `next/headers` into the browser bundle.
 */

export const CRM_STAGES = [
  { id: "new", label: "New", hint: "Fresh lead, not yet contacted" },
  { id: "contacted", label: "Contacted", hint: "Reached out, in conversation" },
  { id: "trial", label: "On trial", hint: "Actively trying Wavva" },
  { id: "customer", label: "Customer", hint: "Paying subscriber" },
  { id: "lost", label: "Lost", hint: "Went cold or chose otherwise" },
] as const;

export type CrmStage = (typeof CRM_STAGES)[number]["id"];

export function isCrmStage(v: unknown): v is CrmStage {
  return CRM_STAGES.some((s) => s.id === v);
}

export function crmStageLabel(stage: string): string {
  return CRM_STAGES.find((s) => s.id === stage)?.label ?? stage;
}

export const CRM_SOURCES = [
  { id: "manual", label: "Manual" },
  { id: "contact_form", label: "Contact form" },
  { id: "trial", label: "Trial request" },
  { id: "import", label: "Import" },
] as const;

export function crmSourceLabel(source: string): string {
  return CRM_SOURCES.find((s) => s.id === source)?.label ?? source;
}

export const CRM_ACTIVITY_KINDS = [
  { id: "note", label: "Note" },
  { id: "call", label: "Call" },
  { id: "email", label: "Email" },
  { id: "meeting", label: "Meeting" },
] as const;

export function isCrmActivityKind(v: unknown): v is string {
  return (
    CRM_ACTIVITY_KINDS.some((k) => k.id === v) || v === "stage_change"
  );
}

export type CrmContact = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  source: string;
  stage: string;
  deal_value_cents: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  activity_count?: number;
  last_activity_at?: string | null;
};

export type CrmActivity = {
  id: string;
  contact_id: string;
  kind: string;
  body: string;
  created_by_email: string | null;
  created_at: string;
};
