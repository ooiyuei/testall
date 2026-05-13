"use client";

// 五角形レーダーチャート (国/数/英/理/社)
// 純粋 SVG。recharts などの依存を避ける。

import { cn } from "@/lib/cn";

export type RadarPoint = {
  label: string;
  shortLabel: string;
  value: number; // 0〜100
  tone?: string;
};

type Props = {
  data: RadarPoint[]; // 推奨 5 点
  size?: number;
  onPick?: (idx: number) => void;
};

export function RadarChart({ data, size = 240, onPick }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) * 0.78;

  if (data.length < 3) return null;
  const n = data.length;

  function point(idx: number, value: number) {
    const ratio = Math.max(0, Math.min(1, value / 100));
    // 上(-90度)から時計回り
    const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / n;
    return [cx + r * ratio * Math.cos(angle), cy + r * ratio * Math.sin(angle)];
  }

  // 軸の頂点（100%）
  const axisPts = data.map((_, i) => point(i, 100));
  // 実データ点
  const valuePts = data.map((d, i) => point(i, d.value));

  // 同心多角形（25/50/75/100%）
  const rings = [25, 50, 75, 100].map((pct) =>
    data.map((_, i) => point(i, pct)).map((p) => p.join(",")).join(" "),
  );

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full"
      role="img"
      aria-label="科目別ステータス"
    >
      {/* 同心多角形 */}
      {rings.map((pts, i) => (
        <polygon
          key={i}
          points={pts}
          fill="none"
          stroke="rgb(229 218 197 / 0.7)"
          strokeWidth={i === 3 ? 1.2 : 0.8}
        />
      ))}
      {/* 軸線 */}
      {axisPts.map((p, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={p[0]}
          y2={p[1]}
          stroke="rgb(229 218 197 / 0.7)"
          strokeWidth={0.8}
        />
      ))}
      {/* 値のポリゴン */}
      <polygon
        points={valuePts.map((p) => p.join(",")).join(" ")}
        fill="rgb(99 165 230 / 0.30)"
        stroke="rgb(56 132 209)"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* 値の点（小さめ） */}
      {valuePts.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={2.5}
          fill="rgb(56 132 209)"
          onClick={() => onPick?.(i)}
          style={{ cursor: onPick ? "pointer" : "default" }}
        />
      ))}
      {/* ラベル */}
      {data.map((d, i) => {
        const [lx, ly] = point(i, 118);
        return (
          <g key={i} onClick={() => onPick?.(i)} style={{ cursor: onPick ? "pointer" : "default" }}>
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-ink-900 font-bold"
              style={{ fontSize: 12 }}
            >
              {d.shortLabel}
            </text>
            <text
              x={lx}
              y={ly + 13}
              textAnchor="middle"
              dominantBaseline="middle"
              className={cn("fill-ink-500 tabular-nums")}
              style={{ fontSize: 10 }}
            >
              {Math.round(d.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
