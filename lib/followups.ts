/**
 * Automated quote follow-up ("quotes that follow up themselves").
 *
 * When a quote moves to "sent", touches are scheduled per the company's
 * settings (default: day 2 and day 5). The cron endpoint sends each touch
 * only while the quote is still "sent"; any terminal status change cancels
 * the remaining touches. Re-sending a quote re-schedules from scratch.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type FollowupConfig = { enabled: boolean; days: number[] };

export const DEFAULT_FOLLOWUP_DAYS = [2, 5];

export function getFollowupConfig(settings: unknown): FollowupConfig {
  const s = (settings ?? {}) as {
    followup_enabled?: boolean;
    followup_days?: unknown;
  };
  const raw = Array.isArray(s.followup_days) ? s.followup_days : DEFAULT_FOLLOWUP_DAYS;
  const days = raw
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0 && n <= 30)
    .slice(0, 3)
    .sort((a, b) => a - b);
  return {
    enabled: s.followup_enabled !== false,
    days: days.length > 0 ? days : DEFAULT_FOLLOWUP_DAYS,
  };
}

/** Schedule (or re-schedule) follow-up touches for a sent quote. */
export async function scheduleQuoteFollowups(
  supabase: SupabaseClient,
  companyId: string,
  quoteId: string,
): Promise<void> {
  try {
    // Re-send starts the sequence over: drop pending touches first.
    await supabase.from("quote_followups").delete().eq("quote_id", quoteId).is("sent_at", null);

    const { data: company } = await supabase
      .from("companies")
      .select("settings")
      .eq("id", companyId)
      .single();
    const cfg = getFollowupConfig(company?.settings);
    if (!cfg.enabled) return;

    const rows = cfg.days.map((day, i) => ({
      company_id: companyId,
      quote_id: quoteId,
      step: i + 1,
      scheduled_for: new Date(Date.now() + day * 86400000).toISOString(),
    }));
    await supabase.from("quote_followups").insert(rows);
  } catch {
    // Follow-ups must never break the user's action.
  }
}

/** Cancel pending touches — called when a quote is approved, declined, or expired. */
export async function cancelQuoteFollowups(
  supabase: SupabaseClient,
  quoteId: string,
): Promise<void> {
  try {
    await supabase.from("quote_followups").delete().eq("quote_id", quoteId).is("sent_at", null);
  } catch {
    // Best effort only.
  }
}

/**
 * Portal link for the cron (service-role; the user-scoped
 * getOrCreatePortalLink requires a session). Reuses a valid token or
 * creates one.
 */
export async function getPortalLinkForCron(
  svc: SupabaseClient,
  companyId: string,
  customerId: string,
  siteUrl: string,
): Promise<string | null> {
  try {
    const { data: tokens } = await svc
      .from("portal_tokens")
      .select("token, expires_at")
      .eq("company_id", companyId)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });
    const now = new Date();
    const valid = (tokens ?? []).find((t) => !t.expires_at || new Date(t.expires_at) > now);
    if (valid) return `${siteUrl}/p/${valid.token}`;
    const { data, error } = await svc
      .from("portal_tokens")
      .insert({ company_id: companyId, customer_id: customerId })
      .select("token")
      .single();
    if (error || !data) return null;
    return `${siteUrl}/p/${data.token}`;
  } catch {
    return null;
  }
}
