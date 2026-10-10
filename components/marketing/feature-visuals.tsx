import {
  BellIcon,
  CalendarIcon,
  CardIcon,
  CheckIcon,
  ClockIcon,
  LockIcon,
  PhoneIcon,
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
    <div aria-hidden="true" className="mx-auto w-56">
      <div className="rounded-[2rem] border border-slate-200 bg-slate-900 p-2 shadow-xl dark:border-slate-700">
        <div className="rounded-[1.6rem] bg-white px-4 pb-5 pt-4 dark:bg-slate-950">
          <div className="mx-auto mb-3 h-1 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center gap-2">
            <PhoneIcon className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <p className="text-[13px] font-bold text-slate-900 dark:text-slate-100">
              Today&apos;s jobs
            </p>
          </div>
          <div className="mt-3 space-y-2.5">
            {[
              { t: "9:00 AM", a: "12 Maple St", s: "In progress", c: "bg-amber-100 text-amber-800" },
              { t: "1:30 PM", a: "48 Oak Ave", s: "Scheduled", c: "bg-brand-50 text-brand-700" },
            ].map((j) => (
              <div
                key={j.a}
                className="rounded-xl border border-slate-100 p-3 dark:border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                    <ClockIcon className="h-3.5 w-3.5 text-slate-400" />
                    {j.t}
                  </p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${j.c}`}>
                    {j.s}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {j.a}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-around border-t border-slate-100 pt-3 dark:border-slate-800">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-brand-600" : "bg-slate-200 dark:bg-slate-700"}`}
              />
            ))}
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs font-semibold text-slate-400">
        Coming soon · iOS & Android
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
