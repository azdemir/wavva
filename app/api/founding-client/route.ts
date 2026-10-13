import { NextResponse } from "next/server";
import { Resend } from "resend";
import { foundingApplicationSchema } from "@/lib/validation";
import { rateLimit, limits, rateLimitError } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/server";
import { FRONT_OFFICE, FRONT_OFFICE_PLANS } from "@/lib/front-office";

/**
 * Public founding-client application endpoint.
 *
 *   POST /api/founding-client  { company_name, owner_name, phone, email,
 *     city, crew_count, current_tools, plan_interest }
 *
 * Validates with zod, rate-limits per IP, stores the application, and emails
 * a notification to CONTACT_EMAIL. The email send is env-gated and
 * best-effort: a missing RESEND_API_KEY logs a line instead of failing the
 * submission.
 */
export async function POST(request: Request) {
  const rl = await rateLimit("founding-client", limits.spammy.max, limits.spammy.windowMs);
  if (!rl.allowed) {
    const { error } = rateLimitError(rl.resetIn);
    return NextResponse.json({ error }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = foundingApplicationSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Please check the form and try again." },
      { status: 400 },
    );
  }
  const app = parsed.data;

  const svc = await createServiceClient();
  const { error: dbError } = await svc.from("founding_applications").insert({
    company_name: app.company_name,
    owner_name: app.owner_name,
    phone: app.phone,
    email: app.email,
    city: app.city,
    crew_count: app.crew_count,
    current_tools: app.current_tools,
    plan_interest: app.plan_interest,
  });
  if (dbError) {
    console.error("[founding-client] insert failed:", dbError.message);
    return NextResponse.json(
      { error: "We couldn't save your application. Please try again." },
      { status: 500 },
    );
  }

  // Owner notification — env-gated, best-effort.
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.log(
      `[founding-client] RESEND_API_KEY not set — skipping owner notification email for ${app.company_name} (${app.email}).`,
    );
  } else {
    try {
      const resend = new Resend(resendKey);
      const plan = FRONT_OFFICE_PLANS[app.plan_interest];
      await resend.emails.send({
        from: `TidyPro <no-reply@${new URL(FRONT_OFFICE.SITE_URL).hostname}>`,
        to: FRONT_OFFICE.CONTACT_EMAIL,
        subject: `New founding-client application: ${app.company_name}`,
        text: [
          `A new Front Office founding-client application was submitted.`,
          ``,
          `Company: ${app.company_name}`,
          `Owner: ${app.owner_name}`,
          `Phone: ${app.phone}`,
          `Email: ${app.email}`,
          `City: ${app.city}`,
          `Crews: ${app.crew_count}`,
          `Current tools: ${app.current_tools || "—"}`,
          `Plan interest: ${plan.name} ($${plan.price}/mo)`,
        ].join("\n"),
      });
    } catch (err) {
      console.error("[founding-client] notification email failed:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
