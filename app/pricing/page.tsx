import type { Metadata } from "next";
import { PillNav } from "@/components/switchboard/pill-nav";
import { Footer } from "@/components/switchboard/footer";
import { Pricing } from "@/components/switchboard/pricing";
import { Faq } from "@/components/switchboard/faq";
import { TrialBand } from "@/components/switchboard/contact";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Switchboard pricing: Essential $299/mo with 250 AI-answered minutes, Complete $599/mo with 600 minutes. Overage 30¢/min. Month to month, free 7-day trial with no card.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <div className="bg-white font-sb text-sb-ink antialiased">
      <PillNav />
      <main className="pt-24">
        <Pricing />
        <Faq limit={4} />
        <TrialBand />
      </main>
      <Footer />
    </div>
  );
}
