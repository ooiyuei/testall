"use client";

// レベルアップ検知。store を汚さず localStorage で前回レベルを追跡する。
// EXP/レベルは state から純関数で導出されるため、blockLogs 等が増えてレベルが
// 上がった瞬間を検知して祝祭(LevelUpOverlay)を発火する。
import { useEffect, useState } from "react";
import { useStore } from "./useStore";
import { computeTotalExp, levelFromExp } from "@/lib/exp";

const KEY = "testall:lastLevel";

export function useLevelUp(): { levelUpTo: number | null; dismiss: () => void } {
  const { state, hydrated } = useStore();
  const [levelUpTo, setLevelUpTo] = useState<number | null>(null);

  const totalExp = hydrated
    ? computeTotalExp({
        tasks: state.tasks ?? [],
        tests: state.tests ?? [],
        blockLogs: state.blockLogs ?? [],
        loginDays: (state.dailyMoodLogs ?? []).length,
      })
    : 0;

  useEffect(() => {
    if (!hydrated) return;
    const level = levelFromExp(totalExp).level;
    let prev: number | null = null;
    try {
      const raw = localStorage.getItem(KEY);
      prev = raw !== null ? Number(raw) : null;
    } catch {
      /* localStorage 不可環境では何もしない */
    }
    // 初回(基準値なし)は記録のみ。既存ユーザーをいきなり祝わない。
    if (prev === null || Number.isNaN(prev)) {
      try {
        localStorage.setItem(KEY, String(level));
      } catch {}
      return;
    }
    if (level > prev) setLevelUpTo(level);
    if (level !== prev) {
      try {
        localStorage.setItem(KEY, String(level));
      } catch {}
    }
  }, [hydrated, totalExp]);

  return { levelUpTo, dismiss: () => setLevelUpTo(null) };
}
