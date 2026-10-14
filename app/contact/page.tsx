import type { Metadata } from "next";
import { PillNav } from "@/components/switchboard/pill-nav";
import { Footer } from "@/components/switchboard/footer";
import { Contact } from "@/components/switchboard/contact";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Switchboard — questions about plans, onboarding, or multi-location. We reply within one business day.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="bg-white font-sb text-sb-ink antialiased">
      <PillNav />
      <main className="pt-16">
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
