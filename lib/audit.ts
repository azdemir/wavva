import type { SupabaseClient } from "@supabase/supabase-js";

type AuditInput = {
  company_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
};

/** Append-only audit log for important actions. Failures never block the action. */
export async function logAudit(
  supabase: SupabaseClient,
  input: AuditInput,
): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("audit_logs").insert({
      company_id: input.company_id,
      actor_user_id: user?.id ?? null,
      action: input.action,
      entity_type: input.entity_type,
      entity_id: input.entity_id ?? null,
      metadata: input.metadata ?? {},
    });
  } catch {
    // Audit logging must never break the user's action.
  }
}
