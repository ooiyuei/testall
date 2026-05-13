"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/hooks/useStore";
import { Plus } from "lucide-react";

const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"];

function weekdayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

function mondayOf(d: Date): Date {
  const m = new Date(d);
  m.setHours(0, 0, 0, 0);
  m.setDate(m.getDate() - weekdayIndex(m));
  return m;
}

export function PlanView() {
  const { state, hydrated } = useStore();

  if (!hydrated) {
    return (
      <div className="px-4 pt-10 text-sm text-ink-500">読み込み中…</div>
    );
  }

  const latest = state.tests[0];
  if (!latest) {
    return (
      <div className="px-4 pt-6">
        <div className="rounded-3xl border border-dashed border-cream-300 bg-white/60 p-6 text-center">
          <div className="text-sm font-bold text-ink-700">
            まだ週計画がありません
          </div>
          <p className="mt-1 text-xs text-ink-500">
            テストを追加するとAIが1週間ぶんの作戦を出します。
          </p>
          <Link
            href="/app/test/new"
            className="mt-3 inline-flex h-10 items-center gap-1 rounded-full bg-sky-500 px-4 text-xs font-black text-white shadow-soft"
          >
            <Plus className="h-4 w-4" />
            テストを追加
          </Link>
        </div>
      </div>
    );
  }

  const monday = mondayOf(new Date());
  const todayIdx = weekdayIndex(new Date());

  const blocksPlanned = latest.diagnosis.weekPlan.reduce(
    (acc, d) => acc + d.blocks,
    0,
  );

  // For "today" we count completed blocks against todayBlocks.
  const completedToday = state.blockLogs.filter(
    (l) =>
      l.testId === latest.id &&
      new Date(l.completedAt).toDateString() === new Date().toDateString(),
  ).length;

  return (
    <div className="px-4 pt-3 pb-10">
      <div className="rounded-3xl border border-cream-200 bg-gradient-to-br from-mint-50 to-sky-50 p-5 shadow-soft">
        <div className="text-xs font-bold uppercase tracking-widest text-mint-600">
          今週の目標
        </div>
        <p className="mt-1 text-sm text-ink-700">
          {latest.diagnosis.weaknesses
            .slice(0, 2)
            .map((w) => w.unit)
            .join(" / ")}{" "}
          を中心に基本例題を回し、{latest.input.subject}の底を上げる。
        </p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black tabular-nums text-ink-900">
            {completedToday}
          </span>
          <span className="text-xs font-bold text-ink-500">
            / {blocksPlanned} ブロック（今週）
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/70">
          <div
            className="h-full rounded-full bg-mint-500"
            style={{
              width: `${blocksPlanned === 0 ? 0 : Math.min(100, Math.round((completedToday / blocksPlanned) * 100))}%`,
            }}
          />
        </div>
      </div>

      <ul className="mt-5 space-y-2.5">
        {latest.diagnosis.weekPlan.map((w, i) => {
          const date = new Date(monday);
          date.setDate(monday.getDate() + i);
          const isToday = i === todayIdx;
          const day = WEEKDAYS[i] ?? w.day;
          return (
            <li
              key={i}
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-3 shadow-soft",
                isToday
                  ? "border-sky-300 bg-white ring-2 ring-sky-100"
                  : "border-cream-200 bg-white",
              )}
            >
              <div
                className={cn(
                  "flex w-12 flex-none flex-col items-center justify-center rounded-xl py-1.5 text-[10px] font-bold",
                  isToday ? "bg-sky-500 text-white" : "bg-cream-100 text-ink-500",
                )}
              >
                <span className="text-xs font-black">{day}</span>
                <span>
                  {date.getMonth() + 1}/{date.getDate()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-ink-900">{w.focus}</div>
                <div className="mt-0.5 text-[11px] text-ink-500">
                  {w.subjects.join(" · ")}
                </div>
              </div>
              <div className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 tabular-nums">
                {w.blocks}ブロック
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
