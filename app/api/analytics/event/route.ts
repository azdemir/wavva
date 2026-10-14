import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED = new Set(["cta_click", "application_submit", "wizard_complete"]);

/**
 * First-party analytics sink. Accepts a tiny { event, props } payload and
 * stores it in analytics_events. If Supabase isn't configured (or the
 * table doesn't exist yet), the event is dropped silently — analytics is
 * best-effort and must never break marketing pages.
 */
export async function POST(request: Request) {
  let body: { event?: string; props?: Record<string, string> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!body.event || !ALLOWED.has(body.event)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  try {
    const sb = await createClient();
    await sb.from("analytics_events").insert({
      event: body.event,
      props: body.props ?? {},
    });
  } catch {
    // Best-effort: swallow.
  }
  return NextResponse.json({ ok: true });
}
