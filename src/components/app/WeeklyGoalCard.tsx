"use client";

// 今週の目標 (週次計画)
// §6 の最低/標準/余力ライン + §9 の曜日別配分 を表示
// 内部的に毎週 generateWeeklyPlan() を再計算（基準データが揃っていれば）

import { useMemo } from "react";
import Link from "next/link";
import { Sparkles, Target, TrendingUp } from "lucide-react";
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
import type {
  SubjectAreaId,
} from "@/lib/master/subjects";
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

    // 志望校の偏差値が分からない場合は border をやや高めに置く
    const target = profile.targetUniversities[0];
    // TODO: 実データに置き換え（universities テーブルから faculty.deviation を join）
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

    const required = estimateRequiredBlocks({
      gap,
      remainingWeeks,
    });

    // 平日/休日の現実上限
    const weekday = planning?.weekdayBaseBlocks ?? 3;
    const weekend = planning?.weekendBaseBlocks ?? 6;
    const realisticWeekly = weekday * 5 + weekend * 2;

    const goal = buildWeeklyGoal({
      weekStartISO: startOfWeek(new Date()),
      requiredWeeklyBlocks: required.weeklyRequiredBlocks,
      realisticWeeklyBlocks: realisticWeekly,
      priority: gap.priorityScores,
    });

    const week = generateWeeklyPlan({
      goal,
      weekdayBlocks: weekday,
      weekendBlocks: weekend,
    });

    return { gap, required, goal, week };
  }, [profile, planning]);

  if (!hydrated) return null;
  if (!plan) {
    return (
      <section className="rounded-3xl border border-cream-200 bg-white p-4 shadow-soft">
        <h2 className="text-sm font-black text-ink-900">今週の目標</h2>
        <p className="mt-1 text-xs text-ink-500">
          学年・志望校・偏差値を設定すると、自動で今週の目標が出ます。
        </p>
        <Link
          href="/onboarding"
          className="mt-3 inline-flex h-9 items-center gap-1 rounded-full bg-sky-500 px-3 text-xs font-black text-white"
        >
          設定する
        </Link>
      </section>
    );
  }

  const { goal, week, required } = plan;
  const riskLabel = WEEK_LOAD_LABEL[required.riskLevel];

  return (
    <section className="rounded-3xl border border-cream-200 bg-white p-4 shadow-soft">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-black text-ink-900">今週の目標</h2>
        <div className="text-[10px] text-ink-500">
          {required.riskLevel === "realistic" ? "🟢" : "🟡"} {riskLabel}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Pill
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          tone="bg-cream-100 text-ink-700"
          label="最低ライン"
          value={goal.minimumBlocks}
          unit="bk"
        />
        <Pill
          icon={<Target className="h-3.5 w-3.5" />}
          tone="bg-sky-100 text-sky-700"
          label="標準"
          value={goal.targetBlocks}
          unit="bk"
        />
        <Pill
          icon={<Sparkles className="h-3.5 w-3.5" />}
          tone="bg-sun-200 text-ink-900"
          label="余力"
          value={goal.stretchBlocks}
          unit="bk"
        />
      </div>

      {/* 科目配分 */}
      {goal.subjectAllocation.length > 0 ? (
        <div className="mt-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
            重点配分
          </div>
          <ul className="mt-1.5 space-y-1">
            {goal.subjectAllocation.map((a) => {
              const area = getSubjectArea(a.area);
              const pct = goal.targetBlocks > 0
                ? Math.round((a.blocks / goal.targetBlocks) * 100)
                : 0;
              return (
                <li key={a.area} className="flex items-center gap-2 text-[11px]">
                  <span
                    className={cn(
                      "flex h-5 w-5 flex-none items-center justify-center rounded-md text-[9px] font-black",
                      area?.tone ?? "bg-cream-100 text-ink-700",
                    )}
                  >
                    {area?.shortName ?? "?"}
                  </span>
                  <span className="flex-1 truncate font-bold text-ink-900">
                    {area?.name ?? a.area}
                  </span>
                  <span className="text-ink-500 tabular-nums">{a.blocks} ブロック</span>
                  <span className="w-10 text-right text-ink-400 tabular-nums">{pct}%</span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {/* 曜日別配分 */}
      <div className="mt-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
          曜日別
        </div>
        <ul className="mt-1.5 grid grid-cols-7 gap-1">
          {week.days.map((d) => (
            <li
              key={d.day}
              className={cn(
                "flex flex-col items-center rounded-xl border py-1.5",
                d.blocks > 0
                  ? "border-sky-200 bg-sky-50"
                  : "border-cream-200 bg-cream-50",
              )}
            >
              <span className="text-[9px] font-bold text-ink-500">{LABEL[d.day]}</span>
              <span className="text-sm font-black text-ink-900 tabular-nums">{d.blocks}</span>
              {d.isBuffer ? (
                <span className="text-[8px] text-ink-400">予備</span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const LABEL: Record<string, string> = {
  Mon: "月",
  Tue: "火",
  Wed: "水",
  Thu: "木",
  Fri: "金",
  Sat: "土",
  Sun: "日",
};

function Pill({
  icon,
  tone,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  tone: string;
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className={cn("rounded-2xl px-2 py-2", tone)}>
      <div className="flex items-center justify-center gap-1 text-[9px] font-bold">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 text-xl font-black tabular-nums">
        {value}
        <span className="ml-0.5 text-[10px] font-bold opacity-70">{unit}</span>
      </div>
    </div>
  );
}
