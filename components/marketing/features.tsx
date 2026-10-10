import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/marketing/reveal";
import { SpotlightCard } from "@/components/marketing/spotlight-card";
import {
  BellIcon,
  CalendarIcon,
  CardIcon as CardPayIcon,
  CheckIcon,
  PortalIcon,
  QuoteIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { getContent } from "@/lib/studio/content";

export type FeatureItem = {
  icon: string;
  title: string;
  description: string;
};

const ICONS: Record<string, React.ReactNode> = {
  calendar: <CalendarIcon />,
  quote: <QuoteIcon />,
  users: <UsersIcon />,
  card: <CardPayIcon />,
  portal: <PortalIcon />,
  bell: <BellIcon />,
};

/**
 * Bento rhythm. The first two features earn a double-width card with a live
 * miniature of the product; the next three sit three-up; the last one runs
 * full-bleed as a closing "and it's all included" banner.
 */
const SPANS = [
  "lg:col-span-3",
  "lg:col-span-3",
  "lg:col-span-2",
  "lg:col-span-2",
  "lg:col-span-2",
  "lg:col-span-6",
];

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-7 ${className}`}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Decorative mini-visuals — pure DOM stand-ins for the real UI, so the  */
/* page ships no screenshots and stays crisp at any density.            */
/* ------------------------------------------------------------------ */

function MiniSchedule() {
  const days = ["M", "T", "W", "T", "F"];
  const blocks = [
    { d: 0, t: "9a", tone: "bg-brand-500" },
    { d: 1, t: "11a", tone: "bg-accent-500" },
    { d: 2, t: "9a", tone: "bg-brand-500" },
    { d: 2, t: "2p", tone: "bg-amber-400" },
    { d: 4, t: "10a", tone: "bg-accent-500" },
  ];
  return (
    <Panel className="mt-7 bg-surface-2 shadow-sm">
      <div className="grid grid-cols-5 gap-2">
        {days.map((d, i) => (
          <div key={i} className="min-w-0">
            <p className="text-center font-mono text-[10px] tracking-wider text-ink-3 uppercase">
              {d}
            </p>
            <div className="mt-2 min-h-12 space-y-1.5">
              {blocks
                .filter((b) => b.d === i)
                .map((b, j) => (
                  <div
                    key={j}
                    className={`rounded-md px-1 py-1 text-center text-[9px] font-medium text-white shadow-sm ${b.tone}`}
                  >
                    {b.t}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 border-t border-line pt-3 text-center font-mono text-[10px] text-ink-3">
        conflict warnings on
      </p>
    </Panel>
  );
}

function MiniQuote() {
  return (
    <Panel className="mt-7 bg-surface-2 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-ink">Q-1042 · Deep clean</p>
          <p className="mt-0.5 text-[11px] text-ink-3">Maple St Residence</p>
        </div>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          Sent
        </span>
      </div>
      <div className="mt-3 space-y-1.5 text-[11px]">
        <div className="flex justify-between text-ink-3">
          <span>Deep clean · 3bd</span>
          <span className="font-medium text-ink">$240</span>
        </div>
        <div className="flex justify-between text-ink-3">
          <span>Inside fridge + oven</span>
          <span className="font-medium text-ink">$45</span>
        </div>
        <div className="flex justify-between border-t border-line pt-1.5 font-semibold text-ink">
          <span>Total</span>
          <span>$285</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {["in 2 days", "in 5 days"].map((t) => (
          <span
            key={t}
            className="flex items-center gap-1.5 rounded-full bg-brand-50 px-2 py-1 text-[10px] font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-500" />
            </span>
            Follow-up {t}
          </span>
        ))}
      </div>
    </Panel>
  );
}

function MiniChecklist() {
  const items = [
    { label: "Dust all surfaces", done: true },
    { label: "Clean bathrooms", done: true },
    { label: "Vacuum & mop floors", done: false },
    { label: "Wipe kitchen + appliances", done: false },
  ];
  return (
    <Panel className="mt-7 bg-surface-2 shadow-sm">
      <ul className="space-y-2.5">
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-2.5">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                it.done
                  ? "border-accent-600 bg-accent-600"
                  : "border-line-strong bg-surface"
              }`}
            >
              {it.done && <CheckIcon className="h-3.5 w-3.5 text-white" />}
            </span>
            <span
              className={`text-[11px] ${
                it.done ? "text-ink-3 line-through" : "text-ink"
              }`}
            >
              {it.label}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function MiniPortal() {
  return (
    <Panel className="mt-7 bg-surface-2 shadow-sm">
      <div className="rounded-xl bg-surface p-3 shadow-sm">
        <p className="text-[11px] font-semibold text-ink">Upcoming visit</p>
        <p className="mt-0.5 text-[10px] text-ink-3">
          Thu · 9:00 AM · Maple St Residence
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-brand-600 px-2.5 py-1 text-[10px] font-semibold text-white">
            Reschedule
          </span>
          <span className="rounded-full bg-surface-3 px-2.5 py-1 text-[10px] font-medium text-ink-2">
            Pay invoice
          </span>
        </div>
      </div>
      <p className="mt-3 text-center font-mono text-[10px] text-ink-3">
        no phone tag required
      </p>
    </Panel>
  );
}

