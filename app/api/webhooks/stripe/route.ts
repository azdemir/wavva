import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Stripe webhook endpoint: <site>/api/webhooks/stripe
 * Verifies the signature, then handles:
 * - checkout.session.completed → record the customer payment
 * - account.updated → mark the company's Connect onboarding complete
 *
 * Configure in the Stripe dashboard with STRIPE_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const svc = await createServiceClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      id: string;
      amount_total: number | null;
      payment_intent: string | null;
      metadata?: { invoice_id?: string; company_id?: string };
    };
    const invoiceId = session.metadata?.invoice_id;
    const companyId = session.metadata?.company_id;
    if (invoiceId && companyId && (session.amount_total ?? 0) > 0) {
      const amount = session.amount_total!;
      await svc.from("payments").insert({
        company_id: companyId,
        invoice_id: invoiceId,
        amount_cents: amount,
        status: "succeeded",
        provider: "stripe",
        provider_ref: session.payment_intent ?? session.id,
      });
      const { data: invoice } = await svc
        .from("invoices")
        .select("invoice_number, total_cents, amount_paid_cents, customer_id, customers(name, email), companies(name)")
        .eq("id", invoiceId)
        .single();
      if (invoice) {
        const paid = invoice.amount_paid_cents + amount;
        await svc
          .from("invoices")
          .update({
            amount_paid_cents: paid,
            status: paid >= invoice.total_cents ? "paid" : "sent",
          })
          .eq("id", invoiceId);

        const customer = Array.isArray(invoice.customers) ? invoice.customers[0] : invoice.customers;
        const company = Array.isArray(invoice.companies) ? invoice.companies[0] : invoice.companies;
        if (customer?.email) {
          const { enqueueNotification } = await import("@/lib/notifications/queue");
          await enqueueNotification(svc, {
            company_id: companyId,
            recipient_type: "customer",
            recipient_id: invoice.customer_id,
            channel: "email",
            template: "payment_received",
            payload: {
              email: customer.email,
              recipient_name: customer.name,
              company_name: company?.name ?? "Your cleaning company",
              amount_cents: amount,
              invoice_number: invoice.invoice_number,
            },
          });
        }
      }
      await svc.from("audit_logs").insert({
        company_id: companyId,
        actor_user_id: null,
        action: "invoice.payment_received",
        entity_type: "invoice",
        entity_id: invoiceId,
        metadata: { amount_cents: amount, provider: "stripe" },
      });
    }
  }

  if (event.type === "account.updated") {
    const account = event.data.object as { id: string; charges_enabled: boolean };
    if (account.charges_enabled) {
      await svc
        .from("companies")
        .update({ stripe_onboarded: true })
        .eq("stripe_account_id", account.id);
    }
  }

  return NextResponse.json({ received: true });
}
