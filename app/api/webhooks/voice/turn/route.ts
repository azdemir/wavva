import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  isVoiceConfigured,
  twimlGatherTurn,
  twimlNotConfigured,
  twimlSayAndHangup,
  verifyTwilioSignature,
} from "@/lib/front-office/providers/voice";
import {
  runAiTurn,
  type AiCompanyContext,
  type AiTurn,
} from "@/lib/front-office/ai-brain";

/**
 * Twilio speech-gather callback: <site>/api/webhooks/voice/turn?callSid=…
 *
 * Each caller utterance arrives as SpeechResult. We append it to the call
 * transcript, run the AI brain (quote from price list / booking request /
 * escalate), and answer with <Say> + another <Gather>. Empty speech twice
 * in a row ends the call politely.
 */

const MAX_TURNS = 24;

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

  const callSid = new URL(request.url).searchParams.get("callSid") || params.CallSid || "";
  const speech = (params.SpeechResult || "").trim();
  const turnUrl = request.url.split("?")[0] + `?callSid=${encodeURIComponent(callSid)}`;

  const svc = await createServiceClient();
  const { data: call } = await svc
    .from("front_office_ai_calls")
    .select("id, company_id, from_number, transcript")
    .eq("call_sid", callSid)
    .maybeSingle();

  if (!call) {
    return new NextResponse(twimlSayAndHangup("Sorry, something went wrong. Goodbye."), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }

  const transcript = (call.transcript ?? []) as AiTurn[];
  const callerTurns = transcript.filter((t) => t.role === "caller").length;

  // Two silent gathers in a row → wrap up. Silence is tracked as trailing
  // "(no speech detected)" turns in the transcript (serverless-safe).
  let trailingSilence = 0;
  for (let i = transcript.length - 1; i >= 0; i--) {
    const t = transcript[i];
    if (t.role === "assistant" && t.text === "(no speech detected)") trailingSilence++;
    else break;
  }
  if (!speech) {
    if (trailingSilence >= 1 || callerTurns >= MAX_TURNS) {
      return new NextResponse(
        twimlSayAndHangup("Thanks for calling. Goodbye."),
        { status: 200, headers: { "Content-Type": "text/xml" } },
      );
    }
    await svc
      .from("front_office_ai_calls")
      .update({ transcript: [...transcript, { role: "assistant", text: "(no speech detected)" }] })
      .eq("id", call.id);
    return new NextResponse(
      twimlGatherTurn("Sorry, I didn't catch that. Could you say it again?", turnUrl),
      { status: 200, headers: { "Content-Type": "text/xml" } },
    );
  }

  const { data: settings } = await svc
    .from("front_office_settings")
    .select(
      "ai_model, owner_phone, price_list, service_area, policies, timezone",
    )
    .eq("company_id", call.company_id)
    .maybeSingle();
  const { data: company } = await svc
    .from("companies")
    .select("name")
    .eq("id", call.company_id)
    .maybeSingle();

  if (!settings || !process.env.OPENAI_API_KEY) {
    return new NextResponse(
      twimlSayAndHangup(
        "Thanks for calling. Someone from the team will get back to you shortly. Goodbye.",
      ),
      { status: 200, headers: { "Content-Type": "text/xml" } },
    );
  }

  // Booking flag lives behind migration 0022 — fetch it separately so calls
  // keep working if the owner hasn't run that migration yet.
  let bookingEnabled = false;
  try {
    const { data: sched } = await svc
      .from("front_office_settings")
      .select("ai_booking_enabled")
      .eq("company_id", call.company_id)
      .maybeSingle();
    bookingEnabled = sched?.ai_booking_enabled === true;
  } catch {
    bookingEnabled = false;
  }

  const ctx: AiCompanyContext = {
    companyId: call.company_id,
    companyName: company?.name ?? "our business",
    priceList: (settings.price_list ?? []) as AiCompanyContext["priceList"],
    serviceArea: settings.service_area ?? "",
    policies: settings.policies ?? "",
    timezone: settings.timezone ?? "America/New_York",
    aiModel: settings.ai_model === "gpt-4o" ? "gpt-4o" : "gpt-4o-mini",
    ownerPhone: settings.owner_phone ?? "",
    bookingEnabled,
  };

  const nextTranscript: AiTurn[] = [...transcript, { role: "caller", text: speech }];

  let result;
  try {
    result = await runAiTurn(svc, ctx, call.id, call.from_number, nextTranscript);
  } catch {
    return new NextResponse(
      twimlSayAndHangup(
        "Thanks for calling. Someone from the team will get back to you shortly. Goodbye.",
      ),
      { status: 200, headers: { "Content-Type": "text/xml" } },
    );
  }

  nextTranscript.push({ role: "assistant", text: result.reply });
  const update: Record<string, unknown> = {
    transcript: nextTranscript,
    outcome: result.summaryNote,
  };
  if (result.escalated) update.escalated = true;
  await svc.from("front_office_ai_calls").update(update).eq("id", call.id);

  if (result.endCall || callerTurns + 1 >= MAX_TURNS) {
    return new NextResponse(twimlSayAndHangup(result.reply), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }

  return new NextResponse(twimlGatherTurn(result.reply, turnUrl), {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
