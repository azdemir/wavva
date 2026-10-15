import type { Metadata } from "next";
import { SessionNav } from "@/components/switchboard/session-nav";
import { Footer } from "@/components/switchboard/footer";
import { Contact } from "@/components/switchboard/contact";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Wavva — questions about plans, onboarding, or multi-location. We reply within one business day.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="bg-white font-sb text-sb-ink antialiased">
      <SessionNav />
      <main className="pt-16">
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
