"use client";

// 集中モード一覧 — ⑲ FocusListScreen スタイル
// 上: 大見出し「集中」
// 中: 黒のヒーロー「すぐ始める / 自由に25分」+ 25分はじめるボタン
// 下: 今日のブロック一覧 + 今週の集中 3列スタッツ

import Link from "next/link";
import {
  CheckCircle2,
  Play,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/hooks/useStore";
import type { Block } from "@/lib/types";
import { LoadingState } from "@/components/ui/LoadingState";

function parseHHmm(s: string): number {
  const [h, m] = s.split(":").map((n) => Number(n));
  if (Number.isNaN(h) || Number.isNaN(m)) return -1;
  return h * 60 + m;
}

function weekdayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

function buildWeekStats(blockLogs: { completedAt: string }[], now: Date) {
  const dayIdx = weekdayIndex(now); // 0=Mon
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayIdx);
  weekStart.setHours(0, 0, 0, 0);

  const weekBlocks = blockLogs.filter(
    (l) => new Date(l.completedAt) >= weekStart,
  );
  const totalBlocks = weekBlocks.length;
  const totalMin = totalBlocks * 25;
  const studiedDays = new Set(
    weekBlocks.map((l) => l.completedAt.slice(0, 10)),
  ).size;
  return { totalBlocks, totalMin, studiedDays };
}

export function FocusListView() {
  const { state, hydrated } = useStore();

  const now = new Date();

  if (!hydrated) {
    return <LoadingState />;
  }

  const latest = state.tests[0];
  const blocks: Block[] = latest?.diagnosis.todayBlocks ?? [];
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const status = blocks.map((b, i) => {
    const done = state.blockLogs.some(
      (l) => l.testId === latest?.id && l.blockIdx === i,
    );
    if (done) return "done" as const;
    const end = parseHHmm(b.endTime);
    if (end < 0 || end >= nowMin) return "next" as const;
    return "past" as const;
  });

  let nowIdx = status.findIndex((s) => s === "next");
  if (nowIdx < 0) nowIdx = -1;

  const weekStats = buildWeekStats(state.blockLogs, now);

  return (
    <div className="px-5 pb-8 pt-2">
      {/* Title */}
      <h1
        className="mt-1 text-[28px] font-extrabold tracking-[-0.025em] text-ink-900"
        style={{ fontFamily: "var(--font-display)" }}
      >
        集中
      </h1>

      {/* Quick start hero — dark */}
      <section className="mt-4 rounded-[22px] bg-ink-900 p-5 text-white">
        <div className="text-[11px] font-semibold tracking-wide text-white/60">
          すぐ始める
        </div>
        <div
          className="mt-2 text-[22px] font-extrabold tracking-[-0.02em]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          自由に25分
        </div>
        <p className="mt-1 text-[12px] leading-[1.7] text-white/60">
          テストや課題が無くてもタイマーは使えます。
        </p>
        <Link
          href="/app/focus/run"
          className="mt-3.5 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[13px] font-bold text-ink-900 transition active:scale-[0.97]"
        >
          <Play className="h-3 w-3" strokeWidth={2.6} fill="currentColor" />
          25分はじめる
        </Link>
      </section>

      {/* Today's blocks */}
      {blocks.length > 0 && latest ? (
        <section className="mt-6">
          <h2 className="text-[11px] font-medium text-ink-500">
            今日のブロック · {blocks.length}件
          </h2>
          <ul className="mt-2.5 space-y-2">
            {blocks.map((b, i) => {
              const done = status[i] === "done";
              const nowB = i === nowIdx;
              return (
                <li key={i}>
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border bg-white px-3.5 py-3 transition",
                      nowB
                        ? "border-[1.5px] border-sky-500 shadow-[0_0_0_4px_rgba(0,113,227,0.08)]"
                        : "border-ink-100/80",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-11 w-11 flex-none items-center justify-center rounded-xl text-[13px] font-extrabold tabular-nums",
                        done
                          ? "bg-mint-50 text-mint-600"
                          : nowB
                            ? "bg-sky-50 text-sky-600"
                            : "bg-cream-100 text-ink-500",
                      )}
                    >
                      {b.startTime}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className={cn(
                          "text-[14px] font-bold tracking-tight",
                          done ? "text-ink-400 line-through" : "text-ink-900",
                        )}
                      >
                        {b.subject} / {b.topic}
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-ink-500">
                        {b.source}
                      </div>
                    </div>
                    {done ? (
                      <CheckCircle2 className="h-[22px] w-[22px] flex-none text-mint-500" />
                    ) : (
                      <Link
                        href={`/app/focus/run?testId=${latest.id}&block=${i}`}
                        className={cn(
                          "flex h-9 w-9 flex-none items-center justify-center rounded-full transition active:scale-[0.92]",
                          nowB
                            ? "bg-ink-900 text-white"
                            : "bg-cream-100 text-ink-700",
                        )}
                        aria-label="このブロックを始める"
                      >
                        <Play className="h-3 w-3" strokeWidth={2.6} fill="currentColor" />
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <section className="mt-6 rounded-2xl border border-dashed border-cream-300 bg-white/60 p-5 text-center">
          <div className="text-[14px] font-bold text-ink-900">
            テストを登録すると、今日の勉強が自動で組まれます
          </div>
          <Link
            href="/app/test/new"
            className="mt-3 inline-flex h-10 items-center gap-1 rounded-full bg-cream-100 px-4 text-[12px] font-bold text-ink-700"
          >
            <Plus className="h-4 w-4" />
            テストを追加
          </Link>
        </section>
      )}

      {/* Weekly focus stats */}
      <section className="mt-6">
        <h2 className="text-[11px] font-medium text-ink-500">今週の集中</h2>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white border border-ink-100/80 px-3 py-3 text-center">
            <div className="text-[20px] font-extrabold tabular-nums text-ink-900 tracking-[-0.02em]">
              {weekStats.totalBlocks}
            </div>
            <div className="mt-0.5 text-[10px] font-medium text-ink-400">
              ブロック
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-ink-100/80 px-3 py-3 text-center">
            <div className="text-[20px] font-extrabold tabular-nums text-ink-900 tracking-[-0.02em]">
              {weekStats.totalMin >= 60
                ? `${Math.floor(weekStats.totalMin / 60)}h${weekStats.totalMin % 60 > 0 ? `${weekStats.totalMin % 60}m` : ""}`
                : `${weekStats.totalMin}m`}
            </div>
            <div className="mt-0.5 text-[10px] font-medium text-ink-400">
              学習時間
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-ink-100/80 px-3 py-3 text-center">
            <div className="text-[20px] font-extrabold tabular-nums text-ink-900 tracking-[-0.02em]">
              {weekStats.studiedDays}
            </div>
            <div className="mt-0.5 text-[10px] font-medium text-ink-400">
              学習日
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
