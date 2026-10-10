"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  CameraIcon,
} from "@/components/ui/icons";
import { LogoMark } from "@/components/ui/logo";

/* ------------------------------------------------------------------ */
/* Sample data (fictional — same flavor as the rest of the marketing   */
/* site).                                                             */
/* ------------------------------------------------------------------ */

const stats = [
  { label: "Today's jobs", value: 6 },
  { label: "Open quotes", value: 4 },
  { label: "Outstanding", value: 1240, prefix: "$" },
  { label: "This week", value: 3850, prefix: "$" },
];

const todayJobs = [
  { time: "9:00 AM", customer: "Maple Street Residence", meta: "Albany · Crew A", tone: "blue" },
  { time: "11:30 AM", customer: "Lakeside Dental Office", meta: "Saratoga Springs · Crew B", tone: "amber" },
  { time: "2:00 PM", customer: "Elm Avenue Duplex", meta: "Troy · Crew A", tone: "blue" },
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

const crew = [
  { initials: "SM", name: "Sarah Mitchell", role: "Owner", jobs: "Oversees 6 jobs", tone: "bg-brand-600" },
  { initials: "MA", name: "Crew A · Mike & Ana", role: "Deep cleans", jobs: "3 jobs today", tone: "bg-accent-600" },
  { initials: "JR", name: "Crew B · Jen & Rosa", role: "Recurring", jobs: "3 jobs today", tone: "bg-emerald-600" },
];

/* ------------------------------------------------------------------ */
/* Cursor choreography                                                 */
/* ------------------------------------------------------------------ */

interface Waypoint {
  /** Registered target name to glide to. */
  target: string;
  /** Travel time in ms (cinematic ease applied). */
  moveMs: number;
  /** Pause after arriving. */
  holdMs?: number;
  /** Fire this action id on arrival (with click press + ripple). */
  click?: string;
  /** Highlight id while holding here. */
  hot?: string;
}

type RegisterFn = (name: string) => (el: HTMLElement | null) => void;
type SubscribeFn = (id: string, cb: () => void) => () => void;

interface SceneProps {
  active: boolean;
  register: RegisterFn;
  hot: string | null;
  subscribe: SubscribeFn;
  /** True when the cinematic cursor drives interactions. */
  driven: boolean;
}

/** Per-scene cursor scripts. First waypoint = starting placement. */
const SCRIPTS: Waypoint[][] = [
  // 0 — Overview: browse stats, open the first job.
  [
    { target: "ov-stat-1", moveMs: 0 },
    { target: "ov-stat-1", moveMs: 750, holdMs: 550, hot: "ov-stat-1" },
    { target: "ov-stat-3", moveMs: 850, holdMs: 550, hot: "ov-stat-3" },
    { target: "ov-job-0", moveMs: 850, holdMs: 450, hot: "ov-job-0", click: "nav:3" },
  ],
  // 1 — Job: tick the checklist, peek at a photo, head to Quotes.
  [
    { target: "job-check-0", moveMs: 0 },
    { target: "job-check-0", moveMs: 650, holdMs: 250, click: "job:check" },
    { target: "job-check-1", moveMs: 550, holdMs: 250, click: "job:check" },
    { target: "job-check-2", moveMs: 550, holdMs: 250, click: "job:check" },
    { target: "job-check-3", moveMs: 550, holdMs: 300, click: "job:check" },
    { target: "job-photo-1", moveMs: 700, holdMs: 500, hot: "job-photo-1", click: "job:photo" },
    { target: "nav-1", moveMs: 900, holdMs: 350, click: "nav:1" },
  ],
  // 2 — Quotes: approve the quote, head to Schedule.
  [
    { target: "q-fu-0", moveMs: 0 },
    { target: "q-fu-0", moveMs: 700, holdMs: 450, hot: "q-fu-0" },
    { target: "q-fu-1", moveMs: 500, holdMs: 450, hot: "q-fu-1" },
    { target: "q-approve", moveMs: 700, holdMs: 350, click: "quotes:approve" },
    { target: "nav-2", moveMs: 900, holdMs: 350, click: "nav:2" },
  ],
  // 3 — Schedule: drop a job into Thursday, head to Invoices.
  [
    { target: "sch-day-1", moveMs: 0 },
    { target: "sch-day-1", moveMs: 650, holdMs: 400 },
    { target: "sch-day-3", moveMs: 700, holdMs: 450, click: "schedule:add" },
    { target: "nav-4", moveMs: 900, holdMs: 350, click: "nav:4" },
  ],
  // 4 — Invoices: send it, watch it get paid, head to Team.
  [
    { target: "inv-send", moveMs: 0 },
    { target: "inv-send", moveMs: 700, holdMs: 400, click: "invoices:send" },
    { target: "nav-5", moveMs: 900, holdMs: 900, click: "nav:5" },
  ],
  // 5 — Team: look over the crew, then drift to the end card.
  [
    { target: "team-0", moveMs: 0 },
    { target: "team-0", moveMs: 650, holdMs: 500, hot: "team-0" },
    { target: "team-1", moveMs: 550, holdMs: 500, hot: "team-1" },
    { target: "team-2", moveMs: 550, holdMs: 700, hot: "team-2" },
  ],
  // 6 — End card: tap the CTA.
  [
    { target: "end-cta", moveMs: 0 },
    { target: "end-cta", moveMs: 800, holdMs: 600, click: "end:cta" },
  ],
];

const SCENES = [
  { id: "overview", caption: "Your whole day at a glance", dur: 8000 },
  { id: "job", caption: "Every job, checked off — with photo proof", dur: 10500 },
  { id: "quotes", caption: "Quotes that follow up themselves", dur: 9000 },
  { id: "schedule", caption: "A week of work, scheduled in seconds", dur: 8000 },
  { id: "invoices", caption: "Invoices your customers actually pay", dur: 9000 },
  { id: "team", caption: "Your crew, in sync", dur: 7000 },
  { id: "end", caption: "", dur: 6000 },
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

function useCinematic() {
  const [on, setOn] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(hover: hover) and (min-width: 640px) and (prefers-reduced-motion: no-preference)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (min-width: 640px) and (prefers-reduced-motion: no-preference)");
    const fn = (e: MediaQueryListEvent) => setOn(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return on;
}

/* ------------------------------------------------------------------ */
/* Cursor                                                              */
/* ------------------------------------------------------------------ */

function CursorArrow({ pressing }: { pressing: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      style={{
        transform: `translate(-2px, -3px) scale(${pressing ? 0.84 : 1})`,
        transition: "transform 130ms ease-out",
        filter: "drop-shadow(0 2px 4px rgb(0 0 0 / 0.28))",
      }}
      aria-hidden="true"
    >
      <path
        d="M5.5 3.2 19.6 11.6c.6.4.7 1.2.2 1.7l-5.4 5.1c-.3.3-.8.4-1.2.2l-2.5-1.1-2.9 4.6c-.3.5-1 .6-1.4.2-.4-.4-.5-1-.2-1.4L5.5 3.2z"
        fill="#fff"
        stroke="#0f172a"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Scenes                                                              */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  prefix,
  run,
  hot,
  register,
  id,
}: {
  label: string;
  value: number;
  prefix?: string;
  run: boolean;
  hot: boolean;
  register: RegisterFn;
  id: string;
}) {
  const n = useCountUp(value, run);
  return (
    <div
      ref={register(id)}
      className={`rounded-lg border bg-white dark:bg-slate-900 px-2.5 py-2 shadow-sm transition-all duration-300 ${
        hot ? "border-brand-400 ring-2 ring-brand-200 scale-[1.04]" : "border-slate-100 dark:border-slate-800"
      }`}
    >
      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
        {prefix}
        {n.toLocaleString()}
      </p>
      <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function SceneOverview({ active, register, hot }: SceneProps) {
  return (
    <div className={`absolute inset-0 p-4 pb-5 transition-all duration-700 ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}>
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Good morning, Sarah</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">Thursday · 6 jobs today</p>
      <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((s, i) => (
          <StatCard key={s.label} label={s.label} value={s.value} prefix={s.prefix} run={active} hot={hot === `ov-stat-${i}`} register={register} id={`ov-stat-${i}`} />
        ))}
      </div>
      <div className="mt-2.5 space-y-1.5">
        {todayJobs.map((j, i) => (
          <div
            key={j.customer}
            ref={register(`ov-job-${i}`)}
            className={`flex items-center gap-3 rounded-lg border bg-white dark:bg-slate-900 px-3 py-1.5 shadow-sm transition-all duration-500 ${
              active ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            } ${hot === `ov-job-${i}` ? "border-brand-400 ring-2 ring-brand-200 scale-[1.02]" : "border-slate-100 dark:border-slate-800"}`}
            style={{ transitionDelay: `${200 + i * 150}ms` }}
          >
            <span className="w-14 shrink-0 text-[11px] font-semibold text-slate-600 dark:text-slate-400">{j.time}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">{j.customer}</p>
              <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">{j.meta}</p>
            </div>
            <span className={`h-2 w-2 shrink-0 rounded-full ${j.tone === "amber" ? "bg-amber-400" : "bg-brand-500"}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SceneJob({ active, register, hot, subscribe, driven }: SceneProps) {
  const [done, setDone] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => subscribe("job:check", () => setDone((d) => Math.min(d + 1, checklist.length))), [subscribe]);
  useEffect(() => subscribe("job:photo", () => setZoomed(true)), [subscribe]);

  // Fallback when the cursor isn't driving.
  useEffect(() => {
    if (driven || !active) return;
    const timers = checklist.map((_, i) => setTimeout(() => setDone(i + 1), 800 + i * 900));
    return () => timers.forEach(clearTimeout);
  }, [driven, active]);

  return (
    <div className={`absolute inset-0 p-4 pb-5 transition-all duration-700 ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}>
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Maple Street Residence</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Deep clean · Crew A</p>
          </div>
          <span className="rounded-full bg-brand-100 dark:bg-brand-900 px-2.5 py-1 text-[10px] font-semibold text-brand-800 dark:text-brand-300">In progress</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-accent-500 transition-all duration-500" style={{ width: `${(done / checklist.length) * 100}%` }} />
        </div>
        <ul className="mt-3 space-y-2">
          {checklist.map((item, i) => {
            const checked = i < done;
            return (
              <li key={item} className="flex items-center gap-2.5">
                <span
                  ref={register(`job-check-${i}`)}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-300 ${
                    checked ? "border-accent-600 bg-accent-600 scale-110" : "border-slate-300 bg-white dark:bg-slate-900"
                  } ${hot === `job-check-${i}` ? "ring-2 ring-brand-300" : ""}`}
                >
                  {checked && <CheckIcon className="h-3.5 w-3.5 text-white" />}
                </span>
                <span className={`text-xs transition-colors ${checked ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-300"}`}>{item}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex gap-2">
          {["Before", "After"].map((label, i) => (
            <div
              key={label}
              ref={register(`job-photo-${i}`)}
              className={`relative flex-1 overflow-hidden rounded-lg transition-all duration-300 ${
                hot === `job-photo-${i}` || (zoomed && i === 1) ? "ring-2 ring-brand-400 scale-[1.03]" : "ring-1 ring-slate-200 dark:ring-slate-700"
              }`}
            >
              <div className={`flex h-16 items-center justify-center ${i === 0 ? "bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800" : "bg-gradient-to-br from-brand-100 to-accent-100 dark:from-brand-900 dark:to-accent-900"}`}>
                <CameraIcon className="h-5 w-5 text-slate-400" />
              </div>
              <span className="absolute left-1.5 top-1.5 rounded bg-slate-900/70 px-1.5 py-0.5 text-[9px] font-semibold text-white">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SceneQuotes({ active, register, hot, subscribe, driven }: SceneProps) {
  const [approved, setApproved] = useState(false);

  useEffect(() => subscribe("quotes:approve", () => setApproved(true)), [subscribe]);

  useEffect(() => {
    if (driven || !active) return;
    const t = setTimeout(() => setApproved(true), 3500);
    return () => clearTimeout(t);
  }, [driven, active]);

  return (
    <div className={`absolute inset-0 p-5 pb-5 transition-all duration-700 ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}>
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Quote Q-1042</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Maple Street Residence · Deep clean</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors duration-500 ${approved ? "bg-accent-100 dark:bg-accent-950 text-accent-800 dark:text-accent-300" : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"}`}>
            {approved ? "Approved" : "Sent"}
          </span>
        </div>
        <div className="mt-3 space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
          <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Deep clean · 3bd/2ba</span><span className="font-medium text-slate-900 dark:text-slate-100">$240</span></div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Inside fridge + oven</span><span className="font-medium text-slate-900 dark:text-slate-100">$45</span></div>
          <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-1.5 font-bold text-slate-900 dark:text-slate-100"><span>Total</span><span>$285</span></div>
        </div>
        <div className={`mt-3 grid transition-all duration-500 ${approved ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"}`}>
          <div className="overflow-hidden">
            <div className="space-y-1.5">
              {[
                { label: "Follow-up 1 · in 2 days", id: "q-fu-0" },
                { label: "Follow-up 2 · in 5 days", id: "q-fu-1" },
              ].map((f) => (
                <div
                  key={f.id}
                  ref={register(f.id)}
                  className={`flex items-center justify-between rounded-lg bg-brand-50 dark:bg-brand-950 px-3 py-1.5 transition-all ${hot === f.id ? "ring-2 ring-brand-300 scale-[1.02]" : ""}`}
                >
                  <span className="text-[11px] font-medium text-brand-900 dark:text-brand-200">{f.label}</span>
                  <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold text-white">Scheduled</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className={`grid transition-all duration-500 ${approved ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
          <p className="overflow-hidden pt-1 text-center text-[11px] font-medium text-accent-700 dark:text-accent-400">
            ✓ Customer approved — follow-ups canceled automatically.
          </p>
        </div>
        <button
          ref={register("q-approve")}
          type="button"
          tabIndex={-1}
          className={`mt-3 w-full rounded-lg py-2 text-xs font-semibold text-white shadow-sm transition-all duration-300 ${
            approved ? "bg-accent-600" : "bg-brand-600 hover:bg-brand-700"
          } ${hot === "q-approve" ? "ring-2 ring-brand-300 ring-offset-1 scale-[1.02]" : ""}`}
        >
          {approved ? "Approved ✓" : "Approve quote"}
        </button>
      </div>
    </div>
  );
}

function SceneSchedule({ active, register, hot, subscribe, driven }: SceneProps) {
  const [added, setAdded] = useState(false);

  useEffect(() => subscribe("schedule:add", () => setAdded(true)), [subscribe]);

  useEffect(() => {
    if (driven || !active) return;
    const t = setTimeout(() => setAdded(true), 3000);
    return () => clearTimeout(t);
  }, [driven, active]);

  return (
    <div className={`absolute inset-0 p-5 pb-5 transition-all duration-700 ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}>
      <div className="grid h-full grid-cols-5 gap-1.5">
        {weekDays.map((d, di) => (
          <div
            key={d}
            ref={di === 3 ? register("sch-day-3") : di === 1 ? register("sch-day-1") : undefined}
            className={`flex flex-col rounded-lg bg-slate-50 dark:bg-slate-800/60 p-1.5 transition-all ${hot === `sch-day-${di}` ? "ring-2 ring-brand-300" : ""}`}
          >
            <p className={`text-center text-[10px] font-semibold ${di === 3 ? "text-brand-700 dark:text-brand-300" : "text-slate-500 dark:text-slate-400"}`}>{d}</p>
            <div className="mt-1.5 flex-1 space-y-1.5">
              {weekJobs
                .filter((j) => j.day === di)
                .map((j, i) => (
                  <div key={`${di}-${i}`} className={`rounded-md px-1.5 py-1 text-[9px] font-medium text-white shadow-sm ${j.color}`}>
                    {j.label}
                  </div>
                ))}
              {di === 3 && (
                <div className={`grid transition-all duration-500 ${added ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <div className="overflow-hidden">
                    <div className={`rounded-md bg-accent-500 px-1.5 py-1 text-[9px] font-medium text-white shadow-sm transition-transform duration-500 ${added ? "scale-100" : "scale-75"}`}>
                      2p Maple St
                    </div>
                  </div>
                </div>
              )}
              {di === 3 && !added && (
                <div className="rounded-md border border-dashed border-slate-300 dark:border-slate-600 px-1.5 py-1 text-center text-[9px] text-slate-400">
                  +
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SceneInvoices({ active, register, hot, subscribe, driven }: SceneProps) {
  const [sent, setSent] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(
    () =>
      subscribe("invoices:send", () => {
        setSent(true);
        setTimeout(() => setPaid(true), 1400);
      }),
    [subscribe],
  );

  useEffect(() => {
    if (driven || !active) return;
    const t1 = setTimeout(() => setSent(true), 1800);
    const t2 = setTimeout(() => setPaid(true), 3600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [driven, active]);

  return (
    <div className={`absolute inset-0 flex items-center justify-center p-5 transition-all duration-700 ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}>
      <div className="w-full max-w-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">INV-2081</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Maple Street Residence</p>
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">$285</p>
        </div>
        <div className={`mt-3 rounded-lg px-3 py-2 text-center text-xs font-semibold transition-all duration-500 ${paid ? "bg-accent-100 dark:bg-accent-950 text-accent-800 dark:text-accent-300" : sent ? "bg-brand-100 dark:bg-brand-950 text-brand-800 dark:text-brand-300" : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"}`}>
          {paid ? "✓ Paid online — thank you!" : sent ? "Sending…" : "Draft · ready to send"}
        </div>
        {sent && !paid && (
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full w-1/3 animate-shimmer rounded-full bg-brand-400" />
          </div>
        )}
        <button
          ref={register("inv-send")}
          type="button"
          tabIndex={-1}
          className={`mt-3 w-full rounded-lg py-2 text-xs font-semibold text-white shadow-sm transition-all duration-300 ${sent ? "bg-slate-300 dark:bg-slate-700" : "bg-brand-600 hover:bg-brand-700"} ${hot === "inv-send" ? "ring-2 ring-brand-300 ring-offset-1 scale-[1.02]" : ""}`}
        >
          {sent ? "Sent ✓" : "Send invoice"}
        </button>
      </div>
    </div>
  );
}

function SceneTeam({ active, register, hot }: SceneProps) {
  return (
    <div className={`absolute inset-0 p-5 pb-5 transition-all duration-700 ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}>
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Your crew</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">3 teams · all on schedule</p>
      <div className="mt-3 space-y-2">
        {crew.map((c, i) => (
          <div
            key={c.name}
            ref={register(`team-${i}`)}
            className={`flex items-center gap-3 rounded-xl border bg-white dark:bg-slate-900 px-3 py-2.5 shadow-sm transition-all duration-500 ${
              active ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            } ${hot === `team-${i}` ? "border-brand-400 ring-2 ring-brand-200 scale-[1.03]" : "border-slate-100 dark:border-slate-800"}`}
            style={{ transitionDelay: `${i * 150}ms` }}
          >
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${c.tone}`}>
              {c.initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">{c.name}</p>
              <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">{c.role} · {c.jobs}</p>
            </div>
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SceneEnd({ register, hot, subscribe }: Omit<SceneProps, "active" | "driven">) {
  const [pulsed, setPulsed] = useState(false);
  useEffect(
    () =>
      subscribe("end:cta", () => {
        setPulsed(true);
        setTimeout(() => setPulsed(false), 700);
      }),
    [subscribe],
  );
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-brand-700 to-brand-900 p-6 text-center">
      <LogoMark className="h-14 w-14" />
      <p className="mt-4 text-xl font-bold tracking-tight text-white">TidyPro</p>
      <p className="mt-2 max-w-xs text-sm text-brand-100">Run your cleaning business from one tidy place.</p>
      <span
        ref={register("end-cta")}
        className={`mt-5 rounded-full bg-white px-5 py-2 text-sm font-semibold text-brand-800 shadow-lg transition-all duration-300 ${pulsed ? "scale-110" : "scale-100"} ${hot === "end-cta" ? "ring-2 ring-white/60 scale-105" : ""}`}
      >
        Start free trial
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Player                                                              */
/* ------------------------------------------------------------------ */

const nav = [
  { label: "Dashboard", icon: HomeIcon },
  { label: "Quotes", icon: QuoteIcon },
  { label: "Schedule", icon: CalendarIcon },
  { label: "My jobs", icon: ClockIcon },
  { label: "Invoices", icon: CardIcon },
  { label: "Team", icon: UsersIcon },
];

/** Nav item → scene index. */
const NAV_SCENE = [0, 2, 3, 1, 4, 5];

export function DashboardTour() {
  const cinematic = useCinematic();
  const [scene, setScene] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [playing, setPlaying] = useState(true);
  const areaRef = useRef<HTMLDivElement>(null);
  const targets = useRef(new Map<string, HTMLElement>());

  const register = useCallback<RegisterFn>(
    (name) => (el) => {
      if (el) targets.current.set(name, el);
      else targets.current.delete(name);
    },
    [],
  );

  // Cursor state
  const [cur, setCur] = useState<{ x: number; y: number } | null>(null);
  const [moveMs, setMoveMs] = useState(0);
  const [pressing, setPressing] = useState(false);
  const [hot, setHot] = useState<string | null>(null);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const subs = useRef(new Map<string, Set<() => void>>());
  const subscribe = useCallback<SubscribeFn>((id, cb) => {
    let set = subs.current.get(id);
    if (!set) {
      set = new Set();
      subs.current.set(id, set);
    }
    set.add(cb);
    return () => {
      set!.delete(cb);
    };
  }, []);

  const resolveTarget = useCallback((name: string) => {
    const area = areaRef.current;
    const el = targets.current.get(name);
    if (!area || !el) return null;
    const a = area.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (a.width === 0 || a.height === 0) return null;
    return {
      x: ((r.left + r.width / 2 - a.left) / a.width) * 100,
      y: ((r.top + r.height / 2 - a.top) / a.height) * 100,
    };
  }, []);

  const fire = useCallback((id: string) => {
    subs.current.get(id)?.forEach((cb) => cb());
    if (id.startsWith("nav:")) {
      const n = parseInt(id.slice(4), 10);
      if (NAV_SCENE[n] !== undefined) {
        setScene(NAV_SCENE[n]);
        setCycle((c) => c + 1);
      }
    }
  }, []);

  // Cursor choreography sequencer.
  useEffect(() => {
    if (!cinematic || !playing) return;
    const script = SCRIPTS[scene];
    let dead = false;
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => {
      timers.push(window.setTimeout(() => { if (!dead) fn(); }, ms));
    };

    // Place the cursor at the script's start inside a task so the effect
    // body itself stays free of synchronous state updates.
    at(0, () => {
      const first = resolveTarget(script[0].target);
      setMoveMs(0);
      setCur(first);
      setHot(null);
      setPressing(false);
    });

    let t = 700;
    script.slice(1).forEach((step) => {
      at(t, () => {
        const p = resolveTarget(step.target);
        if (p) {
          setMoveMs(step.moveMs);
          setCur(p);
        }
      });
      t += step.moveMs;
      at(t, () => {
        if (step.hot) setHot(step.hot);
        if (step.click) {
          setPressing(true);
          const p = resolveTarget(step.target);
          const id = Math.random();
          if (p) setRipples((rs) => [...rs, { id, x: p.x, y: p.y }]);
          fire(step.click);
          window.setTimeout(() => {
            if (dead) return;
            setPressing(false);
            setRipples((rs) => rs.filter((x) => x.id !== id));
          }, 480);
        }
      });
      t += step.click ? 520 : 0;
      t += step.holdMs ?? 380;
      const clearAt = t;
      at(clearAt, () => setHot(null));
    });

    return () => {
      dead = true;
      timers.forEach(clearTimeout);
      setPressing(false);
      setHot(null);
    };
  }, [scene, cinematic, playing, fire, resolveTarget]);

  // Scene auto-advance (backstop; nav clicks usually advance sooner).
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => {
      setScene((s) => (s + 1) % SCENES.length);
      setCycle((c) => c + 1);
    }, SCENES[scene].dur);
    return () => clearTimeout(t);
  }, [scene, playing, cycle]);

  // Pause when scrolled out of view.
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setPlaying(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const s = SCENES[scene];
  const key = `${scene}-${cycle}`;

  return (
    <div ref={wrapRef} aria-label="TidyPro dashboard tour" role="img">
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl shadow-brand-600/10">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden="true">
            <i className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <i className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <i className="h-2.5 w-2.5 rounded-full bg-green-400" />
          </span>
          <span className="mx-auto hidden rounded-md bg-white dark:bg-slate-900 px-3 py-0.5 text-[10px] text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700 sm:block">
            app.tidypro.com/dashboard
          </span>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "Pause tour" : "Play tour"}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:ring-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            {playing ? <PauseIcon className="h-3.5 w-3.5" /> : <PlayIcon className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Interactive area: sidebar + stage (cursor lives here) */}
        <div ref={areaRef} className="relative flex">
          <div className="hidden w-32 shrink-0 flex-col gap-0.5 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 sm:flex" aria-hidden="true">
            {nav.map((n, i) => (
              <span
                key={n.label}
                ref={register(`nav-${i}`)}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px] font-medium transition-colors ${
                  NAV_SCENE[i] === scene ? "bg-brand-50 dark:bg-brand-950 text-brand-800 dark:text-brand-300" : "text-slate-500 dark:text-slate-400"
                }`}
              >
                <n.icon className="h-3.5 w-3.5" />
                {n.label}
              </span>
            ))}
          </div>

          {/* Stage. overflow-hidden stops the scenes from painting over the
              caption and timeline bars; min-h keeps content inside the frame
              on narrow phones, where a 16:10 box is too short. */}
          <div
            className="relative min-h-[19rem] min-w-0 flex-1 overflow-hidden bg-slate-50 sm:min-h-0 dark:bg-slate-950"
            style={{ aspectRatio: "16 / 10" }}
          >
            {scene === 0 && <SceneOverview key={key} active register={register} hot={hot} subscribe={subscribe} driven={cinematic} />}
            {scene === 1 && <SceneJob key={key} active register={register} hot={hot} subscribe={subscribe} driven={cinematic} />}
            {scene === 2 && <SceneQuotes key={key} active register={register} hot={hot} subscribe={subscribe} driven={cinematic} />}
            {scene === 3 && <SceneSchedule key={key} active register={register} hot={hot} subscribe={subscribe} driven={cinematic} />}
            {scene === 4 && <SceneInvoices key={key} active register={register} hot={hot} subscribe={subscribe} driven={cinematic} />}
            {scene === 5 && <SceneTeam key={key} active register={register} hot={hot} subscribe={subscribe} driven={cinematic} />}
            {scene === 6 && <SceneEnd key={key} register={register} hot={hot} subscribe={subscribe} />}
          </div>

          {/* Cinematic cursor */}
          {cinematic && cur && (
            <div
              className="pointer-events-none absolute left-0 top-0 z-50"
              style={{
                left: `${cur.x}%`,
                top: `${cur.y}%`,
                transition: `left ${moveMs}ms cubic-bezier(0.22, 1, 0.36, 1), top ${moveMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
              }}
            >
              <CursorArrow pressing={pressing} />
            </div>
          )}
          {cinematic &&
            ripples.map((r) => (
              <span
                key={r.id}
                className="pointer-events-none absolute z-40 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand-500 animate-cursor-ripple"
                style={{ left: `${r.x}%`, top: `${r.y}%` }}
              />
            ))}
        </div>

        {/* Caption lives in its own bar below the frame. An in-stage scrim
            overlay used to darken the product UI behind it and read as a
            rendering bug. */}
        <div className="h-8 shrink-0 border-t border-slate-100 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
          {s.caption && (
            <p
              key={`m-${scene}`}
              className="animate-fade-up flex h-full items-center justify-center text-center text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              {s.caption}
            </p>
          )}
        </div>

        {/* Timeline */}
        <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5">
          <div className="flex flex-1 gap-1" aria-hidden="true">
            {SCENES.map((sc, i) => (
              <button key={sc.id} type="button" tabIndex={-1} onClick={() => { setScene(i); setCycle((c) => c + 1); }} className="group flex h-10 flex-1 cursor-pointer items-center" aria-label={`Go to ${sc.id}`}>
                <span className="block h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  {i < scene && <span className="block h-full w-full bg-brand-500" />}
                  {i === scene && playing && (
                    <span key={scene} className="block h-full origin-left bg-brand-500" style={{ animation: `tourProgress ${sc.dur}ms linear forwards` }} />
                  )}
                  {i === scene && !playing && <span className="block h-full w-1/3 bg-brand-300" />}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes tourProgress { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes cursorRipple { 0% { transform: translate(-50%,-50%) scale(0.4); opacity: 0.9; } 100% { transform: translate(-50%,-50%) scale(3.2); opacity: 0; } }
        .animate-cursor-ripple { animation: cursorRipple 480ms ease-out forwards; }
      `}</style>
      <p className="mt-3 text-center text-xs text-slate-400">Live product tour — sample data shown</p>
    </div>
  );
}
