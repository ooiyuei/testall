"use client";

// レベル&経験値の山グラフ
// 麓 → 山頂 を SVG パスで描画し、進捗位置に登山者アイコン
// ゴール（最終目標= 入試日）に旗

import { cn } from "@/lib/cn";

type Props = {
  level: number;
  currentLevelExp: number;
  nextLevelExp: number;
  goalLabel?: string;
  // 0..1: 全体ゴールに対するユーザーの進捗（例: 入試日までの達成率）
  overallProgress?: number;
  blocksRemaining?: number;
};

export function LevelMountain({
  level,
  currentLevelExp,
  nextLevelExp,
  goalLabel = "目標",
  overallProgress = 0,
  blocksRemaining,
}: Props) {
  const W = 320;
  const H = 140;
  // 麓 (40, 120) → 山頂 (280, 30)
  const baseX = 40;
  const baseY = 120;
  const topX = 280;
  const topY = 30;

  const t = Math.max(0.02, Math.min(0.96, overallProgress));
  const climberX = baseX + (topX - baseX) * t;
  const climberY = baseY + (topY - baseY) * t;
  const goal = t >= 1;

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100/80 bg-gradient-to-b from-sky-50/60 to-cream-50 p-4">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-[10px] font-semibold text-ink-400">
            LV
          </div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-3xl font-bold leading-none tabular-nums text-ink-900">
              {level}
            </span>
            <span className="text-[11px] font-medium text-ink-500">
              次まで {Math.max(0, nextLevelExp - currentLevelExp).toLocaleString()} pt
            </span>
          </div>
        </div>
        {blocksRemaining !== undefined ? (
          <div className="text-right">
            <div className="text-[10px] font-medium text-ink-400">{goalLabel}まで</div>
            <div className="mt-0.5 flex items-baseline justify-end gap-1">
              <span className="text-base font-bold tabular-nums text-ink-900">
                {blocksRemaining.toLocaleString()}
              </span>
              <span className="text-[10px] font-medium text-ink-500">ブロック</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* レベル進捗バー */}
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream-200/70">
        <div
          className="h-full rounded-full bg-sky-500 transition-all"
          style={{ width: `${(currentLevelExp / nextLevelExp) * 100}%` }}
        />
      </div>

      {/* 山 SVG */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 w-full"
        role="img"
        aria-label="目標までの進捗"
      >
        {/* 雲 */}
        <ellipse cx="60" cy="36" rx="22" ry="6" fill="rgba(255,255,255,0.7)" />
        <ellipse cx="250" cy="18" rx="18" ry="5" fill="rgba(255,255,255,0.7)" />

        {/* 後ろの山 */}
        <path
          d={`M 10 ${H - 5} L 150 30 L 320 ${H - 5} Z`}
          fill="rgb(214 234 255 / 0.7)"
        />
        {/* 前面の山 (登るやつ) */}
        <path
          d={`M ${baseX - 25} ${baseY + 4} L ${topX} ${topY} L ${topX + 30} ${baseY + 4} Z`}
          fill="rgb(56 132 209 / 0.18)"
          stroke="rgb(56 132 209 / 0.6)"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        {/* 雪 */}
        <path
          d={`M ${topX - 20} ${topY + 16} L ${topX} ${topY} L ${topX + 16} ${topY + 14} Q ${topX} ${topY + 24} ${topX - 20} ${topY + 16} Z`}
          fill="rgba(255,255,255,0.9)"
        />

        {/* 登るルート (薄線) */}
        <line
          x1={baseX}
          y1={baseY}
          x2={topX}
          y2={topY}
          stroke="rgb(56 132 209 / 0.35)"
          strokeWidth="1.4"
          strokeDasharray="3 3"
        />

        {/* 登山者 (シンプル人型) */}
        <g transform={`translate(${climberX}, ${climberY - 14})`}>
          <circle cx="0" cy="0" r="4" fill="rgb(20 19 15)" />
          <path
            d="M 0 4 L 0 12 M -4 8 L 4 8 M -3 18 L 0 12 L 3 18"
            stroke="rgb(20 19 15)"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        {/* 旗 (山頂) */}
        <g transform={`translate(${topX}, ${topY - 4})`}>
          <line x1="0" y1="0" x2="0" y2="-22" stroke="rgb(20 19 15)" strokeWidth="1.5" />
          <path
            d="M 0 -22 L 14 -18 L 0 -14 Z"
            fill={goal ? "rgb(245 180 0)" : "rgb(214 218 198)"}
            stroke="rgb(20 19 15)"
            strokeWidth="1"
          />
        </g>

        {/* 麓ラベル */}
        <text
          x={baseX}
          y={baseY + 18}
          textAnchor="middle"
          className="fill-ink-400"
          style={{ fontSize: 10 }}
        >
          START
        </text>
        <text
          x={topX}
          y={topY - 30}
          textAnchor="middle"
          className="fill-ink-700 font-bold"
          style={{ fontSize: 11 }}
        >
          {goalLabel}
        </text>
      </svg>

      {goal ? (
        <p className="mt-1 text-center text-[11px] font-bold text-sun-500">
          🎉 目標に到達しました
        </p>
      ) : null}
    </div>
  );
}
