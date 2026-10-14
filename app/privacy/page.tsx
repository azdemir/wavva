import type { Metadata } from "next";
import { PillNav } from "@/components/switchboard/pill-nav";
import { Footer } from "@/components/switchboard/footer";
import { Reveal } from "@/components/switchboard/reveal";
import { Eyebrow } from "@/components/switchboard/section-head";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Switchboard handles your data.",
  alternates: { canonical: "/privacy" },
};

const SECTIONS = [
  {
    t: "What we collect",
    b: "Your business details, customer contact information you provide, call and message records needed to run your front office, and basic usage analytics. Nothing more.",
  },
  {
    t: "What we never do",
    b: "We never sell your data, never share it with advertisers, and never hold your customers' payments — card payments go straight to your own account.",
  },
  {
    t: "AI disclosure",
    b: "Every caller is told they're speaking with your business's AI assistant. Call recordings, where used, are disclosed to callers as required by law.",
  },
  {
    t: "Your control",
    b: "Your data exports any time, in full. Ask us to delete it and we will — no retention games, no dark patterns.",
  },
  {
    t: "Messages & consent",
    b: "Follow-up texts only go to people who agreed to receive them. Anyone can opt out any time, and opt-outs are honored immediately.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="bg-white font-sb text-sb-ink antialiased">
      <PillNav />
      <main className="pt-40 pb-24">
        <div className="mx-auto max-w-3xl px-7">
          <Reveal><Eyebrow>Legal</Eyebrow></Reveal>
          <Reveal delay={1}>
            <h1 className="text-5xl font-extrabold tracking-tight">Privacy</h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="mt-4 text-lg text-sb-ink2">
              Plain language, no legalese marathons. Last updated October 2026.
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
