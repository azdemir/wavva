import type { Metadata } from "next";
import { PillNav } from "@/components/switchboard/pill-nav";
import { getSessionUser } from "@/lib/auth";
import { Footer } from "@/components/switchboard/footer";
import { Contact } from "@/components/switchboard/contact";

export const instant = false;

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Wavva — questions about plans, onboarding, or multi-location. We reply within one business day.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  return (
    <div className="bg-white font-sb text-sb-ink antialiased">
      <PillNav signedIn={!!(await getSessionUser())} />
      <main className="pt-16">
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
