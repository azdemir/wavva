import type { Metadata } from "next";
import { FeaturePage, type FeaturePageConfig } from "@/components/marketing/feature-page";
import {
  CalendarIcon,
  CheckIcon,
  PortalIcon,
  QuoteIcon,
} from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Online Booking Forms for Cleaning Businesses — TidyPro",
  description:
    "TidyPro online booking: a shareable quote-request form for your website, one-click quote-to-booking conversion, recurring cleanings, and a self-serve customer portal.",
  alternates: { canonical: "/features/online-booking" },
};

const config: FeaturePageConfig = {
  slug: "online-booking",
  heroEyebrow: "Features",
  heroTitle: "Online Booking Forms",
  heroDescription:
    "Turn your website into a 24/7 booking desk — capture requests while you're on a job, and convert them to scheduled work in one click.",
  introEyebrow: "Why it matters",
  introTitle: "Never miss a lead from your website",
  introBody:
    "Most people look for a cleaner in the evening, after you've put the phone down. If your website can't take their request, they'll call the next company on Google. TidyPro's booking flow captures the lead, follows up automatically, and turns approved quotes into scheduled jobs.",
  benefits: [
    {
      icon: PortalIcon,
      title: "A quote form that works while you clean",
      body: "Share a link from your website, Google profile, or Facebook page. Prospects send their details — service, property size, frequency — straight into TidyPro.",
    },
    {
      icon: QuoteIcon,
      title: "Quotes become bookings in one click",
      body: "Send a priced quote, let automatic follow-ups do the chasing, and convert an approved quote into a booking without retyping anything.",
    },
    {
      icon: CalendarIcon,
      title: "Customers help themselves",
      body: "Every customer gets a private portal link: approve quotes, see upcoming visits, and pay invoices without calling your office.",
    },
  ],
  blocks: [
    {
      icon: PortalIcon,
      kicker: "Capture",
      title: "Every request lands in one inbox",
      body: "Website quote requests arrive as structured leads with everything you need to price the job — no more deciphering voicemails or Facebook messages.",
      bullets: [
        "Shareable online quote-request form — no website rebuild needed",
        "Captures service type, property size, frequency, and add-ons",
        "New requests notify you instantly so you can respond fast",
      ],
    },
    {
      icon: QuoteIcon,
      kicker: "Convert",
      title: "From request to scheduled job",
      body: "Price it, send it, and let TidyPro follow up automatically until the customer decides. Approval takes one click on their end — and one click on yours to schedule it.",
      bullets: [
        "Pricing by service, property size, frequency, and add-ons",
        "Automatic quote follow-ups until approved, declined, or expired",
        "One-time and recurring bookings with configurable cancellation rules",
      ],
    },
    {
      icon: CheckIcon,
      kicker: "Self-serve",
      title: "A portal customers actually use",
      body: "Instead of phone tag for every change, customers open their private link to approve quotes, check upcoming visits, and pay their balance online.",
      bullets: [
        "Private portal links — no customer login to manage",
        "Customers approve quotes and pay invoices themselves",
        "Portal emails come from your company's own email address",
      ],
    },
  ],
  faqs: [
    {
      q: "Do I need a website to use online booking?",
      a: "No. The quote-request form is a standalone shareable link, so you can put it on a website, your Google Business profile, Facebook page, or even in a text message.",
    },
    {
      q: "Can I take a deposit or require card details upfront?",
      a: "Invoices support online card payments through Stripe, and you can send the invoice as soon as the booking is confirmed — many owners collect a deposit before the first clean.",
    },
    {
      q: "Do customers need to create an account?",
      a: "No. Each customer gets a private, secure portal link. They open it, see their quotes, visits, and invoices, and pay — no passwords to remember or reset.",
    },
    {
      q: "What about recurring cleanings?",
      a: "Approved quotes convert into one-time or recurring bookings. Weekly, biweekly, and monthly patterns generate all future visits on your calendar automatically.",
    },
  ],
};

export default function OnlineBookingPage() {
  return <FeaturePage config={config} />;
}
