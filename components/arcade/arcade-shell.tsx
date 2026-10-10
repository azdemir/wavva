"use client";

import { useCallback, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { DustBunnyPanic } from "./dust-bunny-panic";
import { SockMatchMadness } from "./sock-match-madness";
import { StainScrubShowdown } from "./stain-scrub-showdown";
import { DBP_BEST_KEY } from "./dust-bunny-panic-game";
import { SOCK_BEST_KEY } from "./sock-match-madness-game";
import { STAIN_BEST_KEY } from "./stain-scrub-showdown-game";
import { readBest } from "./fx";

type GameId = "dbp" | "sock" | "stain";

function BunnyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-8 w-8">
      <ellipse cx="8.5" cy="6.5" rx="2" ry="3.6" />
      <ellipse cx="15.5" cy="6.5" rx="2" ry="3.6" />
      <circle cx="12" cy="15" r="6" />
      <circle cx="10" cy="14" r="0.6" fill="currentColor" />
      <circle cx="14" cy="14" r="0.6" fill="currentColor" />
    </svg>
  );
}

function SockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
      <path d="M9 2.5h5.5V13l3.5 2.4V19a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-2.6l2-2.1V2.5z" />
      <path d="M7 6h7.5" />
    </svg>
  );
}

function StainIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
      <path d="M12 3c3.2 4.2 6.2 7.4 6.2 10.6a6.2 6.2 0 1 1-12.4 0C5.8 10.4 8.8 7.2 12 3z" />
      <path d="M9.5 13.5a2.6 2.6 0 0 0 2 2.6" />
    </svg>
  );
}

const GAMES: { id: GameId; bestKey: string; accent: string; icon: ReactNode }[] = [
  { id: "dbp", bestKey: DBP_BEST_KEY, accent: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300", icon: <BunnyIcon /> },
  { id: "sock", bestKey: SOCK_BEST_KEY, accent: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300", icon: <SockIcon /> },
  { id: "stain", bestKey: STAIN_BEST_KEY, accent: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300", icon: <StainIcon /> },
];

export function ArcadeShell() {
  const t = useTranslations("arcade");
  const [active, setActive] = useState<GameId | null>(null);
  const [bests, setBests] = useState<Record<GameId, number | null>>(() => ({
    dbp: readBest(DBP_BEST_KEY),
    sock: readBest(SOCK_BEST_KEY),
    stain: readBest(STAIN_BEST_KEY),
  }));

  const handleBestDbp = useCallback(
    (value: number) => setBests((prev) => ({ ...prev, dbp: value })),
    [],
  );
  const handleBestSock = useCallback(
    (value: number) => setBests((prev) => ({ ...prev, sock: value })),
    [],
  );
  const handleBestStain = useCallback(
    (value: number) => setBests((prev) => ({ ...prev, stain: value })),
    [],
  );

  if (active) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setActive(null)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <span aria-hidden="true">←</span> {t("backToArcade")}
        </button>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          {active === "dbp" && <DustBunnyPanic onBest={handleBestDbp} />}
          {active === "sock" && <SockMatchMadness onBest={handleBestSock} />}
          {active === "stain" && <StainScrubShowdown onBest={handleBestStain} />}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {GAMES.map((g) => {
        const best = bests[g.id];
        return (
          <div
            key={g.id}
            className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${g.accent}`}>
              {g.icon}
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {t(`games.${g.id}.name`)}
            </h3>
            <p className="mt-1 flex-1 text-sm text-slate-500 dark:text-slate-400">
              {t(`games.${g.id}.tagline`)}
            </p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {best === null ? t("best") + ": —" : `${t(`games.${g.id}.bestLabel`)}: ${best}`}
            </p>
            <button
              type="button"
              onClick={() => setActive(g.id)}
              className="mt-3 w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
            >
              {t("play")}
            </button>
          </div>
        );
      })}
    </div>
  );
}
