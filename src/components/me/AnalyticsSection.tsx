"use client";

// 学習分析カード — Streak / 週月集計 / 7日バーチャート / 科目別配分 / バッジ
//
// データソースは src/lib/analytics.ts と badges.ts。
// MeView の LevelSection の下に挿入する想定。

import { useMemo, useState } from "react";
import { Flame, BarChart3, Calendar } from "lucide-react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/hooks/useStore";
import {
  computeDailyBlocks,
  computeMonthStats,
  computeStreak,
  computeWeekStats,
} from "@/lib/analytics";

const AREA_COLOR: Record<string, string> = {
  japanese: "bg-coral-500",
  math: "bg-sky-500",
  english: "bg-mint-500",
  science: "bg-sun-400",
  history: "bg-coral-300",
  civics: "bg-sky-300",
  info: "bg-mint-300",
  unknown: "bg-ink-300",
};

export function AnalyticsSection() {
  const { state, hydrated } = useStore();
  const [period, setPeriod] = useState<"week" | "month">("week");

  const data = useMemo(() => {
    if (!hydrated) return null;
    const blockLogs = state.blockLogs ?? [];

    const streak = computeStreak(blockLogs);
    const week = computeWeekStats(blockLogs);
    const month = computeMonthStats(blockLogs);
    const daily = computeDailyBlocks(blockLogs, 7);
    return { streak, week, month, daily };
  }, [hydrated, state]);

  if (!hydrated || !data) return null;

  const stats = period === "week" ? data.week : data.month;

  return (
    <section className="rounded-2xl border border-ink-100/80 bg-white p-5 shadow-soft space-y-5">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-sky-500" />
          <h2 className="text-[14px] font-bold text-ink-900">学習分析</h2>
        </div>
        <div className="flex rounded-full bg-cream-100 p-0.5 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setPeriod("week")}
            className={cn(
              "rounded-full px-3 py-1 transition",
              period === "week" ? "bg-white text-ink-900 shadow-sm" : "text-ink-500",
            )}
          >
            週
          </button>
          <button
            type="button"
            onClick={() => setPeriod("month")}
            className={cn(
              "rounded-full px-3 py-1 transition",
              period === "month" ? "bg-white text-ink-900 shadow-sm" : "text-ink-500",
            )}
          >
            月
          </button>
        </div>
      </header>

      {/* Streak + 期間サマリー */}
      <div className="grid grid-cols-2 gap-2">
        <StreakCard
          current={data.streak.current}
          longest={data.streak.longest}
          todayDone={data.streak.todayDone}
        />
        <div className="rounded-xl bg-cream-50 px-3 py-3">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-ink-500">
            <Calendar className="h-3 w-3" />
            {period === "week" ? "今週" : "今月"}
          </div>
          <div className="mt-1.5 text-[20px] font-bold text-ink-900 leading-none">
            {stats.blocks}
            <span className="ml-1 text-[10px] font-semibold text-ink-500">/ {stats.goalBlocks} ブロック</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-cream-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-mint-500 transition-all"
              style={{ width: `${stats.goalProgressPct}%` }}
            />
          </div>
          <div className="mt-1 text-[10px] text-ink-500">
            {Math.round(stats.minutes / 60)} 時間 · {stats.daysActive} 日間
          </div>
        </div>
      </div>

      {/* 7日バーチャート */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[11px] font-bold text-ink-700">過去7日</h3>
          <span className="text-[10px] text-ink-400">縦軸: ブロック数</span>
        </div>
        <WeeklyBars daily={data.daily} />
      </div>

    </section>
  );
}

function StreakCard({
  current,
  longest,
  todayDone,
}: {
  current: number;
  longest: number;
  todayDone: boolean;
}) {
  const active = current > 0;
  return (
    <div
      className={cn(
        "rounded-xl px-3 py-3",
        active ? "bg-coral-100" : "bg-cream-50",
      )}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-coral-500">
        <Flame className={cn("h-3 w-3", active ? "text-coral-500" : "text-ink-400")} />
        連続記録
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className={cn("text-[24px] font-bold leading-none", active ? "text-coral-500" : "text-ink-400")}>
          {current}
        </span>
        <span className="text-[11px] font-semibold text-ink-500">日</span>
      </div>
      <div className="mt-1 text-[10px] text-ink-500">
        {todayDone ? "今日も達成済" : current > 0 ? "今日の1ブロックで継続" : `最長 ${longest} 日`}
      </div>
    </div>
  );
}

function WeeklyBars({ daily }: { daily: ReturnType<typeof computeDailyBlocks> }) {
  const max = Math.max(1, ...daily.map((d) => d.count));
  return (
    <div className="flex items-end justify-between gap-1.5 h-24 rounded-xl bg-cream-50/60 px-3 py-2">
      {daily.map((d, idx) => {
        const h = Math.round((d.count / max) * 100);
        // computeDailyBlocks は古い→新しい順で、末尾が今日 (6時リセットの学習日)
        const isToday = idx === daily.length - 1;
        return (
          <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full flex-1 items-end">
              <div
                className={cn(
                  "w-full rounded-md transition-all",
                  d.count === 0 ? "bg-cream-200" : isToday ? "bg-coral-500" : "bg-sky-400",
                )}
                style={{ height: `${Math.max(4, h)}%` }}
                title={`${d.date}: ${d.count} ブロック`}
              />
            </div>
            <span
              className={cn(
                "text-[10px] font-bold",
                isToday ? "text-coral-500" : "text-ink-500",
              )}
            >
              {d.weekday}
            </span>
          </div>
        );
      })}
    </div>
  );
}
