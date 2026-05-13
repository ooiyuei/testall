"use client";

// 累計 EXP 推移ライングラフ (SVG 自前)
// DeviationTrend.tsx のロジックを踏襲

import { useMemo } from "react";

export type ExpTrendPoint = {
  date: string;   // YYYY-MM-DD
  cumExp: number; // 累計 EXP
};

type Props = {
  points: ExpTrendPoint[];
  height?: number;
};

export function ExpTrend({ points, height = 160 }: Props) {
  const sorted = useMemo(
    () => [...points].sort((a, b) => a.date.localeCompare(b.date)),
    [points],
  );

  if (sorted.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl bg-cream-50/70 text-[11px] text-ink-400 px-4 text-center">
        テスト・タスクの記録が貯まると EXP の推移が見られます
      </div>
    );
  }

  const W = 320;
  const H = height;
  const padL = 36;
  const padR = 8;
  const padT = 8;
  const padB = 20;

  const dates = sorted.map((p) => p.date);
  const maxExp = Math.max(...sorted.map((p) => p.cumExp), 1);
  // Y 軸の上限を切りの良い数に丸める
  const yMax = niceCeil(maxExp);
  const yMin = 0;

  const xScale = (d: string): number => {
    if (dates.length === 1) return (W - padR + padL) / 2;
    const idx = dates.indexOf(d);
    return padL + ((W - padL - padR) * idx) / Math.max(1, dates.length - 1);
  };

  const yScale = (v: number): number => {
    const t = (v - yMin) / (yMax - yMin);
    return padT + (H - padT - padB) * (1 - t);
  };

  // Y 軸グリッド: 4 本程度
  const yTicks = buildYTicks(yMax, 4);

  // パス
  const pathD = sorted
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.date)} ${yScale(p.cumExp)}`)
    .join(" ");

  // 塗りつぶし領域
  const fillD =
    `${pathD} L ${xScale(dates[dates.length - 1])} ${yScale(0)} L ${xScale(dates[0])} ${yScale(0)} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="累計EXP推移">
      <defs>
        <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0071e3" stopOpacity={0.18} />
          <stop offset="100%" stopColor="#0071e3" stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* グリッド水平線 */}
      {yTicks.map((v) => (
        <g key={v}>
          <line
            x1={padL}
            x2={W - padR}
            y1={yScale(v)}
            y2={yScale(v)}
            stroke="rgb(216 212 200 / 0.5)"
            strokeWidth={0.8}
          />
          <text
            x={padL - 4}
            y={yScale(v) + 3}
            textAnchor="end"
            className="fill-ink-400"
            style={{ fontSize: 9 }}
          >
            {formatExp(v)}
          </text>
        </g>
      ))}

      {/* X 軸日付ラベル */}
      {dates.map((d, i) => {
        if (dates.length > 6 && i % Math.ceil(dates.length / 5) !== 0) return null;
        return (
          <text
            key={d}
            x={xScale(d)}
            y={H - padB + 12}
            textAnchor="middle"
            className="fill-ink-400"
            style={{ fontSize: 9 }}
          >
            {formatShortDate(d)}
          </text>
        );
      })}

      {/* 塗りつぶし */}
      <path d={fillD} fill="url(#expGrad)" />

      {/* ライン */}
      <path
        d={pathD}
        fill="none"
        stroke="#0071e3"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ドット */}
      {sorted.map((p, i) => (
        <circle
          key={i}
          cx={xScale(p.date)}
          cy={yScale(p.cumExp)}
          r={3}
          fill="white"
          stroke="#0071e3"
          strokeWidth={1.6}
        />
      ))}
    </svg>
  );
}

// ── ヘルパー ──────────────────────────────────

function niceCeil(v: number): number {
  if (v <= 0) return 100;
  const magnitude = Math.pow(10, Math.floor(Math.log10(v)));
  return Math.ceil(v / magnitude) * magnitude;
}

function buildYTicks(max: number, count: number): number[] {
  const step = Math.max(1, Math.round(max / count));
  const ticks: number[] = [];
  for (let i = 1; i <= count; i++) {
    const v = Math.round((step * i) / step) * step;
    if (v <= max) ticks.push(v);
  }
  return ticks;
}

function formatExp(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`;
  return String(v);
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
