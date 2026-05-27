"use client";

// レベル & 経験値 カード — ⑥ MePageScreen スタイル
// 上: 黒のヒーロー (Level + optional 偏差値)
// 中: XP プログレスバー + 次のLvまで
// 下: ゴール（horizon タブ + 残ブロック）

import { useMemo, useState } from "react";
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
  /** 総合偏差値（任意）— 渡されたら右側に表示 */
  deviation?: number;
  /** 偏差値の前回比（任意） */
  deviationDelta?: number;
  blocksRemainingByHorizon?: Partial<Record<Horizon, number>>;
  blocksDoneByHorizon?: Partial<Record<Horizon, number>>;
};

export function LevelCard({
  level,
  currentLevelExp,
  nextLevelExp,
  recentExpGain = 0,
  deviation,
  deviationDelta,
  blocksRemainingByHorizon,
  blocksDoneByHorizon,
}: Props) {
  const [horizon, setHorizon] = useState<Horizon>("exam");
  const pct = Math.max(
    0,
    Math.min(100, Math.round((currentLevelExp / nextLevelExp) * 100)),
  );
  const remaining = blocksRemainingByHorizon?.[horizon];
  const done = blocksDoneByHorizon?.[horizon] ?? 0;
  const totalGoalBlocks = (remaining ?? 0) + done;
  const goalPct =
    totalGoalBlocks > 0
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
    <section className="overflow-hidden rounded-[20px] bg-ink-900 text-white shadow-[0_8px_28px_-12px_rgba(20,19,15,0.25)]">
      {/* Dark hero — Level + (optional) 偏差値 */}
      <div className="p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold tracking-[0.02em] text-white/60">
              Level
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span
                className="text-[48px] font-extrabold leading-none tabular-nums tracking-[-0.03em]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {level}
              </span>
              <span className="text-[12px] font-medium text-white/65">
                / 100
              </span>
            </div>
          </div>
          {typeof deviation === "number" ? (
            <div className="text-right">
              <div className="text-[11px] font-semibold text-white/60">
                偏差値
              </div>
              <div className="mt-1 flex items-baseline justify-end gap-1.5">
                <span
                  className="text-[32px] font-extrabold tabular-nums tracking-[-0.02em]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {deviation.toFixed(1)}
                </span>
                {typeof deviationDelta === "number" && deviationDelta !== 0 ? (
                  <span
                    className={cn(
                      "text-[12px] font-bold tabular-nums",
                      deviationDelta > 0 ? "text-mint-500" : "text-coral-300",
                    )}
                  >
                    {deviationDelta > 0 ? "+" : ""}
                    {deviationDelta.toFixed(1)}
                  </span>
                ) : null}
              </div>
            </div>
          ) : recentExpGain > 0 ? (
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold tabular-nums text-white">
              +{recentExpGain} EXP
            </span>
          ) : null}
        </div>

        {/* XP progress */}
        <div className="mt-4">
          <div className="h-[5px] overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-sky-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-white/55">
            <span className="tabular-nums">
              {currentLevelExp.toLocaleString()} EXP
            </span>
            <span className="tabular-nums">
              Lv{level + 1} まで{" "}
              {Math.max(0, nextLevelExp - currentLevelExp).toLocaleString()} EXP
            </span>
          </div>
        </div>
      </div>

      {/* Goal section (light) */}
      {showGoal ? (
        <div className="border-t border-white/8 bg-white/5 px-5 py-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.04em] text-white/55">
              ゴール · {HORIZON_LABEL[horizon]}
            </span>
            {availableHorizons.length > 1 ? (
              <ul className="flex gap-0.5 rounded-lg bg-white/10 p-0.5">
                {availableHorizons.map((h) => (
                  <li key={h}>
                    <button
                      type="button"
                      onClick={() => setHorizon(h)}
                      className={cn(
                        "h-6 rounded-md px-2 text-[10px] font-bold transition",
                        horizon === h
                          ? "bg-white text-ink-900"
                          : "text-white/55",
                      )}
                    >
                      {HORIZON_LABEL[h]}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="mt-1.5 flex items-baseline justify-between gap-2">
            <span
              className="text-[24px] font-extrabold tabular-nums tracking-[-0.02em]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {remaining?.toLocaleString() ?? "—"}
            </span>
            <span className="text-[10px] font-medium text-white/55">
              ブロック残
              {typeof remaining === "number" ? (
                <span className="ml-1 text-white/40">≈{Math.round(remaining * 25 / 60)}h</span>
              ) : null}
            </span>
          </div>
          <div className="text-[10px] text-white/40">
            完了済み {done.toLocaleString()} ブロック
          </div>
          <div className="mt-2 h-[5px] overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-mint-500 transition-all"
              style={{ width: `${goalPct}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-end text-[10px] tabular-nums text-white/55">
            {goalPct}%
          </div>
        </div>
      ) : null}
    </section>
  );
}
