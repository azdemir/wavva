import type { Metadata } from "next";
import { SessionNav } from "@/components/switchboard/session-nav";
import { Footer } from "@/components/switchboard/footer";
import { Reveal } from "@/components/switchboard/reveal";
import { Eyebrow, Grad } from "@/components/switchboard/section-head";
import { SbButton } from "@/components/switchboard/buttons";
import { HowItWorks } from "@/components/switchboard/how-it-works";
import { Pricing } from "@/components/switchboard/pricing";
import { Faq } from "@/components/switchboard/faq";
import { TrialBand } from "@/components/switchboard/contact";
import { FRONT_OFFICE, FRONT_OFFICE_PLANS } from "@/lib/front-office";

export const metadata: Metadata = {
  title: "The service — your AI front office, done for you",
  description:
    "Wavva's done-for-you service: an AI assistant answers every call, text and email in your company's name, books appointments, follows up quotes, and collects invoices. From $299/mo, month to month.",
  alternates: { canonical: "/front-office" },
};

const INCLUDED = [
  {
    icon: "📞",
    title: "Answered like you would",
    body: "Trained on your services, prices, hours, and policies. Callers hear your business — and are told it's your AI assistant.",
  },
  {
    icon: "🗓️",
    title: "Booked without the back-and-forth",
    body: "Appointments land straight in your schedule with confirmations and day-before reminders. Reschedules handled.",
  },
  {
    icon: "💰",
    title: "Followed up until paid",
    body: "Quotes chased until booked. Invoices sent, cards charged, reminders until paid — to your own account.",
  },
  {
    icon: "🚨",
    title: "You stay in control",
    body: "Anything unusual texts you instantly. Anything outside your price list waits for your OK. Full export any time.",
  },
];

export default function FrontOfficePage() {
  return (
    <div className="bg-white font-sb text-sb-ink antialiased">
      <SessionNav />
      <main>
        <section className="relative overflow-hidden pt-40 pb-16 text-center">
          <div aria-hidden className="animate-sb-drift pointer-events-none absolute -left-32 -top-24 h-[420px] w-[420px] rounded-full bg-[#d9cfff] opacity-60 blur-[70px]" />
          <div aria-hidden className="animate-sb-drift pointer-events-none absolute -right-32 top-20 h-[380px] w-[380px] rounded-full bg-[#ffd9e4] opacity-60 blur-[70px] [animation-delay:-6s]" />
          <div className="relative mx-auto max-w-[1200px] px-7">
            <Reveal><Eyebrow>{FRONT_OFFICE.BRAND} service</Eyebrow></Reveal>
            <Reveal delay={1}>
              <h1 className="mx-auto max-w-3xl text-5xl font-extrabold tracking-tight sm:text-6xl">
                Your front office, <Grad>done for you.</Grad>
              </h1>
            </Reveal>
            <Reveal delay={2}>
              <p className="mx-auto mt-5 max-w-xl text-lg text-sb-ink2">
                Not software to learn — a service that runs. We set it up, train it on your
                business, and it answers every call in your company&rsquo;s name from day one.
              </p>
            </Reveal>
            <Reveal delay={3} className="mt-8 flex flex-wrap justify-center gap-3.5">
              <SbButton href="/founding-client" size="lg">Claim a founding spot</SbButton>
              <SbButton href="/pricing" size="lg" variant="light">See pricing</SbButton>
            </Reveal>
          </div>
        </section>

        <section className="bg-sb-bg2 py-20">
          <div className="mx-auto grid max-w-[1200px] gap-5 px-7 sm:grid-cols-2 lg:grid-cols-4">
            {INCLUDED.map((f, i) => (
              <Reveal key={f.title} delay={(i % 4) as 0 | 1 | 2 | 3}>
                <div className="h-full rounded-[26px] border border-white bg-white p-7 shadow-[0_16px_40px_rgba(20,20,43,0.08)]">
                  <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-sb-violet-soft text-2xl">
                    {f.icon}
                  </span>
                  <h3 className="mb-2 text-lg font-extrabold">{f.title}</h3>
                  <p className="text-[14.5px] text-sb-ink2">{f.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="bg-white py-20">
          <div className="mx-auto max-w-[1200px] px-7">
            <div className="grid gap-5 md:grid-cols-2">
              {([FRONT_OFFICE_PLANS.front_desk, FRONT_OFFICE_PLANS.full_office] as const).map((p, i) => (
                <Reveal key={p.id} delay={i as 0 | 1}>
                  <div className="h-full rounded-[26px] border border-sb-ink/10 bg-white p-8">
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-xl font-extrabold">{p.name}</h3>
                      <span className="text-3xl font-extrabold">
                        ${p.price}
                        <small className="text-sm font-semibold text-sb-ink2">/mo</small>
                      </span>
                    </div>
                    <p className="mt-1.5 text-[15px] text-sb-ink2">{p.blurb}</p>
                    <ul className="mt-5 space-y-2.5">
                      {p.features.map((f) => (
                        <li key={f} className="relative pl-6 text-[14.5px] text-sb-ink2 before:absolute before:left-0 before:font-extrabold before:text-sb-violet before:content-['✓']">
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <HowItWorks />
        <Pricing />
        <Faq limit={4} />
        <TrialBand />
      </main>
      <Footer />
    </div>
  );
}
