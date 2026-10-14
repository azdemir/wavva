import { Reveal } from "./reveal";
import { Eyebrow, Grad } from "./section-head";
import { Counter } from "./counter";

const BENEFITS = [
  {
    bg: "linear-gradient(160deg, #f1edff, #ffffff)",
    mini: (
      <>
        <b>2:14 AM</b>Call answered · quote sent · <span className="text-green-700">booked ✓</span>
      </>
    ),
    title: "Never miss a call",
    body: "24/7 live answering — nights, weekends, holidays. 67% of prospects hire whoever responds first.",
  },
  {
    bg: "linear-gradient(160deg, #ffeef3, #ffffff)",
    mini: (
      <>
        <b>This week</b>31 appointments booked
        <br />
        12 quotes followed up
      </>
    ),
    title: "Book while you sleep",
    body: "Quotes from your price list, follow-ups until booked, confirmations and day-before reminders.",
  },
  {
    bg: "linear-gradient(160deg, #e7f8ec, #ffffff)",
    mini: (
      <>
        <b>Invoices</b>#1042 $180 <span className="text-green-700">Paid ✓</span>
        <br />
        #1043 $240 reminded
      </>
    ),
    title: "Get paid faster",
    body: "Invoices sent, cards charged automatically, reminders until paid — to your own account.",
  },
  {
    bg: "linear-gradient(160deg, #e9f2ff, #ffffff)",
    mini: (
      <>
        <b>Monday report</b>23 enquiries · 18 booked
        <br />
        $4,820 collected
      </>
    ),
    title: "Know your numbers",
    body: "One page every week. Anything the AI can't handle texts you the moment it happens.",
  },
];

/** Benefit cards + animated stat band. */
export function Benefits() {
  return (
    <section className="bg-sb-bg2 py-28">
      <div className="mx-auto max-w-[1200px] px-7">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <Reveal><Eyebrow>Benefits</Eyebrow></Reveal>
          <Reveal delay={1}>
            <h2 className="font-sb text-4xl font-extrabold tracking-tight text-sb-ink sm:text-5xl">
              Why owners <Grad>switch.</Grad>
            </h2>
          </Reveal>
          <Reveal delay={2}>
            <p className="mt-4 font-sb text-lg text-sb-ink2">Four reasons the phone stops being your problem.</p>
          </Reveal>
        </div>

        <div className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title} delay={(i % 4) as 0 | 1 | 2 | 3}>
              <div
                className="flex min-h-[340px] flex-col justify-end rounded-[26px] border border-white p-7 transition-all duration-300 hover:-translate-y-2.5 hover:rotate-[-0.6deg] hover:shadow-[0_30px_60px_rgba(20,20,43,0.16)]"
                style={{ background: b.bg }}
              >
                <div className="mb-5 rounded-2xl bg-white/80 p-3.5 font-sb text-xs text-sb-ink2 shadow-[0_10px_24px_rgba(20,20,43,0.08)]">
                  {b.mini}
                </div>
                <h3 className="mb-2 font-sb text-xl font-extrabold text-sb-ink">{b.title}</h3>
                <p className="font-sb text-sm text-sb-ink2">{b.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="relative mt-6 overflow-hidden rounded-[36px] bg-sb-ink px-10 py-16 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 50% 80% at 50% 120%, rgba(109,92,255,0.4), transparent 70%)",
            }}
          />
          <div className="relative grid gap-8 sm:grid-cols-3">
            <div>
              <b className="block bg-gradient-to-r from-[#b9aefc] to-[#ff8fab] bg-clip-text font-sb text-6xl font-extrabold text-transparent">
                <Counter to={67} suffix="%" />
              </b>
              <span className="mt-2 block font-sb text-sm text-[#a9a9c9]">of prospects hire whoever responds first</span>
            </div>
            <div>
              <b className="block bg-gradient-to-r from-[#b9aefc] to-[#ff8fab] bg-clip-text font-sb text-6xl font-extrabold text-transparent">
                24/7
              </b>
              <span className="mt-2 block font-sb text-sm text-[#a9a9c9]">every call answered, every channel covered</span>
            </div>
            <div>
              <b className="block bg-gradient-to-r from-[#b9aefc] to-[#ff8fab] bg-clip-text font-sb text-6xl font-extrabold text-transparent">
                <Counter to={0} prefix="$" />
              </b>
              <span className="mt-2 block font-sb text-sm text-[#a9a9c9]">per-call charges — flat fee, always</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
