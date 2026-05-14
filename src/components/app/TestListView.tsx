"use client";

// テスト一覧 — ⑱ TestListScreen スタイル
// 上: 小さい「テスト」 + 大きい「N 件の記録」 + 右上 + ボタン
// 中: 黒ヒーロー (総合偏差値 + スパークライン)
// 下: 履歴リスト (日付列 / テスト名+メタ / 偏差値+delta)

import Link from "next/link";
import { useMemo } from "react";
import { Plus } from "lucide-react";
import { useStore } from "@/lib/hooks/useStore";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import type { StoredTest } from "@/lib/store";

export function TestListView() {
  const { state, hydrated } = useStore();
  const tests = state.tests;

  // 各テストの代表偏差値 (主科目 or 全科目平均)
  const testDeviations = useMemo(() => {
    return tests.map((t) => {
      const subjects = t.input.subjects ?? [];
      const devs = subjects
        .map((s) => s.deviation)
        .filter((d): d is number => typeof d === "number" && d > 0);
      if (devs.length > 0) {
        return devs.reduce((a, b) => a + b, 0) / devs.length;
      }
      return t.input.deviation ?? null;
    });
  }, [tests]);

  // 直近の総合偏差値とトレンド (古→新を旧→新の順で並べる)
  const trend = useMemo(() => {
    const points = tests
      .map((t, i) => ({
        date: t.createdAt,
        dev: testDeviations[i],
      }))
      .filter((p): p is { date: string; dev: number } => p.dev !== null)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (points.length === 0) return null;
    const latest = points[points.length - 1].dev;
    const oldest = points[0].dev;
    return {
      points,
      latest,
      delta: latest - oldest,
    };
  }, [tests, testDeviations]);

  if (!hydrated) {
    return <ListSkeleton rows={4} />;
  }

  return (
    <div className="px-5 pb-8 pt-2">
      {/* Header */}
      <section className="flex items-end justify-between">
        <div>
          <div className="text-[11px] font-medium text-ink-400">テスト</div>
          <h1
            className="mt-1 text-[28px] font-extrabold leading-[1.1] tracking-[-0.025em] text-ink-900"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span className="text-sky-500 tabular-nums">{tests.length}</span> 件の記録
          </h1>
        </div>
        <Link
          href="/app/test/new"
          aria-label="テストを追加"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-900 text-white transition active:scale-[0.92]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.4} />
        </Link>
      </section>

      {/* Deviation trend hero (dark) */}
      {trend ? (
        <section className="mt-4 rounded-[18px] bg-ink-900 p-4 text-white">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold text-white/60">
                総合偏差値
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span
                  className="text-[40px] font-extrabold leading-[0.95] tabular-nums tracking-[-0.03em]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {trend.latest.toFixed(1)}
                </span>
                {trend.delta !== 0 ? (
                  <span
                    className={cn(
                      "text-[12px] font-bold tabular-nums",
                      trend.delta > 0 ? "text-mint-500" : "text-coral-300",
                    )}
                  >
                    {trend.delta > 0 ? "+" : ""}
                    {trend.delta.toFixed(1)}
                  </span>
                ) : null}
              </div>
            </div>
            <span className="text-[11px] text-white/50">
              直近 {trend.points.length}件
            </span>
          </div>
          <Sparkline points={trend.points.map((p) => p.dev)} />
        </section>
      ) : null}

      {/* History */}
      {tests.length > 0 ? (
        <section className="mt-5">
          <h2 className="text-[11px] font-medium text-ink-500">履歴</h2>
          <ul className="mt-2.5 space-y-2">
            {tests.map((t, i) => (
              <li key={t.id}>
                <TestRow test={t} deviation={testDeviations[i]} />
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="mt-6 rounded-2xl border border-dashed border-cream-300 bg-white/60 p-6 text-center">
          <div className="text-[13px] font-bold text-ink-700">
            テストを追加して、AIに分析してもらおう
          </div>
          <p className="mt-1 text-[11px] text-ink-500">
            単元ごとの正答数と原因を入れるだけ。
          </p>
          <Link
            href="/app/test/new"
            className="mt-3 inline-flex h-11 items-center gap-1.5 rounded-full bg-ink-900 px-5 text-[13px] font-bold text-white"
          >
            <Plus className="h-4 w-4" />
            テストを追加する
          </Link>
        </section>
      )}
    </div>
  );
}

function TestRow({
  test,
  deviation,
}: {
  test: StoredTest;
  deviation: number | null;
}) {
  const date = new Date(test.createdAt);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const score = test.input.score;
  const fullScore = test.input.fullScore;

  // 同科目の前回との偏差値差分 (任意)
  return (
    <Link
      href={`/app/test/${test.id}`}
      className="flex items-center gap-3 rounded-2xl border border-ink-100/80 bg-white p-3.5 transition active:bg-cream-50"
    >
      {/* date col */}
      <div className="w-10 flex-none text-center">
        <div className="text-[9px] font-semibold text-ink-400">{month}月</div>
        <div className="text-[16px] font-extrabold leading-none tabular-nums tracking-[-0.02em] text-ink-900">
          {day}
        </div>
      </div>
      {/* body */}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-bold tracking-tight text-ink-900">
          {test.input.testName}
        </div>
        <div className="mt-0.5 truncate text-[10px] text-ink-500">
          {test.input.subject} · {score}
          {fullScore ? `/${fullScore}` : ""}
        </div>
      </div>
      {/* deviation */}
      {deviation !== null ? (
        <div className="text-right">
          <div className="text-[16px] font-extrabold tabular-nums tracking-tight text-ink-900">
            {deviation.toFixed(1)}
          </div>
          <div className="text-[10px] font-semibold text-ink-400">偏差値</div>
        </div>
      ) : (
        <div className="text-right">
          <div
            className="text-[16px] font-extrabold tabular-nums tracking-tight text-ink-900"
            title="点数率"
          >
            {fullScore > 0 ? Math.round((score / fullScore) * 100) : 0}
            <span className="text-[10px] font-semibold text-ink-400">%</span>
          </div>
        </div>
      )}
    </Link>
  );
}

function Sparkline({ points }: { points: number[] }) {
  if (points.length === 0) return null;
  const w = 320;
  const h = 40;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = Math.max(max - min, 1);
  const step = points.length > 1 ? w / (points.length - 1) : 0;
  const coords = points.map((v, i) => {
    const x = points.length === 1 ? w : i * step;
    const y = h - 4 - ((v - min) / range) * (h - 8);
    return { x, y };
  });
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const last = coords[coords.length - 1];
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="mt-3 h-10 w-full"
      preserveAspectRatio="none"
    >
      <path
        d={path}
        fill="none"
        stroke="#ffffff"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last.x} cy={last.y} r={3} fill="#ffffff" />
    </svg>
  );
}
