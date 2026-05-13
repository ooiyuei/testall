"use client";

// 直近 5週 (35日) の学習ヒートマップ
// blockLogs を 6時リセットで日別集計し、強度別に色を変える。

import { useMemo } from "react";
import { Flame } from "lucide-react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/hooks/useStore";
import { currentDayISO } from "@/lib/store";

const CELL_COUNT = 35; // 5週 × 7日
const WEEKDAY_LABELS = ["月", "", "水", "", "金", "", "日"];

function intensityClass(count: number): string {
  if (count === 0) return "bg-cream-100/70";
  if (count === 1) return "bg-mint-200";
  if (count === 2) return "bg-mint-400";
  if (count <= 4) return "bg-mint-500";
  return "bg-mint-600";
}

export function StreakHeatmap() {
  const { state, hydrated } = useStore();

  const data = useMemo(() => {
    if (!hydrated) return { cells: [] as { iso: string; count: number; isToday: boolean }[], current: 0, longest: 0 };

    // 日別カウント
    const countByDay = new Map<string, number>();
    for (const b of state.blockLogs ?? []) {
      const iso = currentDayISO(new Date(b.completedAt));
      countByDay.set(iso, (countByDay.get(iso) ?? 0) + 1);
    }

    const todayISO = currentDayISO();
    const [ty, tm, td] = todayISO.split("-").map(Number);
    const today = new Date(ty, tm - 1, td);

    // 直近 35日 (今日が右下になるように)
    const cells: { iso: string; count: number; isToday: boolean }[] = [];
    for (let i = CELL_COUNT - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      cells.push({
        iso,
        count: countByDay.get(iso) ?? 0,
        isToday: iso === todayISO,
      });
    }

    // 現在の連続日数
    let current = 0;
    const cursor = new Date(today);
    // 今日空 ＆ 昨日埋まってる場合は猶予
    if (!countByDay.has(todayISO)) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (countByDay.has(cursor.toISOString().slice(0, 10))) {
      current += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    // 最長連続
    const sortedDays = [...countByDay.keys()].sort();
    let longest = 0;
    let run = 0;
    let prev: Date | null = null;
    for (const iso of sortedDays) {
      const [y, m, d] = iso.split("-").map(Number);
      const cur = new Date(y, m - 1, d);
      if (prev) {
        const diff = (cur.getTime() - prev.getTime()) / 86_400_000;
        if (diff === 1) run += 1;
        else run = 1;
      } else {
        run = 1;
      }
      longest = Math.max(longest, run);
      prev = cur;
    }

    return { cells, current, longest };
  }, [hydrated, state.blockLogs]);

  if (!hydrated || (state.blockLogs ?? []).length === 0) return null;

  return (
    <section className="rounded-2xl border border-ink-100/80 bg-white p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-400">
          学習ヒートマップ
        </h2>
        <span className="text-[10px] font-medium text-ink-400">直近 5週</span>
      </div>

      {/* ストリーク数値 */}
      <div className="mt-3 flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-xl bg-coral-300/10 px-3 py-2">
          <Flame className="h-4 w-4 text-coral-500" strokeWidth={2.4} />
          <div>
            <div className="text-[10px] font-medium text-coral-500/80">連続</div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg font-bold tabular-nums text-coral-500">
                {data.current}
              </span>
              <span className="text-[10px] font-bold text-coral-500/70">日</span>
            </div>
          </div>
        </div>
        <div className="flex flex-1 items-center gap-2 rounded-xl bg-mint-100/40 px-3 py-2">
          <div>
            <div className="text-[10px] font-medium text-mint-600">最長記録</div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg font-bold tabular-nums text-mint-600">
                {data.longest}
              </span>
              <span className="text-[10px] font-bold text-mint-600/70">日</span>
            </div>
          </div>
        </div>
      </div>

      {/* ヒートマップ 5x7 */}
      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {data.cells.map((c) => (
          <div
            key={c.iso}
            className={cn(
              "aspect-square rounded-md transition",
              intensityClass(c.count),
              c.isToday && "ring-2 ring-ink-900/70 ring-offset-1",
            )}
            aria-label={`${c.iso} : ${c.count}ブロック`}
            title={`${c.iso} : ${c.count}ブロック`}
          />
        ))}
      </div>

      {/* 凡例 */}
      <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-ink-400">
        <span>少</span>
        <span className="h-3 w-3 rounded-sm bg-cream-100/70" />
        <span className="h-3 w-3 rounded-sm bg-mint-200" />
        <span className="h-3 w-3 rounded-sm bg-mint-400" />
        <span className="h-3 w-3 rounded-sm bg-mint-500" />
        <span className="h-3 w-3 rounded-sm bg-mint-600" />
        <span>多</span>
      </div>
    </section>
  );
}
