import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  isVoiceConfigured,
  twimlGatherTurn,
  twimlNotConfigured,
  verifyTwilioSignature,
} from "@/lib/front-office/providers/voice";

/**
 * Twilio inbound voice webhook: <site>/api/webhooks/voice
 *
 * Register this URL as the Voice webhook on each Twilio business number.
 * Also set the number's StatusCallback URL to /api/webhooks/voice/status
 * so completed calls are metered.
 *
 * Flow: validate signature → resolve company by dialed number → log the
 * call → answer with the AI disclosure greeting + <Gather> for speech.
 * Each spoken turn posts to /api/webhooks/voice/turn.
 */

function digitsOnly(n: string): string {
  return (n || "").replace(/\D/g, "");
}

export async function POST(request: Request) {
  if (!isVoiceConfigured()) {
    return new NextResponse(twimlNotConfigured(), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
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
  const from = params.From ?? "";
  const to = params.To ?? "";
  if (!callSid || !to) {
    return NextResponse.json({ error: "Missing call fields" }, { status: 400 });
  }

  const svc = await createServiceClient();
  const { data: settings } = await svc
    .from("front_office_settings")
    .select("company_id, ai_answering_enabled, ai_greeting_override, business_line")
    .eq("ai_answering_enabled", true);

  const dialed = digitsOnly(to);
  const match = (settings ?? []).find(
    (s) => digitsOnly(s.business_line).endsWith(dialed.slice(-10)) && dialed.length >= 10,
  );

  if (!match) {
    return new NextResponse(twimlNotConfigured(), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }

  const { data: company } = await svc
    .from("companies")
    .select("name")
    .eq("id", match.company_id)
    .maybeSingle();
  const companyName = company?.name ?? "our business";

  // Log the call up front; the status webhook fills in duration at the end.
  await svc.from("front_office_ai_calls").upsert(
    {
      company_id: match.company_id,
      call_sid: callSid,
      from_number: from,
      transcript: [],
    },
    { onConflict: "call_sid" },
  );

  const greeting =
    match.ai_greeting_override?.trim() ||
    `Hi, thanks for calling ${companyName} — you're speaking with ${companyName}'s AI assistant. This call may be recorded for quality and training purposes.`;

  const turnUrl = new URL("/api/webhooks/voice/turn", request.url);
  turnUrl.searchParams.set("callSid", callSid);

  return new NextResponse(twimlGatherTurn(greeting, turnUrl.toString()), {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
