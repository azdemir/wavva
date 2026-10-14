import type { Metadata } from "next";
import { PillNav } from "@/components/switchboard/pill-nav";
import { Footer } from "@/components/switchboard/footer";
import { Reveal } from "@/components/switchboard/reveal";
import { Eyebrow, Grad } from "@/components/switchboard/section-head";
import { SbButton } from "@/components/switchboard/buttons";
import { TrialBand } from "@/components/switchboard/contact";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Everything Switchboard does: live call answering, texts and emails in minutes, quotes from your price list, booking, reminders, invoicing, collections, and a weekly report.",
  alternates: { canonical: "/features" },
};

const FEATURES = [
  {
    icon: "📞",
    bg: "linear-gradient(160deg,#f1edff,#ffffff)",
    title: "Every call answered live",
    body: "Nights, weekends, holidays — every caller reaches your business's AI assistant in seconds, and is told exactly that. No hold music, no voicemail black hole.",
    points: ["Answers in your business's name", "Discloses it's an AI assistant", "Takes messages when you're the right person"],
  },
  {
    icon: "💬",
    bg: "linear-gradient(160deg,#ffeef3,#ffffff)",
    title: "Texts, emails & forms in minutes",
    body: "Web enquiries, DMs, and emails get a real answer within minutes — not tomorrow morning. 67% of prospects hire whoever responds first.",
    points: ["Website chat and contact forms", "SMS and email replies", "After-hours coverage included"],
  },
  {
    icon: "🧾",
    bg: "linear-gradient(160deg,#e9f2ff,#ffffff)",
    title: "Quotes from your price list",
    body: "Switchboard quotes from your prices — never guesses. Then it follows up by text and email until the customer books or says no.",
    points: ["Price-list-only quoting", "Automatic follow-ups", "Never quotes outside your list"],
  },
  {
    icon: "📅",
    bg: "linear-gradient(160deg,#e7f8ec,#ffffff)",
    title: "Booking, confirmations & reminders",
    body: "Appointments booked straight into your schedule, confirmed instantly, reminded the day before. Reschedules and cancellations handled too.",
    points: ["Real-time availability", "Instant confirmations", "Day-before reminders"],
  },
  {
    icon: "💳",
    bg: "linear-gradient(160deg,#fff3e2,#ffffff)",
    title: "Invoicing & collections",
    body: "Invoices sent, cards charged automatically, reminders until paid — straight to your own account. We never hold your money.",
    points: ["Automatic card charges", "Polite reminders until paid", "Paid to your account, not ours"],
  },
  {
    icon: "📊",
    bg: "linear-gradient(160deg,#f1edff,#ffffff)",
    title: "Weekly report & instant alerts",
    body: "One page every week: enquiries, bookings, open quotes, money collected, overdue. Anything unusual texts you the moment it happens.",
    points: ["Monday report in your inbox", "Instant text for exceptions", "Full export any time"],
  },
];

export default function FeaturesPage() {
  return (
    <div className="bg-white font-sb text-sb-ink antialiased">
      <PillNav />
      <main>
        <section className="relative overflow-hidden pt-40 pb-16 text-center">
          <div aria-hidden className="animate-sb-drift pointer-events-none absolute -left-32 -top-24 h-[420px] w-[420px] rounded-full bg-[#d9cfff] opacity-60 blur-[70px]" />
          <div aria-hidden className="animate-sb-drift pointer-events-none absolute -right-32 top-20 h-[380px] w-[380px] rounded-full bg-[#ffd9e4] opacity-60 blur-[70px] [animation-delay:-6s]" />
          <div className="relative mx-auto max-w-[1200px] px-7">
            <Reveal><Eyebrow>Features</Eyebrow></Reveal>
            <Reveal delay={1}>
              <h1 className="mx-auto max-w-3xl text-5xl font-extrabold tracking-tight sm:text-6xl">
                Everything a front office <Grad>does.</Grad>
              </h1>
            </Reveal>
            <Reveal delay={2}>
              <p className="mx-auto mt-5 max-w-xl text-lg text-sb-ink2">
                Six jobs, one flat fee. Here&rsquo;s what Switchboard handles while you run the business.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="bg-white pb-24">
          <div className="mx-auto grid max-w-[1200px] gap-5 px-7 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) as 0 | 1 | 2} className="h-full">
                <div
                  className="flex h-full flex-col rounded-[26px] border border-white p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_30px_60px_rgba(20,20,43,0.14)]"
                  style={{ background: f.bg }}
                >
                  <span className="mb-5 grid h-14 w-14 place-items-center rounded-[18px] bg-white text-2xl shadow-[0_10px_24px_rgba(20,20,43,0.1)]">
                    {f.icon}
                  </span>
                  <h3 className="mb-2.5 font-sb text-[22px] font-extrabold">{f.title}</h3>
                  <p className="mb-5 font-sb text-[15px] text-sb-ink2">{f.body}</p>
                  <ul className="mt-auto space-y-2">
                    {f.points.map((p) => (
                      <li key={p} className="relative pl-6 font-sb text-sm font-semibold text-sb-ink before:absolute before:left-0 before:font-extrabold before:text-sb-violet before:content-['✓']">
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-12 text-center">
            <SbButton href="/#trial" size="lg">Start free 7-day trial</SbButton>
          </Reveal>
        </section>

        <TrialBand />
      </main>
      <Footer />
    </div>
  );
}
