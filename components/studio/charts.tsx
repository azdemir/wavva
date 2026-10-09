import type { WeekBucket, PlanSlice, FunnelStep } from "@/lib/studio/analytics";
import { crmStageLabel } from "@/lib/studio/crm";
import { PLANS, formatPrice } from "@/lib/plans";
import { formatCents } from "@/lib/format";

/** Weekly grouped bars: companies (blue) vs leads (amber). Pure SVG. */
export function WeeklyBars({ weeks }: { weeks: WeekBucket[] }) {
  const max = Math.max(1, ...weeks.map((w) => Math.max(w.companies, w.leads)));
  const W = 560;
  const H = 180;
  const PAD = 28;
  const n = weeks.length;
  const slot = (W - PAD * 2) / n;
  const barW = Math.min(14, slot / 3);
  const y = (v: number) => H - PAD - (v / max) * (H - PAD * 2);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Weekly signups chart">
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={PAD}
            x2={W - PAD}
            y1={y(max * f)}
            y2={y(max * f)}
            className="stroke-slate-200 dark:stroke-slate-700"
            strokeDasharray="3 3"
          />
        ))}
        {weeks.map((w, i) => {
          const cx = PAD + slot * i + slot / 2;
          return (
            <g key={w.start}>
              <rect
                x={cx - barW - 2}
                y={y(w.companies)}
                width={barW}
                height={Math.max(2, H - PAD - y(w.companies))}
                rx={3}
                className="fill-brand-500"
              />
              <rect
                x={cx + 2}
                y={y(w.leads)}
                width={barW}
                height={Math.max(2, H - PAD - y(w.leads))}
                rx={3}
                className="fill-amber-400"
              />
              {i % 2 === 0 && (
                <text
                  x={cx}
                  y={H - 8}
                  textAnchor="middle"
                  className="fill-slate-400 text-[10px]"
                >
                  {w.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-brand-500" /> Companies
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> Leads
        </span>
      </div>
    </div>
  );
}

const DONUT_COLORS: Record<string, string> = {
  starter: "#38bdf8",
  growth: "#6366f1",
  pro: "#a855f7",
};

/** Plan mix donut with legend. */
export function PlanDonut({ mix }: { mix: PlanSlice[] }) {
  const total = Math.max(1, mix.reduce((s, m) => s + m.count, 0));
  const R = 60;
  const C = 2 * Math.PI * R;
  const segs = mix.reduce<{ plan: (typeof mix)[number]["plan"]; count: number; mrrCents: number; dash: number; offset: number }[]>(
    (acc, m) => {
      const frac = m.count / total;
      const used = acc.reduce((s, x) => s + x.dash / C, 0);
      acc.push({ ...m, dash: frac * C, offset: -used * C });
      return acc;
    },
    [],
  );

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 160 160" className="h-36 w-36 shrink-0" role="img" aria-label="Plan mix chart">
        <circle cx={80} cy={80} r={R} fill="none" strokeWidth={26} className="stroke-slate-100 dark:stroke-slate-800" />
        {segs.map(
          (s) =>
            s.count > 0 && (
              <circle
                key={s.plan}
                cx={80}
                cy={80}
                r={R}
                fill="none"
                stroke={DONUT_COLORS[s.plan]}
                strokeWidth={26}
                strokeDasharray={`${s.dash} ${C - s.dash}`}
                strokeDashoffset={s.offset}
                transform="rotate(-90 80 80)"
              />
            ),
        )}
        <text x={80} y={76} textAnchor="middle" className="fill-slate-900 text-xl font-bold dark:fill-slate-100">
          {total === 1 && mix.every((m) => m.count === 0) ? 0 : mix.reduce((s, m) => s + m.count, 0)}
        </text>
        <text x={80} y={94} textAnchor="middle" className="fill-slate-500 text-[11px] dark:fill-slate-400">
          companies
        </text>
      </svg>
      <ul className="space-y-2 text-sm">
        {mix.map((m) => (
          <li key={m.plan} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm" style={{ background: DONUT_COLORS[m.plan] }} />
            <span className="font-medium text-slate-700 dark:text-slate-200">{PLANS[m.plan].name}</span>
            <span className="text-slate-500 dark:text-slate-400">
              {m.count} · {formatPrice(PLANS[m.plan].priceCents)}/mo
            </span>
            <span className="ml-auto pl-3 font-semibold text-slate-900 dark:text-slate-100">
              {formatCents(m.mrrCents)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Lead funnel: horizontal bars with stage-to-stage conversion. */
export function Funnel({ steps }: { steps: FunnelStep[] }) {
  const max = Math.max(1, ...steps.map((s) => s.count));
  return (
    <ol className="space-y-3">
      {steps.map((s) => (
        <li key={s.stage}>
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {crmStageLabel(s.stage)}
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-slate-100">{s.count}</span>
              {s.conversionFromPrev !== null && (
                <span className="ml-2 text-xs">
                  {(s.conversionFromPrev * 100).toFixed(0)}% convert
                </span>
              )}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={
                s.stage === "customer"
                  ? "h-full rounded-full bg-emerald-500"
                  : s.stage === "lost"
                    ? "h-full rounded-full bg-slate-300 dark:bg-slate-600"
                    : "h-full rounded-full bg-brand-500"
              }
              style={{ width: `${Math.max(3, (s.count / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
