"use client";

// 五角形レーダーチャート (国/数/英/理/社)
// 純粋 SVG。recharts なし。
// 大きめ + ラベル外側配置 + 値ラベル小さく

import { cn } from "@/lib/cn";

export type RadarPoint = {
  label: string;
  shortLabel: string;
  value: number; // 0〜100
};

type Props = {
  data: RadarPoint[];
  size?: number;
  onPick?: (idx: number) => void;
};

export function RadarChart({ data, size = 260, onPick }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) * 0.72;

  if (data.length < 3) return null;
  const n = data.length;

  function point(idx: number, value: number) {
    const ratio = Math.max(0, Math.min(1, value / 100));
    const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / n;
    return [cx + r * ratio * Math.cos(angle), cy + r * ratio * Math.sin(angle)];
  }

  const axisPts = data.map((_, i) => point(i, 100));
  const valuePts = data.map((d, i) => point(i, d.value));

  // 同心多角形
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
          fill={i === 3 ? "rgba(252, 250, 247, 0.5)" : "none"}
          stroke="rgb(216 212 200 / 0.5)"
          strokeWidth={i === 3 ? 1.2 : 0.7}
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
          stroke="rgb(216 212 200 / 0.5)"
          strokeWidth={0.7}
        />
      ))}
      {/* 値ポリゴン */}
      <polygon
        points={valuePts.map((p) => p.join(",")).join(" ")}
        fill="rgba(0, 113, 227, 0.16)"
        stroke="rgb(0 113 227)"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* 値の点 */}
      {valuePts.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={3}
          fill="rgb(0 113 227)"
          onClick={() => onPick?.(i)}
          style={{ cursor: onPick ? "pointer" : "default" }}
        />
      ))}
      {/* ラベル (外側) — クリッカブル時はキーボード操作対応 */}
      {data.map((d, i) => {
        const ratio = 1.18;
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        const lx = cx + r * ratio * Math.cos(angle);
        const ly = cy + r * ratio * Math.sin(angle);
        const interactive = !!onPick;
        return (
          <g
            key={i}
            onClick={() => onPick?.(i)}
            onKeyDown={(e) => {
              if (interactive && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onPick?.(i);
              }
            }}
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={interactive ? `${d.label}の詳細を開く` : undefined}
            style={{
              cursor: interactive ? "pointer" : "default",
              outline: "none",
            }}
          >
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-ink-900 font-bold"
              style={{ fontSize: 13 }}
            >
              {d.shortLabel}
            </text>
            <text
              x={lx}
              y={ly + 14}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-ink-500 tabular-nums"
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
