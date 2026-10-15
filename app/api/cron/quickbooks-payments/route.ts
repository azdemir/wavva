import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { isQuickBooksConfigured } from "@/lib/quickbooks/config";
import { pullPayments } from "@/lib/quickbooks/sync";

/**
 * Cron endpoint: pulls QuickBooks payments into TidyPro for every company
 * with an active connection. Schedule it daily (e.g. Vercel Cron, or any
 * scheduler hitting this URL with the CRON_SECRET bearer token).
 *
 *   GET /api/cron/quickbooks-payments  Authorization: Bearer <CRON_SECRET>
 *
 * No-ops entirely until QuickBooks is configured and at least one company
 * has connected (OAuth is deferred — see the integration spec).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isQuickBooksConfigured()) {
    return NextResponse.json({ ok: true, skipped: "quickbooks_not_configured" });
  }

  const svc = await createServiceClient();
  const { data: connections } = await svc
    .from("quickbooks_connections")
    .select("company_id")
    .eq("status", "active");

  let pulled = 0;
  const errors: { companyId: string; message: string }[] = [];
  for (const c of connections ?? []) {
    const companyId = c.company_id as string;
    try {
      const r = await pullPayments(companyId);
      pulled += r.pulled;
      if (!r.outcome.ok && r.outcome.reason === "error") {
        errors.push({ companyId, message: r.outcome.message ?? "unknown" });
      }
    } catch (err) {
      errors.push({
        companyId,
        message: err instanceof Error ? err.message : "unknown",
      });
    }
  }

  return NextResponse.json({
    ok: errors.length === 0,
    companies: (connections ?? []).length,
    pulled,
    errors,
  });
}
