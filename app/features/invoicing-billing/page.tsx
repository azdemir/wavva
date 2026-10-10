import type { Metadata } from "next";
import { FeaturePage, type FeaturePageConfig } from "@/components/marketing/feature-page";
import {
  CardIcon,
  CheckIcon,
  ClockIcon,
  QuoteIcon,
} from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Invoicing & Billing Software for Cleaners — TidyPro",
  description:
    "TidyPro invoicing: professional invoices with editable numbers and print/PDF, online card payments, automatic overdue reminders, and per-customer payment history.",
  alternates: { canonical: "/features/invoicing-billing" },
};

const config: FeaturePageConfig = {
  slug: "invoicing-billing",
  heroEyebrow: "Features",
  heroTitle: "Invoicing & Billing",
  heroDescription:
    "Professional invoices with editable numbers, one-click online payments, and automatic reminders on overdue balances.",
  introEyebrow: "Why it matters",
  introTitle: "Invoices that get paid",
  introBody:
    "A cleaning business doesn't have a cash-flow problem — it has a follow-up problem. Invoices go out late, reminders never go out at all, and the balance creeps up. TidyPro turns a finished job into a paid invoice with almost no effort.",
  benefits: [
    {
      icon: QuoteIcon,
      title: "Professional invoices in seconds",
      body: "Generate an invoice from any completed job — line items, your company logo, and an editable invoice number that matches your books.",
    },
    {
      icon: ClockIcon,
      title: "Payment reminders on autopilot",
      body: "Overdue invoices get polite, automatic payment reminders. You stay the friendly cleaner; TidyPro plays the billing department.",
    },
    {
      icon: CardIcon,
      title: "Customers pay online",
      body: "Every invoice links to a secure Stripe checkout in the customer portal. Payments record themselves — no manual reconciliation.",
    },
  ],
  blocks: [
    {
      icon: QuoteIcon,
      kicker: "Create",
      title: "Invoices that look like you mean it",
      body: "Branded documents with your logo, clear line items, and numbering you control. Print them, save a PDF, or email them straight from TidyPro.",
      bullets: [
        "Editable invoice numbers to match your accounting",
        "Your company logo on every invoice and quote",
        "Print-ready and PDF export built in",
      ],
    },
    {
      icon: ClockIcon,
      kicker: "Collect",
      title: "Follow-up that never forgets",
      body: "Send the invoice and move on. TidyPro watches due dates and sends reminders on overdue balances automatically — and marks invoices paid the moment money arrives.",
      bullets: [
        "Automatic reminders on overdue invoices",
        "Partial payments recorded against the balance",
        "Payment status updates the moment Stripe confirms",
      ],
    },
    {
      icon: CheckIcon,
      kicker: "Track",
      title: "Every dollar accounted for",
      body: "See who owes what at a glance, with full payment history and lifetime value per customer. Revenue reports show exactly how the business is trending.",
      bullets: [
        "Outstanding balance dashboard across all customers",
        "Payment history and lifetime value per customer",
        "Revenue-by-month and job reports on Pro plans",
      ],
    },
  ],
  faqs: [
    {
      q: "Can I customize my invoice numbers?",
      a: "Yes. Invoice numbers are fully editable, so you can match your existing accounting sequence or start fresh — TidyPro keeps them unique going forward.",
    },
    {
      q: "How do customers pay their invoices?",
      a: "Each invoice includes a secure online payment link through Stripe. Customers pay by card in the portal, and the invoice is marked paid automatically — including partial payments.",
    },
    {
      q: "What happens when an invoice goes overdue?",
      a: "TidyPro's daily check finds unpaid invoices past their due date and sends polite payment reminders automatically, so you don't have to make awkward calls.",
    },
    {
      q: "Are revenue reports included?",
      a: "Revenue by month, jobs completed, outstanding balances, and top customers are available on Pro plans. Every plan includes per-invoice and per-customer payment history.",
    },
  ],
};

export default function InvoicingBillingPage() {
  return <FeaturePage config={config} />;
}
