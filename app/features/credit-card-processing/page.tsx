import type { Metadata } from "next";
import { FeaturePage, type FeaturePageConfig } from "@/components/marketing/feature-page";
import {
  CardIcon,
  CheckIcon,
  LockIcon,
  QuoteIcon,
} from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Credit Card Processing for Cleaning Businesses — TidyPro",
  description:
    "TidyPro credit card processing: customers pay invoices online through secure Stripe checkout. You never touch or store card numbers; payments reconcile automatically.",
  alternates: { canonical: "/features/credit-card-processing" },
};

const config: FeaturePageConfig = {
  slug: "credit-card-processing",
  heroEyebrow: "Features",
  heroTitle: "Credit Card Processing",
  heroDescription:
    "Customers pay invoices online through secure, Stripe-powered checkout — you never touch or store a card number.",
  introEyebrow: "Why it matters",
  introTitle: "Faster payments. Fewer excuses.",
  introBody:
    "Every extra step between the invoice and the payment costs you days. Checks get 'lost in the mail,' and bank transfers get forgotten. A card payment link on every invoice removes the friction — customers pay in under a minute, and the money lands in your account.",
  benefits: [
    {
      icon: CardIcon,
      title: "A checkout customers trust",
      body: "Invoices open a secure Stripe checkout in the customer portal. Familiar, fast, and mobile-friendly — no account needed on their end.",
    },
    {
      icon: CheckIcon,
      title: "Paid means paid — automatically",
      body: "The moment Stripe confirms a payment, the invoice is marked paid, the balance updates, and the customer gets confirmation. No data entry.",
    },
    {
      icon: LockIcon,
      title: "Security handled for you",
      body: "Card details go straight to Stripe's PCI-compliant systems. TidyPro never sees, touches, or stores card numbers.",
    },
  ],
  blocks: [
    {
      icon: CardIcon,
      kicker: "Checkout",
      title: "A payment link on every invoice",
      body: "Send the invoice and the payment option travels with it — in the portal, by email, or by text. Customers tap, pay, and get back to their day.",
      bullets: [
        "Secure Stripe checkout embedded in the customer portal",
        "Works on any phone — no app or account for customers",
        "Automatic receipts and confirmation messages",
      ],
    },
    {
      icon: QuoteIcon,
      kicker: "Settle",
      title: "Money in your account, not your inbox",
      body: "Connect your own Stripe account once, and payments settle directly to you. TidyPro tracks every payment against its invoice so your books stay clean.",
      bullets: [
        "Your own Stripe account — funds go straight to you",
        "Partial payments recorded against the invoice balance",
        "Failed payments surface clearly so you can follow up",
      ],
    },
    {
      icon: LockIcon,
      kicker: "Compliance",
      title: "PCI compliance, without the paperwork",
      body: "Because card data never passes through TidyPro's servers, your PCI scope stays minimal. Stripe handles the encryption, fraud checks, and compliance burden.",
      bullets: [
        "Card numbers go directly to Stripe — never stored by TidyPro",
        "Stripe's fraud detection on every transaction",
        "Standard Stripe processing fees apply; TidyPro adds no markup",
      ],
    },
  ],
  faqs: [
    {
      q: "Which payment processor does TidyPro use?",
      a: "Stripe. It's the industry standard for online card payments — reliable, secure, and trusted by millions of businesses.",
    },
    {
      q: "Do I need my own Stripe account?",
      a: "Yes — you connect your own Stripe account once during setup, and customer payments settle directly into it. It takes a few minutes and Stripe handles identity verification.",
    },
    {
      q: "Does TidyPro charge extra processing fees?",
      a: "No. TidyPro doesn't add any markup on card payments — you only pay Stripe's standard processing fees on top of your TidyPro plan.",
    },
    {
      q: "What happens if a customer's payment fails?",
      a: "The invoice stays open with its balance intact, and you'll see the failed attempt clearly so you can follow up with the customer or try another card.",
    },
  ],
};

export default function CreditCardProcessingPage() {
  return <FeaturePage config={config} />;
}
