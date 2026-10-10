"use client";

import { useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  SOCK_CSS,
  mountSockMatch,
  type SockRank,
  type SockStrings,
} from "./sock-match-madness-game";

export function SockMatchMadness({ onBest }: { onBest: (best: number) => void }) {
  const t = useTranslations("arcade");
  const mountRef = useRef<HTMLDivElement>(null);

  const strings = useMemo<SockStrings>(() => ({
      name: t("games.sock.name"),
      tagline: t("games.sock.tagline"),
      startTitle: t("sock.startTitle"),
      rule1: t("sock.rule1"),
      rule2: t("sock.rule2"),
      rule3: t("sock.rule3"),
      start: t("sock.start"),
      moves: t("sock.moves"),
      pairs: t("sock.pairs"),
      time: t("sock.time"),
      secs: t("sock.secs"),
      pairNames: t.raw("sock.pairNames") as string[],
      endTitle: t("sock.endTitle"),
      ranks: t.raw("sock.ranks") as SockRank[],
      playAgain: t("playAgain"),
  }), [t]);

  useEffect(() => {
    if (!mountRef.current) return;
    return mountSockMatch(mountRef.current, strings, onBest);
  }, [strings, onBest]);

  return (
    <>
      <style>{SOCK_CSS}</style>
      <div ref={mountRef} />
    </>
  );
}
