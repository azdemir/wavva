import type { Metadata } from "next";
import { FeaturePage, type FeaturePageConfig } from "@/components/marketing/feature-page";
import {
  BellIcon,
  CheckIcon,
  ClockIcon,
  QuoteIcon,
} from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Automated Reminders & Follow-ups for Cleaners — TidyPro",
  description:
    "TidyPro automated communications: booking confirmations, day-before reminders, quote follow-ups, and overdue payment nudges sent automatically by email and SMS.",
  alternates: { canonical: "/features/automated-communications" },
};

const config: FeaturePageConfig = {
  slug: "automated-communications",
  heroEyebrow: "Features",
  heroTitle: "Automated Communications",
  heroDescription:
    "Confirmations, reminders, and follow-ups go out automatically — by email and SMS — so no-shows and forgotten quotes stop costing you money.",
  introEyebrow: "Why it matters",
  introTitle: "Stop chasing confirmations",
  introBody:
    "Most no-shows aren't rude customers — they're forgotten appointments. And most lost quotes aren't rejections — they're quotes nobody followed up on. TidyPro sends the right message at the right time, every time, without you lifting a finger.",
  benefits: [
    {
      icon: BellIcon,
      title: "Day-before reminders cut no-shows",
      body: "Customers get an automatic reminder the day before each visit, with a simple way to confirm. Your cleaners get reminded too.",
    },
    {
      icon: QuoteIcon,
      title: "Quotes get followed up until they close",
      body: "Sent quotes are automatically followed up on your schedule until the customer approves, declines, or the quote expires.",
    },
    {
      icon: ClockIcon,
      title: "Overdue invoices nudge themselves",
      body: "A daily check finds unpaid invoices past their due date and sends polite payment reminders — no awkward phone calls.",
    },
  ],
  blocks: [
    {
      icon: BellIcon,
      kicker: "Templates",
      title: "14 templates, ready on day one",
      body: "Booking confirmations, reschedules, cancellations, job assignments, quote follow-ups, invoice reminders — the messages every cleaning business sends, pre-written with variables like customer name, date, and balance.",
      bullets: [
        "10 customer and 4 cleaner templates with {{variable}} personalization",
        "Preview every message as email and SMS before it sends",
        "Per-company overrides — make any template your own",
      ],
    },
    {
      icon: ClockIcon,
      kicker: "Triggers",
      title: "The right message at the right time",
      body: "Messages fire automatically from real events in your business — not from a marketing drip campaign. When something happens in TidyPro, the right people hear about it instantly.",
      bullets: [
        "Booking created, rescheduled, or canceled → customer notified",
        "Job assigned or completed → cleaner and customer updated",
        "Quote sent or approved, invoice sent or paid → instant updates",
        "Daily reminders: day-before visits and overdue payments",
      ],
    },
    {
      icon: CheckIcon,
      kicker: "Channels",
      title: "Email and SMS, with consent built in",
      body: "Reach customers however they prefer. Email sends through a reliable delivery service, and SMS goes out via Twilio — with a customer consent checkbox so you're always compliant.",
      bullets: [
        "Email delivery built in, no setup required",
        "SMS via your own Twilio number (messages queue until it's connected)",
        "Customer SMS consent tracked per contact",
      ],
    },
  ],
  faqs: [
    {
      q: "Which messages are sent automatically?",
      a: "Booking confirmations, reschedule and cancellation notices, job assignment and completion updates, quote sent/approved notices, quote follow-ups, invoice sent/paid notices, day-before visit reminders, and overdue payment reminders.",
    },
    {
      q: "Do I need my own Twilio account for SMS?",
      a: "Yes — SMS sends through Twilio using your own number, which keeps you in control of your sender identity and costs. Email works out of the box with no setup. Until your Twilio keys are connected, SMS messages stay safely queued.",
    },
    {
      q: "Can customers opt out of messages?",
      a: "Yes. SMS requires an explicit consent checkbox on each customer record, and transactional emails include the context of the booking or invoice they relate to.",
    },
    {
      q: "Is automated messaging a Pro-only feature?",
      a: "No — automatic messages send on every plan. Customizing the message templates in Settings → Communications is a Pro feature, so you can start hands-free and make the wording yours when you upgrade.",
    },
  ],
};

export default function AutomatedCommunicationsPage() {
  return <FeaturePage config={config} />;
}
