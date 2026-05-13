"use client";

// レベル & 経験値 カード — Apple HIG ベース
// 「本番まで / 1年で / 今Qで」3 タブ切替

import { useMemo, useState } from "react";
import { Sparkles, TrendingUp, Trophy } from "lucide-react";
import { cn } from "@/lib/cn";

type Horizon = "exam" | "year" | "quarter";

const HORIZON_LABEL: Record<Horizon, string> = {
  exam: "本番まで",
  year: "1年",
  quarter: "今Q",
};

type Props = {
  level: number;
  currentLevelExp: number;
  nextLevelExp: number;
  recentExpGain?: number;
  // 各 horizon に対応するブロック数
  blocksRemainingByHorizon?: Partial<Record<Horizon, number>>;
  blocksDoneByHorizon?: Partial<Record<Horizon, number>>;
};

export function LevelCard({
  level,
  currentLevelExp,
  nextLevelExp,
  recentExpGain = 0,
  blocksRemainingByHorizon,
  blocksDoneByHorizon,
}: Props) {
  const [horizon, setHorizon] = useState<Horizon>("exam");
  const pct = Math.max(0, Math.min(100, Math.round((currentLevelExp / nextLevelExp) * 100)));
  const remaining = blocksRemainingByHorizon?.[horizon];
  const done = blocksDoneByHorizon?.[horizon] ?? 0;
  const totalGoalBlocks = (remaining ?? 0) + done;
  const goalPct = totalGoalBlocks > 0
    ? Math.max(0, Math.min(100, Math.round((done / totalGoalBlocks) * 100)))
    : 0;

  const showGoal = blocksRemainingByHorizon !== undefined;
  const availableHorizons = useMemo<Horizon[]>(() => {
    if (!blocksRemainingByHorizon) return [];
    return (Object.keys(HORIZON_LABEL) as Horizon[]).filter(
      (h) => blocksRemainingByHorizon[h] !== undefined,
    );
  }, [blocksRemainingByHorizon]);

  return (
    <section className="rounded-2xl border border-ink-100/80 bg-white p-4">
      {/* LV ヘッダ */}
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
            Level
          </span>
          <span className="text-[34px] font-bold leading-none tabular-nums text-ink-900">
            {level}
          </span>
        </div>
        {recentExpGain > 0 ? (
          <span className="flex items-center gap-0.5 rounded-full bg-mint-50 px-2 py-0.5 text-[10px] font-bold text-mint-600 tabular-nums">
            <Sparkles className="h-3 w-3" />
            +{recentExpGain}
          </span>
        ) : null}
      </div>

      {/* レベル進捗バー */}
      <div className="mt-3">
        <div className="h-1.5 overflow-hidden rounded-full bg-cream-200/70">
          <div
            className="h-full rounded-full bg-sky-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1 flex items-baseline justify-between text-[10px]">
          <span className="text-ink-500 tabular-nums">
            {currentLevelExp.toLocaleString()} / {nextLevelExp.toLocaleString()} pt
          </span>
          <span className="font-medium text-ink-400">
            次まで {Math.max(0, nextLevelExp - currentLevelExp).toLocaleString()} pt
          </span>
        </div>
      </div>

      {/* 目標進捗 + horizon タブ */}
      {showGoal ? (
        <div className="mt-4 rounded-xl bg-cream-50/80 p-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
              <Trophy className="h-3 w-3" />
              ゴール
            </span>
            {availableHorizons.length > 1 ? (
              <ul className="flex gap-0.5 rounded-lg bg-white p-0.5">
                {availableHorizons.map((h) => (
                  <li key={h}>
                    <button
                      type="button"
                      onClick={() => setHorizon(h)}
                      className={cn(
                        "h-6 rounded-md px-2 text-[10px] font-bold transition",
                        horizon === h ? "bg-ink-900 text-white" : "text-ink-500",
                      )}
                    >
                      {HORIZON_LABEL[h]}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold tabular-nums text-ink-900">
              {remaining?.toLocaleString() ?? "—"}
            </span>
            <span className="text-[10px] font-medium text-ink-500">
              ブロック残 / {done.toLocaleString()} 完了
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-ink-900 transition-all"
              style={{ width: `${goalPct}%` }}
            />
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-[10px] font-medium text-ink-400">
              {HORIZON_LABEL[horizon]}の達成率
            </span>
            <span className="text-[10px] font-medium text-ink-500 tabular-nums">
              {goalPct}%
            </span>
          </div>
        </div>
      ) : null}

      <p className="mt-2 text-[10px] leading-[1.5] text-ink-400">
        <TrendingUp className="mr-0.5 inline-block h-3 w-3 align-text-bottom" />
        集中・タスク完了・テスト登録で EXP が貯まります。
      </p>
    </section>
  );
}
