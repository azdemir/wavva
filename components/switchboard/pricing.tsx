"use client";

import { useState } from "react";
import { FRONT_OFFICE_PLANS } from "@/lib/front-office";
import { Reveal } from "./reveal";
import { Eyebrow, Grad } from "./section-head";
import { SbButton } from "./buttons";

/** Yearly = 2 months free → 10/12 of the monthly price, rounded. */
const yearlyPrice = (monthly: number) => Math.round((monthly * 10) / 12);

const EXTRA_PLAN = {
  name: "Multi-location",
  blurb: "Several lines, one front office.",
  features: [
    "Everything in Complete",
    "Multiple lines & locations",
    "White-glove onboarding",
    "Priority support line",
  ],
};

/** Pricing with animated monthly/yearly toggle. Prices come from lib/front-office. */
export function Pricing() {
  const [yearly, setYearly] = useState(false);
  const [shown, setShown] = useState<Record<string, number>>({
    front_desk: FRONT_OFFICE_PLANS.front_desk.price,
    full_office: FRONT_OFFICE_PLANS.full_office.price,
  });

  const flip = (next: boolean) => {
    setYearly(next);
    const t0 = performance.now();
    const from = { ...shown };
    const tick = (t: number) => {
      const p = Math.min((t - t0) / 600, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setShown({
        front_desk:
          from.front_desk +
          ((next ? yearlyPrice(FRONT_OFFICE_PLANS.front_desk.price) : FRONT_OFFICE_PLANS.front_desk.price) -
            from.front_desk) *
            e,
        full_office:
          from.full_office +
          ((next ? yearlyPrice(FRONT_OFFICE_PLANS.full_office.price) : FRONT_OFFICE_PLANS.full_office.price) -
            from.full_office) *
            e,
      });
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const cards = [
    { plan: FRONT_OFFICE_PLANS.front_desk, key: "front_desk" as const, hot: false, cta: "/#trial" },
    { plan: FRONT_OFFICE_PLANS.full_office, key: "full_office" as const, hot: true, cta: "/#trial" },
  ];

  return (
    <section id="pricing" className="bg-white py-28">
      <div className="mx-auto max-w-[1200px] px-7">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <Reveal><Eyebrow>Pricing</Eyebrow></Reveal>
          <Reveal delay={1}>
            <h2 className="font-sb text-4xl font-extrabold tracking-tight text-sb-ink sm:text-5xl">
              One flat fee. <Grad>That&rsquo;s the invoice.</Grad>
            </h2>
          </Reveal>
          <Reveal delay={2}>
            <p className="mt-4 font-sb text-lg text-sb-ink2">Free 7-day trial — every feature, no card.</p>
          </Reveal>
        </div>

        <Reveal className="mb-12 flex items-center justify-center gap-4 font-sb text-[15px] font-bold text-sb-ink">
          <span className={yearly ? "text-sb-ink2" : ""}>Monthly</span>
          <button
            role="switch"
            aria-checked={yearly}
            aria-label="Toggle yearly pricing"
            onClick={() => flip(!yearly)}
            className={`relative h-10 w-[76px] rounded-full transition-colors ${yearly ? "bg-[#d9d2fd]" : "bg-sb-violet-soft"}`}
          >
            <span
              className="absolute top-[5px] h-[30px] w-[30px] rounded-full bg-sb-violet transition-all duration-300"
              style={{ left: yearly ? 41 : 5 }}
            />
          </button>
          <span className={yearly ? "" : "text-sb-ink2"}>Yearly</span>
          <span className="rounded-full bg-green-100 px-3.5 py-1.5 text-xs font-extrabold text-green-700">
            2 months free
          </span>
        </Reveal>

        <div className="grid items-stretch gap-5 lg:grid-cols-3">
          {cards.map((c, i) => (
            <Reveal key={c.key} delay={(i % 3) as 0 | 1 | 2} className="h-full">
              <div
                className={`relative flex h-full flex-col rounded-[30px] p-10 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_30px_60px_rgba(20,20,43,0.12)] ${
                  c.hot
                    ? "bg-gradient-to-b from-sb-violet to-sb-violet-dark text-white shadow-[0_30px_70px_rgba(109,92,255,0.4)]"
                    : "border-[1.5px] border-sb-ink/10 bg-white"
                }`}
              >
                {c.hot && (
                  <span className="absolute -top-[15px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-sb-ink px-5 py-2 font-sb text-[11px] font-extrabold uppercase tracking-[0.16em] text-white">
                    Most popular
                  </span>
                )}
                <h3 className="font-sb text-xl font-extrabold">{c.plan.name}</h3>
                <div className="my-1.5 font-sb text-[54px] font-extrabold leading-none tracking-tight">
                  ${Math.round(shown[c.key]).toLocaleString()}
                  <small className={`text-[15px] font-semibold ${c.hot ? "text-[#d9d2fd]" : "text-sb-ink2"}`}>/mo</small>
                </div>
                <p className={`font-sb text-sm ${c.hot ? "text-[#e6e1ff]" : "text-sb-ink2"}`}>{c.plan.blurb}</p>
                <ul className="my-6 flex-1 space-y-0">
                  {c.plan.features.map((f) => (
                    <li
                      key={f}
                      className={`relative py-2.5 pl-7 font-sb text-[14.5px] before:absolute before:left-0.5 before:font-extrabold before:content-['✓'] ${
                        c.hot ? "text-[#e6e1ff] before:text-white" : "text-sb-ink2 before:text-sb-violet"
                      }`}
                    >
                      {f}
                    </li>
                  ))}
                </ul>
                <SbButton href={c.cta} variant={c.hot ? "white" : "light"} className="w-full" magnetic={false}>
                  Start free trial
                </SbButton>
              </div>
            </Reveal>
          ))}

          <Reveal delay={2} className="h-full">
            <div className="flex h-full flex-col rounded-[30px] border-[1.5px] border-sb-ink/10 bg-white p-10 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_30px_60px_rgba(20,20,43,0.12)]">
              <h3 className="font-sb text-xl font-extrabold text-sb-ink">{EXTRA_PLAN.name}</h3>
              <div className="my-1.5 font-sb text-[40px] font-extrabold leading-tight tracking-tight text-sb-ink">
                Let&rsquo;s talk
              </div>
              <p className="font-sb text-sm text-sb-ink2">{EXTRA_PLAN.blurb}</p>
              <ul className="my-6 flex-1 space-y-0">
                {EXTRA_PLAN.features.map((f) => (
                  <li
                    key={f}
                    className="relative py-2.5 pl-7 font-sb text-[14.5px] text-sb-ink2 before:absolute before:left-0.5 before:font-extrabold before:text-sb-violet before:content-['✓']"
                  >
                    {f}
                  </li>
                ))}
              </ul>
              <SbButton href="/contact" variant="light" className="w-full" magnetic={false}>
                Contact us
              </SbButton>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
