import type { Metadata } from "next";
import { PillNav } from "@/components/switchboard/pill-nav";
import { Footer } from "@/components/switchboard/footer";
import { Faq } from "@/components/switchboard/faq";
import { TrialBand } from "@/components/switchboard/contact";

export const metadata: Metadata = {
  title: "FAQs",
  description:
    "Frequently asked questions about Wavva: AI disclosure, what happens when it can't help, your number, pricing, data export, and the free trial.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <div className="bg-white font-sb text-sb-ink antialiased">
      <PillNav />
      <main className="pt-24">
        <Faq />
        <TrialBand />
      </main>
      <Footer />
    </div>
  );
}
