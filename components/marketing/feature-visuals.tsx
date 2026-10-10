import {
  BellIcon,
  CalendarIcon,
  CameraIcon,
  CardIcon,
  CheckIcon,
  ClockIcon,
  HomeIcon,
  LockIcon,
  MapPinIcon,
  PortalIcon,
  QuoteIcon,
} from "@/components/ui/icons";

/**
 * CSS-only product illustrations for the feature pages — original TidyPro
 * artwork in the brand palette, standing in for product screenshots the way
 * feature pages typically pair each capability with its UI.
 * All are decorative (aria-hidden); the surrounding copy carries the meaning.
 */

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30"
    >
      {children}
    </div>
  );
}

function Pill({
  color,
  children,
}: {
  color: "blue" | "amber" | "green";
  children: React.ReactNode;
}) {
  const styles = {
    blue: "bg-brand-500 text-white",
    amber: "bg-amber-400 text-amber-950",
    green: "bg-emerald-500 text-white",
  } as const;
  return (
    <div
      className={`rounded-md px-2 py-1 text-[10px] font-semibold leading-tight ${styles[color]}`}
    >
      {children}
    </div>
  );
}

export function SchedulingVisual() {
  const days = [
    { d: "Mon", jobs: [{ c: "blue", t: "9:00 · Maple St" }] },
    { d: "Tue", jobs: [{ c: "green", t: "10:30 · Oak Ave" }, { c: "blue", t: "2:00 · Pine Rd" }] },
    { d: "Wed", jobs: [{ c: "amber", t: "11:00 · Elm Dr" }] },
    { d: "Thu", jobs: [{ c: "blue", t: "9:30 · Cedar Ln" }] },
    { d: "Fri", jobs: [{ c: "green", t: "1:00 · Birch Ct" }] },
  ] as const;
  return (
    <Frame>
      <div className="mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <CalendarIcon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          This week
        </span>
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
          6 visits scheduled
        </span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {days.map((day) => (
          <div
            key={day.d}
            className={`rounded-lg border p-1.5 ${
              day.d === "Wed"
                ? "border-brand-300 ring-2 ring-brand-200 dark:border-brand-700 dark:ring-brand-900"
                : "border-slate-100 dark:border-slate-800"
            }`}
          >
            <p className="mb-1.5 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {day.d}
            </p>
            <div className="space-y-1.5">
              {day.jobs.map((j, i) => (
                <Pill key={i} color={j.c as "blue" | "amber" | "green"}>
                  {j.t}
                </Pill>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-4 text-[11px] font-medium text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> Scheduled
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> In progress
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Completed
        </span>
      </div>
    </Frame>
  );
}

export function CommsVisual() {
  return (
    <Frame>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            <BellIcon className="h-5 w-5" />
          </span>
          <div className="rounded-xl rounded-tl-sm bg-slate-100 px-4 py-3 dark:bg-slate-800">
            <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">
              Reminder: clean tomorrow at 9:00 AM
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Hi Maria — your team arrives tomorrow between 9:00–9:30. Reply YES
              to confirm.
            </p>
          </div>
        </div>
        <div className="flex items-start justify-end gap-3">
          <div className="rounded-xl rounded-tr-sm bg-brand-600 px-4 py-3">
            <p className="text-[13px] font-semibold text-white">YES ✓</p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
          <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">
            Quote follow-up · sent automatically
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            “Just checking in — your quote for biweekly cleaning is still
            available. Approve it here.”
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckIcon className="h-3.5 w-3.5" /> Opened · 8:42 AM
          </p>
        </div>
        <p className="text-center text-[11px] font-medium text-slate-400">
          Confirmations · Reminders · Follow-ups — no typing required
        </p>
      </div>
    </Frame>
  );
}

export function BookingVisual() {
  return (
    <Frame>
      <div className="mb-4 flex items-center gap-2">
        <PortalIcon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Request a cleaning
        </p>
      </div>
      <div className="space-y-3">
        <div className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-[13px] text-slate-700 dark:border-slate-700 dark:text-slate-300">
          Sarah Miller
        </div>
        <div className="flex gap-2">
          {["Deep clean", "Recurring", "Move-out"].map((s, i) => (
            <span
              key={s}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                i === 1
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {s}
            </span>
          ))}
        </div>
        <div className="flex gap-2 text-[13px]">
          <span className="flex-1 rounded-lg border border-slate-200 px-3.5 py-2.5 text-slate-700 dark:border-slate-700 dark:text-slate-300">
            3 bed · 2 bath
          </span>
          <span className="flex-1 rounded-lg border border-slate-200 px-3.5 py-2.5 text-slate-700 dark:border-slate-700 dark:text-slate-300">
            Every 2 weeks
          </span>
        </div>
        <div className="rounded-lg bg-brand-600 py-2.5 text-center text-sm font-semibold text-white">
          Request booking
        </div>
      </div>
      <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
        <CheckIcon className="h-4 w-4" /> New request — quote ready to send
      </p>
    </Frame>
  );
}

export function InvoiceVisual() {
  const lines = [
    { label: "Biweekly clean · 3bd/2ba", amount: "$165.00" },
    { label: "Inside fridge add-on", amount: "$25.00" },
    { label: "Pet fee", amount: "$10.00" },
  ];
  return (
    <Frame>
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <QuoteIcon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          Invoice #1042
        </span>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          PAID
        </span>
      </div>
      <div className="space-y-2 border-b border-slate-100 pb-3 dark:border-slate-800">
        {lines.map((l) => (
          <div
            key={l.label}
            className="flex items-center justify-between text-[13px]"
          >
            <span className="text-slate-600 dark:text-slate-400">{l.label}</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {l.amount}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between py-3">
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Total due
        </span>
        <span className="text-lg font-bold text-slate-900 dark:text-white">
          $200.00
        </span>
      </div>
      <div className="flex gap-2">
        <span className="flex-1 rounded-lg bg-brand-600 py-2 text-center text-[13px] font-semibold text-white">
          Pay online
        </span>
        <span className="flex-1 rounded-lg border border-slate-200 py-2 text-center text-[13px] font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
          Print / PDF
        </span>
      </div>
    </Frame>
  );
}

export function CardProcessingVisual() {
  return (
    <Frame>
      <div className="mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <CardIcon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          Secure checkout
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <LockIcon className="h-3.5 w-3.5" /> PCI handled by Stripe
        </span>
      </div>
      <div className="rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 p-4 text-white">
        <p className="text-[11px] uppercase tracking-widest text-slate-400">
          Card
        </p>
        <p className="mt-1 font-mono text-sm tracking-[0.2em]">
          •••• •••• •••• 4242
        </p>
        <div className="mt-3 flex justify-between text-xs text-slate-300">
          <span>12 / 28</span>
          <span>CVC •••</span>
        </div>
      </div>
      <div className="mt-3 rounded-lg bg-brand-600 py-2.5 text-center text-sm font-semibold text-white">
        Pay $200.00
      </div>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        <CheckIcon className="h-4 w-4" /> Payment confirmed — invoice marked paid
        automatically
      </p>
    </Frame>
  );
}

export function ChecklistVisual() {
  const items = [
    { label: "Dust all surfaces & baseboards", done: true },
    { label: "Vacuum + mop all floors", done: true },
    { label: "Clean bathrooms & mirrors", done: true },
    { label: "Kitchen counters & appliances", done: true },
    { label: "Take before/after photos", done: false },
  ];
  return (
    <Frame>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Deep clean · template
        </p>
        <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
          4 of 5 done
        </span>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full w-4/5 rounded-full bg-brand-500" />
      </div>
      <ul className="space-y-2.5">
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-3 text-[13px]">
            <span
              className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                it.done
                  ? "bg-emerald-500 text-white"
                  : "border-2 border-slate-200 dark:border-slate-700"
              }`}
            >
              {it.done && <CheckIcon className="h-4 w-4" />}
            </span>
            <span
              className={
                it.done
                  ? "text-slate-400 line-through dark:text-slate-500"
                  : "font-medium text-slate-700 dark:text-slate-300"
              }
            >
              {it.label}
            </span>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

export function MobileAppVisual() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-fit">
      {/* Brand glow behind the phone */}
      <div className="absolute inset-x-8 top-10 bottom-0 -z-0 rounded-full bg-brand-400/25 blur-3xl dark:bg-brand-600/20" />

      {/* Floating assignment notification — tucked over the phone's top-right corner */}
      <div className="absolute -right-6 -top-3 z-10 hidden w-48 rotate-[5deg] rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-xl backdrop-blur sm:block dark:border-slate-700 dark:bg-slate-900/95">
        <div className="flex items-start gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600">
            <BellIcon className="h-4 w-4 text-white" />
          </span>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
              New job assigned
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
              Deep clean · 48 Oak Ave · Sat 1:30 PM
            </p>
          </div>
        </div>
      </div>

      {/* ===== iPhone-style device ===== */}
      <div className="relative z-[1] w-[290px] rotate-[3deg]">
        {/* Titanium frame */}
        <div className="relative rounded-[3.4rem] bg-gradient-to-br from-slate-600 via-slate-800 to-black p-[11px] shadow-[0_50px_90px_-24px_rgba(15,23,42,0.55)] ring-1 ring-slate-950">
          {/* Side buttons */}
          <span className="absolute -left-[2.5px] top-24 h-7 w-[3px] rounded-l-md bg-slate-700" />
          <span className="absolute -left-[2.5px] top-36 h-12 w-[3px] rounded-l-md bg-slate-700" />
          <span className="absolute -left-[2.5px] top-52 h-12 w-[3px] rounded-l-md bg-slate-700" />
          <span className="absolute -right-[2.5px] top-44 h-16 w-[3px] rounded-r-md bg-slate-700" />

          {/* Screen bezel + glass */}
          <div className="relative overflow-hidden rounded-[2.75rem] bg-black">
            {/* Screen */}
            <div className="relative h-[600px] overflow-hidden rounded-[2.6rem] bg-slate-50 dark:bg-slate-950">
              {/* Wallpaper wash */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-200/50 via-transparent to-transparent dark:from-brand-900/40" />

              {/* Dynamic Island */}
              <div className="absolute left-1/2 top-3 z-20 flex h-[27px] w-[105px] -translate-x-1/2 items-center justify-end rounded-full bg-black pr-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#1c2b3a]" />
              </div>

              {/* Status bar */}
              <div className="relative z-10 flex items-center justify-between px-8 pt-4">
                <span className="text-[12px] font-semibold tracking-tight text-slate-900 dark:text-white">
                  9:41
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="flex items-end gap-[2px]">
                    {[5, 8, 11, 14].map((h) => (
                      <span
                        key={h}
                        style={{ height: h }}
                        className="w-[3px] rounded-[1px] bg-slate-900 dark:bg-white"
                      />
                    ))}
                  </span>
                  <svg viewBox="0 0 16 12" className="h-3 w-4 fill-slate-900 dark:fill-white">
                    <path d="M8 10.6a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8zM8 7c-1.8 0-3.4.7-4.6 1.9l1.4 1.4A4.5 4.5 0 0 1 8 9c1.2 0 2.3.5 3.2 1.3l1.4-1.4A6.4 6.4 0 0 0 8 7zm0-3.6c-2.7 0-5.2 1.1-7 2.9l1.4 1.4A7.9 7.9 0 0 1 8 5.4c2.2 0 4.1.9 5.6 2.3l1.4-1.4A9.8 9.8 0 0 0 8 3.4z" />
                  </svg>
                  <span className="flex h-[11px] w-[23px] items-center rounded-[3.5px] border border-slate-900/50 p-[1.5px] dark:border-white/50">
                    <span className="h-full w-3/4 rounded-[1.5px] bg-slate-900 dark:bg-white" />
                  </span>
                </span>
              </div>

              {/* App header */}
              <div className="relative z-10 mt-3 flex items-center justify-between px-5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">
                    A
                  </span>
                  <div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Good morning
                    </p>
                    <p className="text-[14px] font-bold text-slate-900 dark:text-white">
                      Ana · Cleaner
                    </p>
                  </div>
                </div>
                <span className="relative rounded-full bg-white p-2.5 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
                  <BellIcon className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
                </span>
              </div>

              {/* Day summary card */}
              <div className="relative z-10 mx-5 mt-3 overflow-hidden rounded-2xl bg-slate-900 p-3.5 text-white shadow-lg">
                <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-brand-600/40 blur-2xl" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Saturday, Oct 10
                </p>
                <p className="mt-1 text-[17px] font-bold">3 jobs · 6.5 hrs</p>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full w-1/3 rounded-full bg-emerald-400" />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-300">
                  1 of 3 completed · next at 1:30 PM
                </p>
              </div>

              {/* Job cards */}
              <div className="relative z-10 mx-5 mt-3 space-y-2.5">
                {[
                  {
                    t: "9:00 AM",
                    a: "12 Maple St",
                    n: "Standard clean",
                    s: "In progress",
                    pill: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
                    ring: "ring-2 ring-amber-400/70",
                  },
                  {
                    t: "1:30 PM",
                    a: "48 Oak Ave",
                    n: "Deep clean",
                    s: "Scheduled",
                    pill: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
                    ring: "",
                  },
                  {
                    t: "4:00 PM",
                    a: "7 Birch Ln",
                    n: "Move-out clean",
                    s: "Completed",
                    pill: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
                    ring: "",
                  },
                ].map((j) => (
                  <div
                    key={j.a}
                    className={`rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800 ${j.ring}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="flex items-center gap-1.5 text-[12px] font-bold text-slate-900 dark:text-white">
                        <ClockIcon className="h-3.5 w-3.5 text-slate-400" />
                        {j.t}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${j.pill}`}
                      >
                        {j.s}
                      </span>
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-[12px] font-semibold text-slate-700 dark:text-slate-200">
                      <MapPinIcon className="h-3.5 w-3.5 text-brand-500" />
                      {j.a}
                    </p>
                    <p className="mt-0.5 pl-[18px] text-[11px] text-slate-400">
                      {j.n}
                    </p>
                  </div>
                ))}
              </div>

              {/* Primary action */}
              <div className="relative z-10 mx-5 mt-3">
                <div className="flex items-center justify-center gap-2 rounded-2xl bg-brand-600 py-3 shadow-lg shadow-brand-600/30">
                  <CheckIcon className="h-4 w-4 text-white" />
                  <span className="text-[13px] font-bold text-white">
                    Complete current job
                  </span>
                </div>
              </div>

              {/* Spacer so content clears the absolute tab bar */}
              <div className="h-24" />

              {/* Tab bar */}
              <div className="absolute inset-x-0 bottom-0 z-10 border-t border-slate-200/70 bg-white/90 px-6 pt-2.5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
                <div className="flex items-center justify-between">
                  {[
                    { icon: HomeIcon, label: "Jobs", active: true },
                    { icon: CalendarIcon, label: "Schedule", active: false },
                    { icon: CameraIcon, label: "Photos", active: false },
                    { icon: CheckIcon, label: "Done", active: false },
                  ].map((t) => (
                    <span
                      key={t.label}
                      className={`flex flex-col items-center gap-1 ${
                        t.active
                          ? "text-brand-600 dark:text-brand-400"
                          : "text-slate-400"
                      }`}
                    >
                      <t.icon className="h-5 w-5" />
                      <span className="text-[9px] font-semibold">{t.label}</span>
                    </span>
                  ))}
                </div>
                <div className="mx-auto mt-2 h-1 w-32 rounded-full bg-slate-900/80 dark:bg-white/80" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="relative z-[1] mt-5 text-center text-xs font-semibold text-slate-400">
        Coming soon · iOS &amp; Android
      </p>
    </div>
  );
}

/** Map a feature slug to its hero visual. */
export const FEATURE_VISUALS: Record<string, () => React.ReactNode> = {
  scheduling: SchedulingVisual,
  "automated-communications": CommsVisual,
  "online-booking": BookingVisual,
  "invoicing-billing": InvoiceVisual,
  "credit-card-processing": CardProcessingVisual,
  "cleaner-checklist": ChecklistVisual,
  "mobile-app": MobileAppVisual,
};
