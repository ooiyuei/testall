"use client";

// 今週の目標カード — クリーン版
// 最低 / 標準 / 余力 ラインを横並びで提示
// 重点配分 (科目バー) + 曜日配分

import { useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/hooks/useStore";
import {
  buildWeeklyGoal,
  defaultRemainingMonths,
  estimateGoalGap,
  estimateRequiredBlocks,
  generateWeeklyPlan,
  WEEK_LOAD_LABEL,
} from "@/lib/planning";
import { startOfWeek } from "@/lib/store";
import { getSubjectArea } from "@/lib/master/subjects/hierarchy";

export function WeeklyGoalCard() {
  const { state, hydrated } = useStore();
  const profile = state.profile;
  const planning = state.planning;

  const plan = useMemo(() => {
    if (!profile || !profile.deviation || !profile.targetUniversities?.length) {
      return null;
    }
    const grade = (profile.grade as "h1" | "h2" | "h3" | "ronin") ?? "h2";
    const months = defaultRemainingMonths(grade);
    const remainingWeeks = Math.max(1, Math.round((months * 30) / 7));

    const target = profile.targetUniversities[0];
    const borderDev = 60;

    const gap = estimateGoalGap({
      targets: [
        {
          universityId: target.universityId,
          priority: 1,
          borderDeviation: borderDev,
          safeDeviation: borderDev + 3,
          stretchDeviation: borderDev + 5,
        },
      ],
      currentTotal: profile.deviation,
      currentByArea: {},
      remainingWeeks,
    });

    const required = estimateRequiredBlocks({ gap, remainingWeeks });

    const weekday = planning?.weekdayBaseBlocks ?? 3;
    const weekend = planning?.weekendBaseBlocks ?? 6;
    const realisticWeekly = weekday * 5 + weekend * 2;

    const goal = buildWeeklyGoal({
      weekStartISO: startOfWeek(new Date()),
      requiredWeeklyBlocks: required.weeklyRequiredBlocks,
      realisticWeeklyBlocks: realisticWeekly,
      priority: gap.priorityScores,
    });

    const week = generateWeeklyPlan({ goal, weekdayBlocks: weekday, weekendBlocks: weekend });
    return { gap, required, goal, week };
  }, [profile, planning]);

  if (!hydrated) return null;

  if (!plan) {
    return (
      <section className="rounded-2xl border border-ink-100/80 bg-white p-5">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
          今週の目標
        </div>
        <p className="mt-2 text-[12px] leading-[1.7] text-ink-500">
          学年・志望校・偏差値を入れると今週の目標が自動で出ます。
        </p>
        <Link
          href="/onboarding"
          className="mt-3 inline-flex h-9 items-center rounded-full bg-ink-900 px-4 text-[12px] font-bold text-white"
        >
          設定する
        </Link>
      </section>
    );
  }

  const { goal, week, required } = plan;

  return (
    <section className="rounded-2xl border border-ink-100/80 bg-white p-5">
      <div className="flex items-baseline justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
          今週の目標
        </div>
        <span className="text-[10px] font-medium text-ink-500">
          {WEEK_LOAD_LABEL[required.riskLevel]}
        </span>
      </div>

      {/* 主役: 標準ライン大きく + 最低/余力を脇に */}
      <div className="mt-3 flex items-end gap-3">
        <div>
          <div className="text-[10px] font-medium text-ink-400">標準</div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-[44px] font-bold leading-none tabular-nums text-ink-900">
              {goal.targetBlocks}
            </span>
            <span className="text-[11px] font-medium text-ink-500">blk</span>
          </div>
        </div>
        <div className="ml-auto flex gap-3">
          <ScaleItem label="最低" value={goal.minimumBlocks} tone="text-coral-500" />
          <ScaleItem label="余力" value={goal.stretchBlocks} tone="text-mint-600" />
        </div>
      </div>

      {/* 重点配分 */}
      {goal.subjectAllocation.length > 0 ? (
        <div className="mt-5 space-y-1.5">
          {goal.subjectAllocation.map((a) => {
            const area = getSubjectArea(a.area);
            const pct = goal.targetBlocks > 0 ? Math.round((a.blocks / goal.targetBlocks) * 100) : 0;
            return (
              <div key={a.area} className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-5 w-5 flex-none items-center justify-center rounded-md text-[9px] font-bold",
                    area?.tone ?? "bg-cream-100 text-ink-700",
                  )}
                >
                  {area?.shortName ?? "?"}
                </span>
                <span className="w-12 text-[11px] font-bold text-ink-700">
                  {area?.name ?? a.area}
                </span>
                <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-cream-100">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-ink-900"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-12 text-right text-[10px] tabular-nums text-ink-500">
                  {a.blocks}blk
                </span>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* 曜日配分 */}
      <div className="mt-5">
        <div className="text-[10px] font-medium text-ink-400">曜日別</div>
        <ul className="mt-1.5 grid grid-cols-7 gap-1">
          {week.days.map((d) => (
            <li
              key={d.day}
              className={cn(
                "flex flex-col items-center rounded-lg py-1.5",
                d.blocks > 0 ? "bg-cream-50" : "bg-cream-50/40",
              )}
            >
              <span className="text-[9px] font-medium text-ink-500">
                {WEEKDAY[d.day]}
              </span>
              <span
                className={cn(
                  "text-sm font-bold tabular-nums",
                  d.blocks > 0 ? "text-ink-900" : "text-ink-300",
                )}
              >
                {d.blocks}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const WEEKDAY: Record<string, string> = {
  Mon: "月",
  Tue: "火",
  Wed: "水",
  Thu: "木",
  Fri: "金",
  Sat: "土",
  Sun: "日",
};

function ScaleItem({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="text-right">
      <div className="text-[10px] font-medium text-ink-400">{label}</div>
      <div className={cn("text-base font-bold leading-none tabular-nums", tone)}>
        {value}
      </div>
    </div>
  );
}
