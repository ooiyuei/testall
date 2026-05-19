"use client";

// 偏差値の推移 ライングラフ (SVG 自前)
// recharts などの依存を増やさない方針

import { useMemo } from "react";
import { cn } from "@/lib/cn";

export type TrendPoint = {
  date: string;        // YYYY-MM-DD
  value: number;       // 偏差値 30〜80
  label?: string;      // テスト名など
};

export type TrendSeries = {
  name: string;
  color: string;       // hex
  points: TrendPoint[];
};

type Props = {
  series: TrendSeries[];
  yMin?: number;
  yMax?: number;
  height?: number;
};

export function DeviationTrend({
  series,
  yMin = 30,
  yMax = 80,
  height = 160,
}: Props) {
  const points = series.flatMap((s) => s.points);
  if (points.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl bg-cream-50/70 text-[11px] text-ink-400">
        テスト結果を登録すると推移が表示されます
      </div>
    );
  }

  const W = 320;
  const H = height;
  const padL = 28;
  const padR = 8;
  const padT = 8;
  const padB = 20;

  // X 範囲（日付）
  const dates = [...new Set(points.map((p) => p.date))].sort();
  const xScale = (d: string) => {
    if (dates.length === 1) return (W - padR + padL) / 2;
    const idx = dates.indexOf(d);
    return padL + ((W - padL - padR) * idx) / Math.max(1, dates.length - 1);
  };
  const yScale = (v: number) => {
    const t = (v - yMin) / (yMax - yMin);
    return padT + (H - padT - padB) * (1 - t);
  };

  // Y 軸ラベル位置 (40,50,60,70)
  const yTicks = [40, 50, 60, 70].filter((v) => v >= yMin && v <= yMax);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="偏差値推移">
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
              {v}
            </text>
          </g>
        ))}

        {/* X 軸日付ラベル */}
        {dates.map((d, i) => {
          if (dates.length > 6 && i % Math.ceil(dates.length / 5) !== 0) return null;
          const x = xScale(d);
          const display = formatShortDate(d);
          return (
            <text
              key={d}
              x={x}
              y={H - padB + 12}
              textAnchor="middle"
              className="fill-ink-400"
              style={{ fontSize: 9 }}
            >
              {display}
            </text>
          );
        })}

        {/* 各シリーズ */}
        {series.map((s) => {
          if (s.points.length === 0) return null;
          const sortedPts = [...s.points].sort((a, b) => a.date.localeCompare(b.date));
          const path = sortedPts
            .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.date)} ${yScale(p.value)}`)
            .join(" ");
          return (
            <g key={s.name}>
              <path d={path} fill="none" stroke={s.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              {sortedPts.map((p, i) => (
                <circle
                  key={i}
                  cx={xScale(p.date)}
                  cy={yScale(p.value)}
                  r={3}
                  fill="white"
                  stroke={s.color}
                  strokeWidth={1.6}
                />
              ))}
            </g>
          );
        })}
      </svg>

      {/* 凡例 */}
      {series.length > 1 ? (
        <ul className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
          {series.map((s) => (
            <li key={s.name} className="flex items-center gap-1 text-[10px] text-ink-500">
              <span
                className="inline-block h-1.5 w-3 rounded-full"
                style={{ background: s.color }}
              />
              {s.name}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
