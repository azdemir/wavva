import type { Metadata } from "next";
import { PillNav } from "@/components/switchboard/pill-nav";
import { Hero } from "@/components/switchboard/hero";
import { Marquee } from "@/components/switchboard/marquee";
import { HowItWorks } from "@/components/switchboard/how-it-works";
import { CallDemo } from "@/components/switchboard/call-demo";
import { Benefits } from "@/components/switchboard/benefits";
import { Pricing } from "@/components/switchboard/pricing";
import { Faq } from "@/components/switchboard/faq";
import { Contact, TrialBand } from "@/components/switchboard/contact";
import { Footer } from "@/components/switchboard/footer";

export const metadata: Metadata = {
  title: "Every call answered. Every business.",
  description:
    "Switchboard is the AI front office for every business: every call answered in your business's name, appointments booked, quotes followed up, invoices collected. Flat $299/mo. Free 7-day trial.",
  alternates: { canonical: "/" },
};

/**
 * Switchboard homepage — option-Q design.
 * Marketing surface is Switchboard's; the backend (auth, dashboard,
 * APIs, data) is TidyPro's.
 */
export default function HomePage() {
  return (
    <div className="bg-white font-sb text-sb-ink antialiased">
      <PillNav />
      <main>
        <Hero />
        <Marquee />
        <HowItWorks />
        <CallDemo />
        <Benefits />
        <Pricing />
        <Faq limit={6} />
        <Contact />
        <TrialBand />
      </main>
      <Footer />
    </div>
  );
}
