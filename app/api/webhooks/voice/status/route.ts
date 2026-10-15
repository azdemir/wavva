import { NextResponse } from "next/server";
import { updateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import {
  isVoiceConfigured,
  verifyTwilioSignature,
} from "@/lib/front-office/providers/voice";

/**
 * Twilio call status callback: <site>/api/webhooks/voice/status
 *
 * Set this as the StatusCallback URL on each Twilio business number
 * (with StatusCallbackEvent=completed). When a call finishes we record
 * the duration — this is what meters AI-answered minutes against the
 * plan's included minutes in the dashboard.
 */
export async function POST(request: Request) {
  if (!isVoiceConfigured()) {
    return NextResponse.json({ error: "Voice not configured" }, { status: 500 });
  }

  const form = await request.formData();
  const params: Record<string, string> = {};
  form.forEach((v, k) => {
    params[k] = String(v);
  });

  const signature = request.headers.get("x-twilio-signature");
  if (!verifyTwilioSignature(request.url, signature, params)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const callSid = params.CallSid ?? "";
  const status = params.CallStatus ?? "";
  const duration = parseInt(params.CallDuration ?? "0", 10) || 0;
  if (!callSid) return NextResponse.json({ error: "Missing CallSid" }, { status: 400 });

  if (status !== "completed") {
    return NextResponse.json({ ok: true, ignored: status });
  }

  const svc = await createServiceClient();
  const { data: call } = await svc
    .from("front_office_ai_calls")
    .select("id, company_id, from_number, outcome, escalated, started_at")
    .eq("call_sid", callSid)
    .maybeSingle();

  if (!call) return NextResponse.json({ ok: true, unknown: true });

  await svc
    .from("front_office_ai_calls")
    .update({ ended_at: new Date().toISOString(), duration_seconds: duration })
    .eq("id", call.id);

  // Mirror a summary into the conversation log for the dashboard + reports.
  const summary = [
    `AI-answered call from ${call.from_number || "unknown"} — ${Math.max(1, Math.round(duration / 60))} min`,
    call.outcome ? `Outcome: ${call.outcome}` : null,
    call.escalated ? "Escalated to owner." : null,
  ]
    .filter(Boolean)
    .join(" ");
  await svc.from("front_office_conversations").insert({
    company_id: call.company_id,
    channel: "call",
    direction: "in",
    body: summary,
  });

  // Refresh the dashboard's cached AI-answering view (minutes, recent calls).
  updateTag(`ai-answering:${call.company_id}`);

  return NextResponse.json({ ok: true });
}
