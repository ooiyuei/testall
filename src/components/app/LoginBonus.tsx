"use client";

// 日次ログインボーナス — 6時リセットで1日1回だけ表示
// 連続日数に応じてメッセージが変わる

import { useEffect, useState } from "react";
import { Flame, Gift, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/hooks/useStore";
import { currentDayISO } from "@/lib/store";
import { localYMD, parseLocalYMD } from "@/lib/date-safe";

const SHOWN_KEY_PREFIX = "testall:login-bonus-shown:";

function getStreak(blockLogs: { completedAt: string }[]): number {
  if (blockLogs.length === 0) return 0;
  const days = new Set(
    blockLogs.map((b) => currentDayISO(new Date(b.completedAt))),
  );
  const todayISO = currentDayISO();
  const cursor = parseLocalYMD(todayISO);
  if (!days.has(todayISO)) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (days.has(localYMD(cursor))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export function LoginBonus() {
  const { state, hydrated } = useStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (typeof window === "undefined") return;
    const today = currentDayISO();
    const key = SHOWN_KEY_PREFIX + today;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
      // 軽い遅延で目立たせる
      const t = setTimeout(() => setVisible(true), 400);
      return () => clearTimeout(t);
    } catch {
      /* noop */
    }
  }, [hydrated]);

  if (!hydrated || !visible) return null;

  const streak = getStreak(state.blockLogs ?? []);
  const totalLogins = (state.dailyMoodLogs ?? []).length;
  // 特別なマイルストーン (お祝い演出)
  const bigMilestone = [7, 14, 30, 50, 100, 200, 365].includes(streak);
  const isMilestone = streak > 0 && streak % 7 === 0;

  let title = "今日もよく来てくれました";
  let body = "+10 EXP";
  if (bigMilestone) {
    title =
      streak === 365
        ? `🏆 1年連続達成！神`
        : streak === 100
          ? `100日連続！絶好調`
          : streak === 50
            ? `50日連続！すごい`
            : streak === 30
              ? `30日連続！もう習慣`
              : streak === 14
                ? `2週間連続！継続中`
                : `1週間連続！その調子`;
    body = `+${Math.min(50, streak * 5)} EXP のボーナス`;
  } else if (streak >= 30) {
    title = `${streak}日連続！すごい`;
    body = `+${Math.min(50, streak * 5)} EXP のボーナス`;
  } else if (streak >= 7) {
    title = `${streak}日連続！`;
    body = `+${Math.min(50, streak * 5)} EXP のボーナス`;
  } else if (streak >= 2) {
    title = `${streak}日連続！その調子`;
    body = `+${streak * 5} EXP のボーナス`;
  } else if (totalLogins <= 1) {
    title = "Testall へようこそ";
    body = "毎日来るたびに EXP が貯まります";
  }

  return (
    <div
      className={cn(
        "fixed inset-x-0 top-2 z-50 mx-auto flex w-full max-w-[460px] items-start gap-3 rounded-2xl border bg-white p-4 shadow-[0_10px_30px_-12px_rgba(50,46,41,0.25)] animate-slideDown overflow-hidden",
        bigMilestone
          ? "border-amber-300 bg-gradient-to-br from-amber-50 to-sun-100"
          : isMilestone
            ? "border-amber-200 bg-amber-50/70"
            : "border-sky-200 bg-sky-50/40",
      )}
      role="status"
      aria-live="polite"
    >
      {/* マイルストーン時の装飾スパークル */}
      {bigMilestone ? (
        <>
          <span
            className="pointer-events-none absolute -right-2 -top-2 h-12 w-12 rounded-full bg-amber-300/30 blur-xl"
            aria-hidden
          />
          <span
            className="pointer-events-none absolute right-6 top-3 h-1.5 w-1.5 rounded-full bg-amber-400 pulse-soft"
            aria-hidden
          />
          <span
            className="pointer-events-none absolute right-14 top-6 h-1 w-1 rounded-full bg-sun-300 pulse-soft"
            style={{ animationDelay: "0.5s" }}
            aria-hidden
          />
          <span
            className="pointer-events-none absolute right-10 bottom-4 h-1 w-1 rounded-full bg-amber-500 pulse-soft"
            style={{ animationDelay: "1s" }}
            aria-hidden
          />
        </>
      ) : null}

      <div
        className={cn(
          "relative flex h-10 w-10 flex-none items-center justify-center rounded-xl",
          bigMilestone
            ? "bg-amber-200 text-amber-700"
            : isMilestone
              ? "bg-amber-100 text-amber-600"
              : "bg-sky-100 text-sky-600",
        )}
      >
        {bigMilestone ? (
          <Gift className="h-5 w-5" strokeWidth={2.2} />
        ) : streak >= 2 ? (
          <Flame className="h-4 w-4" strokeWidth={2.4} />
        ) : (
          <Sparkles className="h-4 w-4" strokeWidth={2.2} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-bold text-ink-900">{title}</div>
        <div className="mt-0.5 text-[11px] font-medium text-ink-500">
          {body}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-ink-400"
        aria-label="閉じる"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
