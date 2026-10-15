import type { Metadata } from "next";
import { SessionNav } from "@/components/switchboard/session-nav";
import { Footer } from "@/components/switchboard/footer";
import { Reveal } from "@/components/switchboard/reveal";
import { Eyebrow } from "@/components/switchboard/section-head";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms of using Wavva.",
  alternates: { canonical: "/terms" },
};

const SECTIONS = [
  {
    t: "The service",
    b: "Wavva provides an AI-powered front office: call answering, messaging, quoting, booking, invoicing, and reporting, in your business's name. You remain responsible for your prices, policies, and the work itself.",
  },
  {
    t: "Billing",
    b: "One flat monthly fee — Essential $299/mo or Complete $599/mo. Month to month; cancel any month and service runs to the end of the billing period. The 7-day trial is free and needs no card.",
  },
  {
    t: "Your responsibilities",
    b: "Keep your price list, hours, and policies accurate — Wavva quotes and books from what you tell it. Provide a working forwarding number and a way to reach you for exceptions.",
  },
  {
    t: "AI limitations",
    b: "The assistant discloses that it is an AI assistant on every call. Anything it can't handle — or anything outside your price list — is escalated to you by text. It never guesses on your behalf.",
  },
  {
    t: "Acceptable use",
    b: "No spam, no deceptive practices, no unlawful content. Automated outbound sales calls are not part of the service and never will be.",
  },
];

export default function TermsPage() {
  return (
    <div className="bg-white font-sb text-sb-ink antialiased">
      <SessionNav />
      <main className="pt-40 pb-24">
        <div className="mx-auto max-w-3xl px-7">
          <Reveal><Eyebrow>Legal</Eyebrow></Reveal>
          <Reveal delay={1}>
            <h1 className="text-5xl font-extrabold tracking-tight">Terms</h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="mt-4 text-lg text-sb-ink2">
              Short, fair, and readable. Last updated October 2026.
            </p>
          </Reveal>
          <div className="mt-10 space-y-4">
            {SECTIONS.map((s, i) => (
              <Reveal key={s.t} delay={(i % 3) as 0 | 1 | 2}>
                <div className="rounded-[22px] border border-sb-ink/10 bg-sb-bg2 p-7">
                  <h2 className="mb-2 text-lg font-extrabold">{s.t}</h2>
                  <p className="text-[15px] text-sb-ink2">{s.b}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
