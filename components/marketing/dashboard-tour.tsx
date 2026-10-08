"use client";

import { useEffect, useRef, useState } from "react";
import {
  HomeIcon,
  UsersIcon,
  QuoteIcon,
  CalendarIcon,
  ClockIcon,
  CardIcon,
  CheckIcon,
  PauseIcon,
  PlayIcon,
} from "@/components/ui/icons";
import { LogoMark } from "@/components/ui/logo";

/* ------------------------------------------------------------------ */
/* Sample data (fictional — same flavor as the rest of the marketing   */
/* site).                                                             */
/* ------------------------------------------------------------------ */

const stats = [
  { label: "Today's jobs", value: 6, prefix: "", suffix: "" },
  { label: "Open quotes", value: 4, prefix: "", suffix: "" },
  { label: "Outstanding", value: 1240, prefix: "$", suffix: "" },
  { label: "This week", value: 3850, prefix: "$", suffix: "" },
];

const todayJobs = [
  { time: "9:00 AM", customer: "Maple Street Residence", meta: "Albany · Crew A", tone: "blue" },
  { time: "11:30 AM", customer: "Lakeside Dental Office", meta: "Saratoga Springs · Crew B", tone: "amber" },
];

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const weekJobs = [
  { day: 0, label: "9a Maple St", color: "bg-brand-500" },
  { day: 1, label: "11:30a Dental", color: "bg-accent-500" },
  { day: 2, label: "9a Elm Ave", color: "bg-brand-500" },
  { day: 2, label: "2p Lakeview", color: "bg-amber-400" },
  { day: 3, label: "10a Maple St", color: "bg-brand-500" },
  { day: 4, label: "9a Office Pk", color: "bg-accent-500" },
];

const checklist = [
  "Dust all surfaces",
  "Clean bathrooms",
  "Vacuum & mop floors",
  "Wipe kitchen + appliances",
];

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

const SCENES = [
  { id: "overview", caption: "Your whole day at a glance", dur: 7000 },
  { id: "quotes", caption: "Quotes that follow up themselves", dur: 7000 },
  { id: "schedule", caption: "A week of work, scheduled in seconds", dur: 6000 },
  { id: "job", caption: "Checklists keep every clean consistent", dur: 7000 },
  { id: "invoices", caption: "Invoices your customers actually pay", dur: 6000 },
  { id: "end", caption: "", dur: 5000 },
] as const;

function useCountUp(target: number, run: boolean, dur = 1200) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, target, dur]);
  return n;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fn = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return reduced;
}

/* ------------------------------------------------------------------ */
/* Scenes                                                              */
/* ------------------------------------------------------------------ */

