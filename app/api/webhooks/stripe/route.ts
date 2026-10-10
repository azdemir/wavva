import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { isPlanId } from "@/lib/plans";

/**
 * Stripe webhook endpoint: <site>/api/webhooks/stripe
 * Verifies the signature, then handles:
 * - checkout.session.completed (invoice) → record the customer payment
 * - checkout.session.completed (platform) → activate the company's TidyPro plan
 * - customer.subscription.updated / deleted → sync plan + status
 * - account.updated → mark the company's Connect onboarding complete
 *
 * Register this endpoint in the Stripe dashboard for BOTH Connect events
 * and Billing events, using STRIPE_WEBHOOK_SECRET.
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
      subscription: string | null;
      metadata?: { invoice_id?: string; company_id?: string; kind?: string; plan?: string };
    };

    // Platform subscription checkout (the cleaning company subscribing to TidyPro)
    if (session.metadata?.kind === "platform_billing" && session.metadata?.company_id) {
      const companyId = session.metadata.company_id;
      const plan = session.metadata.plan;
      let status: string | null = null;
      if (session.subscription) {
        const sub = (await stripe.subscriptions.retrieve(session.subscription)) as {
          status: string;
        };
        status = sub.status;
      }
      await svc
        .from("companies")
        .update({
          stripe_subscription_id: session.subscription,
          subscription_status: status ?? "active",
          ...(isPlanId(plan) ? { plan } : {}),
        })
        .eq("id", companyId);
      await svc.from("audit_logs").insert({
        company_id: companyId,
        actor_user_id: null,
        action: "billing.subscribed",
        entity_type: "company",
        entity_id: companyId,
        metadata: { plan, status: status ?? "active" },
      });
      return NextResponse.json({ received: true });
    }

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
        .select("invoice_number, total_cents, amount_paid_cents, status, customer_id, customers(name, email, phone, sms_consent), companies(name)")
        .eq("id", invoiceId)
        .single();
      if (invoice) {
        const paid = invoice.amount_paid_cents + amount;
        const nowPaid = paid >= invoice.total_cents && invoice.status !== "paid";
        await svc
          .from("invoices")
          .update({
            amount_paid_cents: paid,
            status: paid >= invoice.total_cents ? "paid" : "sent",
          })
          .eq("id", invoiceId);

        // Outgoing integration webhooks (Zapier etc.): never breaks the payment flow.
        if (nowPaid) {
          try {
            const { fireIntegrationEvent } = await import("@/lib/integrations/webhooks");
            const invCustomer = invoice.customers as { name?: string } | null;
            await fireIntegrationEvent(companyId, "invoice.paid", {
              invoice_id: invoiceId,
              invoice_number: invoice.invoice_number,
              amount_cents: paid,
              customer_name: invCustomer?.name ?? null,
            });
          } catch {
            // ignore — webhook delivery is best-effort
          }
        }

        const customer = Array.isArray(invoice.customers) ? invoice.customers[0] : invoice.customers;
        const company = Array.isArray(invoice.companies) ? invoice.companies[0] : invoice.companies;
        if (customer) {
          const { enqueueCustomerNotification } = await import("@/lib/communications/notify");
          await enqueueCustomerNotification(svc, {
            company_id: companyId,
            recipient_type: "customer",
            recipient_id: invoice.customer_id,
            template: "payment_received",
            payload: {
              recipient_name: customer.name,
              company_name: company?.name ?? "Your cleaning company",
              amount_cents: amount,
              invoice_number: invoice.invoice_number,
            },
            contact: {
              email: customer.email,
              phone: (customer as { phone?: string | null }).phone,
              smsConsent: (customer as { sms_consent?: boolean | null }).sms_consent ?? false,
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

  // Platform subscription lifecycle → keep the company's plan + status in sync.
  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const sub = event.data.object as {
      id: string;
      status: string;
      metadata?: { company_id?: string; plan?: string };
    };
    const plan = sub.metadata?.plan;
    const status = event.type === "customer.subscription.deleted" ? "canceled" : sub.status;
    const update: Record<string, string | null> = { subscription_status: status };
    if (isPlanId(plan)) update.plan = plan;
    if (event.type === "customer.subscription.deleted") update.stripe_subscription_id = null;
    const query = svc.from("companies").update(update).eq("stripe_subscription_id", sub.id);
    // Fallback: match by metadata if the subscription id was never stored.
    const { data: matched } = await query.select("id");
    if ((!matched || matched.length === 0) && sub.metadata?.company_id) {
      await svc.from("companies").update(update).eq("id", sub.metadata.company_id);
    }
    const { data: company } = await svc
      .from("companies")
      .select("id")
      .eq("stripe_subscription_id", sub.id)
      .maybeSingle();
    const companyId = company?.id ?? sub.metadata?.company_id;
    if (companyId) {
      await svc.from("audit_logs").insert({
        company_id: companyId,
        actor_user_id: null,
        action: "billing.subscription_changed",
        entity_type: "company",
        entity_id: companyId,
        metadata: { status, plan: plan ?? null },
      });
    }
  }

  return NextResponse.json({ received: true });
}
