"use client";

import { useState } from "react";
import { sendContactMessage } from "@/lib/actions/contact";
import { Reveal } from "./reveal";
import { Eyebrow, Grad } from "./section-head";
import { SbButton } from "./buttons";

function TileIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-[22px] w-[22px]"
    >
      {children}
    </svg>
  );
}

function MailIcon() {
  return (
    <TileIcon>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3.5 7.5l8.5 5.5 8.5-5.5" />
    </TileIcon>
  );
}

function PhoneIcon() {
  return (
    <TileIcon>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </TileIcon>
  );
}

function PinIcon() {
  return (
    <TileIcon>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </TileIcon>
  );
}

const INFO = [
  { icon: <MailIcon />, t: "Email", s: "hello@wavva.example" },
  { icon: <PhoneIcon />, t: "Phone", s: "(315) 555-0147 · sample line" },
  { icon: <PinIcon />, t: "Office", s: "Syracuse, New York" },
];

/** Contact section: info cards + form wired to the TidyPro contact backend. */
export function Contact() {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async (formData: FormData) => {
    setState("sending");
    setError("");
    const res = await sendContactMessage(formData);
    if (res.ok) setState("done");
    else {
      setError(res.error ?? "Something went wrong.");
      setState("error");
    }
  };

  return (
    <section id="contact" className="bg-white py-28">
      <div className="mx-auto max-w-[1200px] px-7">
        <Reveal className="relative grid gap-12 overflow-hidden rounded-[40px] bg-gradient-to-br from-sb-lav via-sb-pink to-sb-blue p-10 md:p-16 lg:grid-cols-2">
          <div>
            <Eyebrow>Contact</Eyebrow>
            <h2 className="font-sb text-4xl font-extrabold tracking-tight text-sb-ink sm:text-5xl">
              Get in touch <Grad>with us.</Grad>
            </h2>
            <p className="mt-4 font-sb text-[17px] text-sb-ink2">
              Questions about plans, onboarding, or multi-location? We reply within one business day.
            </p>
            <div className="mt-8 grid gap-3.5">
              {INFO.map((c) => (
                <div key={c.t} className="flex items-center gap-4 rounded-[18px] bg-white/75 p-4.5">
                  <span className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[15px] bg-sb-violet text-white">
                    {c.icon}
                  </span>
                  <span>
                    <b className="block font-sb text-sm font-bold text-sb-ink">{c.t}</b>
                    <span className="font-sb text-[13.5px] text-sb-ink2">{c.s}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[26px] bg-white p-9 shadow-[0_30px_70px_rgba(20,20,43,0.14)]">
            {state === "done" ? (
              <div className="py-10 text-center">
                <div className="mb-3.5 text-[52px]">✓</div>
                <h3 className="font-sb text-xl font-extrabold text-sb-ink">Message sent.</h3>
                <p className="mt-2 font-sb text-sm text-sb-ink2">
                  Thanks — we&rsquo;ll reply within one business day.
                </p>
              </div>
            ) : (
              <form action={submit}>
                <h3 className="mb-1.5 font-sb text-xl font-extrabold text-sb-ink">Send a message</h3>
                <p className="mb-6 font-sb text-sm text-sb-ink2">
                  We&rsquo;ll get back to you within one business day.
                </p>
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <input
                    name="name"
                    required
                    placeholder="Your name"
                    className="rounded-[14px] border-[1.5px] border-sb-ink/10 bg-sb-bg2 px-4 py-3.5 font-sb text-sm outline-none transition focus:border-sb-violet focus:bg-white focus:shadow-[0_0_0_4px_rgba(109,92,255,0.14)]"
                  />
                  <input
                    name="company"
                    placeholder="Business name (optional)"
                    className="rounded-[14px] border-[1.5px] border-sb-ink/10 bg-sb-bg2 px-4 py-3.5 font-sb text-sm outline-none transition focus:border-sb-violet focus:bg-white focus:shadow-[0_0_0_4px_rgba(109,92,255,0.14)]"
                  />
                </div>
                <input
                  name="email"
                  required
                  type="email"
                  placeholder="Email address"
                  className="mt-3.5 w-full rounded-[14px] border-[1.5px] border-sb-ink/10 bg-sb-bg2 px-4 py-3.5 font-sb text-sm outline-none transition focus:border-sb-violet focus:bg-white focus:shadow-[0_0_0_4px_rgba(109,92,255,0.14)]"
                />
                <textarea
                  name="message"
                  required
                  minLength={10}
                  placeholder="How can we help?"
                  className="mt-3.5 min-h-[110px] w-full resize-y rounded-[14px] border-[1.5px] border-sb-ink/10 bg-sb-bg2 px-4 py-3.5 font-sb text-sm outline-none transition focus:border-sb-violet focus:bg-white focus:shadow-[0_0_0_4px_rgba(109,92,255,0.14)]"
                />
                {state === "error" && (
                  <p className="mt-3 font-sb text-sm font-semibold text-red-600">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={state === "sending"}
                  className="mt-5 inline-flex w-full cursor-pointer items-center justify-center rounded-full bg-sb-violet px-8 py-4 font-sb text-[15.5px] font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(109,92,255,0.42)] active:translate-y-0 active:scale-[0.98] disabled:opacity-60"
                >
                  {state === "sending" ? "Sending…" : "Send message"}
                </button>
              </form>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** Founding-50 trial band. */
export function TrialBand() {
  return (
    <section id="trial" className="bg-white pb-28">
      <div className="mx-auto max-w-[1200px] px-7">
        <Reveal className="relative overflow-hidden rounded-[36px] bg-sb-ink px-10 py-16 text-center text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 55% 75% at 50% 125%, rgba(109,92,255,0.5), transparent 70%)",
            }}
          />
          <div className="relative">
            <p className="font-sb text-xs font-extrabold tracking-[0.26em] text-[#b9aefc]">FOUNDING 50</p>
            <h2 className="mx-auto mt-3.5 max-w-3xl font-sb text-4xl font-extrabold tracking-tight sm:text-5xl">
              The first 50 businesses get <Grad>white-glove setup, free.</Grad>
            </h2>
            <p className="mx-auto mt-4 max-w-xl font-sb text-[#a9a9c9]">
              We onboard you personally — train Wavva on your business, move your customer list,
              connect your line. Founding rate locked for 12 months.
            </p>
            <div className="mt-8">
              <SbButton href="/founding-client" size="lg">Claim a founding spot</SbButton>
            </div>
            <p className="mt-4.5 font-sb text-[13px] text-[#a9a9c9]">
              Free 7-day trial · No card required · Cancel anytime
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