function SceneOverview({ active }: { active: boolean }) {
  return (
    <div className={`absolute inset-0 p-4 pb-12 transition-all duration-700 ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}>
      <p className="text-sm font-semibold text-slate-900">Good morning, Sarah</p>
      <p className="text-xs text-slate-500">Thursday · 6 jobs today</p>
      <div className="mt-2.5 grid grid-cols-4 gap-2">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} run={active} />
        ))}
      </div>
      <div className="mt-2.5 space-y-1.5">
        {todayJobs.map((j, i) => (
          <div
            key={j.customer}
            className={`flex items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-1.5 shadow-sm transition-all duration-500 ${active ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
            style={{ transitionDelay: `${200 + i * 150}ms` }}
          >
            <span className="w-14 shrink-0 text-[11px] font-semibold text-slate-600">{j.time}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-900">{j.customer}</p>
              <p className="truncate text-[10px] text-slate-500">{j.meta}</p>
            </div>
            <span className={`h-2 w-2 shrink-0 rounded-full ${j.tone === "amber" ? "bg-amber-400" : "bg-brand-500"}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, prefix, suffix, run }: { label: string; value: number; prefix: string; suffix: string; run: boolean }) {
  const n = useCountUp(value, run);
  return (
    <div className="rounded-lg border border-slate-100 bg-white px-2.5 py-2 shadow-sm">
      <p className="text-sm font-bold text-slate-900">
        {prefix}
        {n.toLocaleString()}
        {suffix}
      </p>
      <p className="truncate text-[10px] text-slate-500">{label}</p>
    </div>
  );
}

function SceneQuotes({ active }: { active: boolean }) {
  return (
    <div className={`absolute inset-0 p-5 pb-12 transition-all duration-700 ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">Quote Q-1042</p>
            <p className="text-[11px] text-slate-500">Maple Street Residence · Deep clean</p>
          </div>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold text-amber-800">Sent</span>
        </div>
        <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-xs">
          <div className="flex justify-between text-slate-600"><span>Deep clean · 3bd/2ba</span><span className="font-medium text-slate-900">$240</span></div>
          <div className="flex justify-between text-slate-600"><span>Inside fridge + oven</span><span className="font-medium text-slate-900">$45</span></div>
          <div className="flex justify-between border-t border-slate-100 pt-1.5 font-bold text-slate-900"><span>Total</span><span>$285</span></div>
        </div>
        <div className="mt-3 space-y-1.5">
          {[
            { n: 1, label: "Follow-up 1", when: "in 2 days", done: false },
            { n: 2, label: "Follow-up 2", when: "in 5 days", done: false },
          ].map((f, i) => (
            <div
              key={f.n}
              className={`flex items-center justify-between rounded-lg bg-brand-50 px-3 py-1.5 transition-all duration-500 ${active ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"}`}
              style={{ transitionDelay: `${600 + i * 400}ms` }}
            >
              <span className="text-[11px] font-medium text-brand-900">{f.label} · {f.when}</span>
              <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold text-white">Scheduled</span>
            </div>
          ))}
        </div>
      </div>
      <p className={`mt-3 text-center text-[11px] text-slate-500 transition-opacity delay-1000 duration-500 ${active ? "opacity-100" : "opacity-0"}`}>
        Sending stops the moment they approve, decline, or it expires.
      </p>
    </div>
  );
}

function SceneSchedule({ active }: { active: boolean }) {
  return (
    <div className={`absolute inset-0 p-5 pb-12 transition-all duration-700 ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}>
      <div className="grid h-full grid-cols-5 gap-1.5">
        {weekDays.map((d, di) => (
          <div key={d} className="flex flex-col rounded-lg bg-slate-50 p-1.5">
            <p className={`text-center text-[10px] font-semibold ${di === 3 ? "text-brand-700" : "text-slate-500"}`}>{d}</p>
            <div className="mt-1.5 flex-1 space-y-1.5">
              {weekJobs
                .filter((j) => j.day === di)
                .map((j, i) => (
                  <div
                    key={`${di}-${i}`}
                    className={`rounded-md px-1.5 py-1 text-[9px] font-medium text-white shadow-sm transition-all duration-500 ${j.color} ${active ? "scale-100 opacity-100" : "scale-90 opacity-0"}`}
                    style={{ transitionDelay: `${di * 120 + i * 150}ms` }}
                  >
                    {j.label}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SceneJob({ active }: { active: boolean }) {
  const [done, setDone] = useState(0);
  useEffect(() => {
    if (!active) return;
    const timers = checklist.map((_, i) => setTimeout(() => setDone(i + 1), 700 + i * 900));
    return () => timers.forEach(clearTimeout);
  }, [active]);

  return (
    <div className={`absolute inset-0 p-5 pb-12 transition-all duration-700 ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-900">Maple Street Residence</p>
          <span className="rounded-full bg-brand-100 px-2.5 py-1 text-[10px] font-semibold text-brand-800">In progress</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-accent-500 transition-all duration-500"
            style={{ width: `${(done / checklist.length) * 100}%` }}
          />
        </div>
        <ul className="mt-3 space-y-2">
          {checklist.map((item, i) => {
            const checked = i < done;
            return (
              <li key={item} className="flex items-center gap-2.5">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-300 ${checked ? "border-accent-600 bg-accent-600" : "border-slate-300 bg-white"}`}
                >
                  {checked && <CheckIcon className="h-3.5 w-3.5 text-white" />}
                </span>
                <span className={`text-xs transition-colors ${checked ? "text-slate-400 line-through" : "text-slate-700"}`}>{item}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function SceneInvoices({ active }: { active: boolean }) {
  const [paid, setPaid] = useState(false);
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setPaid(true), 1600);
    return () => clearTimeout(t);
  }, [active]);

  return (
    <div className={`absolute inset-0 flex items-center justify-center p-5 transition-all duration-700 ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}>
      <div className="w-full max-w-xs rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">INV-2081</p>
            <p className="text-[11px] text-slate-500">Maple Street Residence</p>
          </div>
          <p className="text-lg font-bold text-slate-900">$285</p>
        </div>
        <div className={`mt-3 rounded-lg px-3 py-2 text-center text-xs font-semibold transition-all duration-500 ${paid ? "bg-accent-100 text-accent-800" : "bg-amber-100 text-amber-800"}`}>
          {paid ? "✓ Paid online — thank you!" : "Sent · awaiting payment"}
        </div>
        {!paid && (
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-1/3 animate-shimmer rounded-full bg-brand-400" />
          </div>
        )}
      </div>
    </div>
  );
}

function SceneEnd() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-brand-700 to-brand-900 p-6 text-center">
<LogoMark className="h-14 w-14" />
      <p className="mt-4 text-xl font-bold tracking-tight text-white">TidyPro</p>
      <p className="mt-2 max-w-xs text-sm text-brand-100">
        Run your cleaning business from one tidy place.
      </p>
      <span className="mt-5 rounded-full bg-white px-5 py-2 text-sm font-semibold text-brand-800">
        Start free trial
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Player                                                              */
/* ------------------------------------------------------------------ */

const nav = [
  { href: "#", label: "Dashboard", icon: HomeIcon, on: true },
  { href: "#", label: "Quotes", icon: QuoteIcon, on: false },
  { href: "#", label: "Schedule", icon: CalendarIcon, on: false },
  { href: "#", label: "My jobs", icon: ClockIcon, on: false },
  { href: "#", label: "Invoices", icon: CardIcon, on: false },
  { href: "#", label: "Team", icon: UsersIcon, on: false },
];

export function DashboardTour() {
  const reduced = useReducedMotion();
  const [scene, setScene] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [playing, setPlaying] = useState(true);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Pause when scrolled out of view.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setPlaying(e.isIntersecting && !reduced),
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  useEffect(() => {
    if (!playing || reduced) return;
    const t = setTimeout(() => {
      setScene((s) => (s + 1) % SCENES.length);
      setCycle((c) => c + 1);
    }, SCENES[scene].dur);
    return () => clearTimeout(t);
  }, [scene, playing, reduced]);

  const s = SCENES[scene];

  return (
    <div ref={wrapRef} aria-label="TidyPro dashboard tour" role="img">
      {/* Browser chrome */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-brand-600/10">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden="true">
            <i className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <i className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <i className="h-2.5 w-2.5 rounded-full bg-green-400" />
          </span>
          <span className="mx-auto hidden rounded-md bg-white px-3 py-0.5 text-[10px] text-slate-400 ring-1 ring-slate-200 sm:block">
            app.tidypro.com/dashboard
          </span>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "Pause tour" : "Play tour"}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 ring-1 ring-slate-200 transition hover:bg-white hover:text-slate-800"
          >
            {playing ? <PauseIcon className="h-3.5 w-3.5" /> : <PlayIcon className="h-3.5 w-3.5" />}
          </button>
        </div>

        <div className="flex">
          {/* Mini sidebar */}
          <div className="hidden w-32 shrink-0 flex-col gap-0.5 border-r border-slate-100 bg-white p-2 sm:flex" aria-hidden="true">
            {nav.map((n) => (
              <span
                key={n.label}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px] font-medium ${n.on ? "bg-brand-50 text-brand-800" : "text-slate-500"}`}
              >
                <n.icon className="h-3.5 w-3.5" />
                {n.label}
              </span>
            ))}
          </div>

          {/* Stage */}
          <div className="relative min-w-0 flex-1 bg-slate-50" style={{ aspectRatio: "16 / 10" }}>
            <SceneOverview key={`overview-${cycle}`} active={scene === 0} />
            <SceneQuotes key={`quotes-${cycle}`} active={scene === 1} />
            <SceneSchedule key={`schedule-${cycle}`} active={scene === 2} />
            <SceneJob key={`job-${cycle}`} active={scene === 3} />
            <SceneInvoices key={`invoices-${cycle}`} active={scene === 4} />
            {scene === 5 && <SceneEnd />}

            {/* Caption — cinematic subtitle scrim */}
            {s.caption && (
              <div key={scene} className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/55 via-slate-900/20 to-transparent px-4 pb-2.5 pt-8">
                <p className="animate-fade-up text-xs font-semibold text-white drop-shadow">
                  {s.caption}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="flex items-center gap-2 border-t border-slate-100 bg-white px-4 py-2.5">
          <div className="flex flex-1 gap-1" aria-hidden="true">
            {SCENES.map((sc, i) => (
              <button
                key={sc.id}
                type="button"
                tabIndex={-1}
                onClick={() => setScene(i)}
                className="group h-6 flex-1 cursor-pointer"
                aria-label={`Go to ${sc.id}`}
              >
                <span className="block h-1 overflow-hidden rounded-full bg-slate-100">
                  {i < scene && <span className="block h-full w-full bg-brand-500" />}
                  {i === scene && !reduced && playing && (
                    <span
                      key={scene}
                      className="block h-full origin-left bg-brand-500"
                      style={{ animation: `tourProgress ${sc.dur}ms linear forwards` }}
                    />
                  )}
                  {i === scene && (reduced || !playing) && (
                    <span className="block h-full w-1/3 bg-brand-300" />
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes tourProgress { from { transform: scaleX(0); } to { transform: scaleX(1); } }`}</style>
      <p className="mt-3 text-center text-xs text-slate-400">Live product tour — sample data shown</p>
    </div>
  );
}
