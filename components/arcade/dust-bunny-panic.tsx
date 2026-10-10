"use client";

import { useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  DBP_CSS,
  mountDustBunnyPanic,
  type DbpRank,
  type DbpStrings,
} from "./dust-bunny-panic-game";

export function DustBunnyPanic({ onBest }: { onBest: (best: number) => void }) {
  const t = useTranslations("arcade");
  const mountRef = useRef<HTMLDivElement>(null);

  const strings = useMemo<DbpStrings>(() => ({
      name: t("games.dbp.name"),
      tagline: t("games.dbp.tagline"),
      startTitle: t("dbp.startTitle"),
      rule1: t("dbp.rule1"),
      rule2: t("dbp.rule2"),
      rule3: t("dbp.rule3"),
      rule4: t("dbp.rule4"),
      start: t("dbp.start"),
      score: t("dbp.score"),
      timeLeft: t("dbp.timeLeft"),
      combo: t("dbp.combo"),
      taunts: t.raw("dbp.taunts") as string[],
      catTaunts: t.raw("dbp.catTaunts") as string[],
      goldenTaunts: t.raw("dbp.goldenTaunts") as string[],
      toddlerEvent: t("dbp.toddlerEvent"),
      clientEvent: t("dbp.clientEvent"),
      jackpot: t("dbp.jackpot"),
      catSeen: t("dbp.catSeen"),
      endTitle: t("dbp.endTitle"),
      whacked: t("dbp.whacked"),
      golden: t("dbp.golden"),
      cats: t("dbp.cats"),
      bestCombo: t("dbp.bestCombo"),
      ranks: t.raw("dbp.ranks") as DbpRank[],
      foot: t("dbp.foot"),
      playAgain: t("playAgain"),
      best: t("best"),
  }), [t]);

  useEffect(() => {
    if (!mountRef.current) return;
    return mountDustBunnyPanic(mountRef.current, strings, onBest);
  }, [strings, onBest]);

  return (
    <>
      <style>{DBP_CSS}</style>
      <div ref={mountRef} />
    </>
  );
}