function MiniInvoice() {
  return (
    <div className="mt-7 flex items-center gap-3 rounded-2xl bg-surface-2 p-4 shadow-sm">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-700 dark:bg-accent-950 dark:text-accent-400">
        <CheckIcon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-ink">
          INV-2081 · $285 paid online
        </p>
        <p className="truncate text-[11px] text-ink-3">
          Deposits straight to your account
        </p>
      </div>
    </div>
  );
}

const VISUALS: Record<string, React.ReactNode> = {
  calendar: <MiniSchedule />,
  quote: <MiniQuote />,
  users: <MiniChecklist />,
  card: <MiniInvoice />,
  portal: <MiniPortal />,
  bell: (
    <div className="mt-7 flex flex-wrap gap-2">
      {["Booking confirmed", "Reminder sent", "Crew assigned", "Invoice paid"].map(
        (t) => (
          <span
            key={t}
            className="rounded-full border border-line bg-surface px-2.5 py-1 text-[10px] font-medium text-ink-2"
          >
            {t}
          </span>
        ),
      )}
    </div>
  ),
};

/** Only the two lead cards get a mini-UI — six of them would be noise. */
const LEAD_VISUALS = new Set(["quote", "calendar", "users"]);

export async function Features() {
  const [eyebrow, title, description, features] = await Promise.all([
    getContent<string>("home.features.eyebrow"),
    getContent<string>("home.features.title"),
    getContent<string>("home.features.description"),
    getContent<FeatureItem[]>("home.features.items"),
  ]);

  return (
    <section
      id="features"
      className="scroll-mt-24 bg-surface py-24 sm:py-28 lg:py-32"
    >
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={eyebrow}
            title={title}
            description={description}
          />
        </Reveal>

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-6 lg:gap-5">
          {features.map((f, i) => {
            const span = SPANS[i % SPANS.length];
            const showVisual = LEAD_VISUALS.has(f.icon) && i < 2;
            return (
              <Reveal key={f.title} delay={i * 70} className={`min-w-0 ${span}`}>
                <SpotlightCard className="rounded-2xl shadow-[0_24px_60px_-30px_rgba(15,23,42,0.3)]">
                  <div className="flex h-full flex-col p-7 sm:p-8">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-transform duration-300 group-hover/card:scale-105 dark:bg-brand-950 dark:text-brand-400">
                      {ICONS[f.icon] ?? <CalendarIcon />}
                    </span>
                    <h3 className="mt-5 text-lg leading-snug font-semibold text-balance text-ink">
                      {f.title}
                    </h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-ink-2">
                      {f.description}
                    </p>
                    {showVisual && VISUALS[f.icon]}
                  </div>
                </SpotlightCard>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}