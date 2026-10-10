"use client";

import { useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  STAIN_CSS,
  mountStainScrub,
  type StainRank,
  type StainStrings,
} from "./stain-scrub-showdown-game";

export function StainScrubShowdown({ onBest }: { onBest: (best: number) => void }) {
  const t = useTranslations("arcade");
  const mountRef = useRef<HTMLDivElement>(null);

  const strings = useMemo<StainStrings>(() => ({
      name: t("games.stain.name"),
      tagline: t("games.stain.tagline"),
      startTitle: t("stain.startTitle"),
      rule1: t("stain.rule1"),
      rule2: t("stain.rule2"),
      rule3: t("stain.rule3"),
      start: t("stain.start"),
      timeLeft: t("stain.timeLeft"),
      stainNames: t.raw("stain.stainNames") as string[],
      clearedQuips: t.raw("stain.clearedQuips") as string[],
      winTitle: t("stain.winTitle"),
      loseTitle: t("stain.loseTitle"),
      loseQuip: t("stain.loseQuip"),
      cleared: t("stain.cleared"),
      timeUsed: t("stain.timeUsed"),
      ranks: t.raw("stain.ranks") as StainRank[],
      playAgain: t("playAgain"),
      best: t("best"),
  }), [t]);

  useEffect(() => {
    if (!mountRef.current) return;
    return mountStainScrub(mountRef.current, strings, onBest);
  }, [strings, onBest]);

  return (
    <>
      <style>{STAIN_CSS}</style>
      <div ref={mountRef} />
    </>
  );
}
