"use client";

// 志望校ギャップ + 必要時間サマリ (MeView 上部に置くカード)
// §18 / §19 の出力例を実装

import { useMemo } from "react";
import Link from "next/link";
import { Target, TrendingUp, Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/hooks/useStore";
import {
  defaultRemainingMonths,
  estimateGoalGap,
  estimateRequiredBlocks,
  lookupRequiredHours,
  WEEK_LOAD_LABEL,
} from "@/lib/planning";

const HOURS_PER_BLOCK = 0.75;

export function GapCard() {
  const { state, hydrated } = useStore();

  const result = useMemo(() => {
    const p = state.profile;
    if (!p?.deviation || !p.targetUniversities?.length) return null;
    const grade = (p.grade as "h1" | "h2" | "h3" | "ronin") ?? "h2";
    const totalMonths = defaultRemainingMonths(grade);
    const remainingWeeks = Math.max(1, Math.round((totalMonths * 30) / 7));

    // border_deviation の暫定値（次のアップデートで universities.faculties から取得）
    const border = 65;
    const baseHours = lookupRequiredHours(p.deviation, border);

    const gap = estimateGoalGap({
      targets: [
        {
          universityId: p.targetUniversities[0].universityId,
          priority: 1,
          borderDeviation: border,
          safeDeviation: border + 3,
          stretchDeviation: border + 5,
        },
      ],
      currentTotal: p.deviation,
      currentByArea: {},
      remainingWeeks,
    });

    const required = estimateRequiredBlocks({
      gap,
      remainingWeeks,
    });

    return {
      border,
      baseHours,
      grade,
      totalMonths,
      remainingWeeks,
      currentDeviation: p.deviation,
      required,
    };
  }, [state.profile]);

  if (!hydrated) return null;
  if (!result) return null;

  const { border, baseHours, totalMonths, currentDeviation, required } = result;
  const futureRangeHours = required.futureRequiredHours;
  const futureBlocks = {
    lower: Math.round(futureRangeHours.lower / HOURS_PER_BLOCK),
    upper: Math.round(futureRangeHours.upper / HOURS_PER_BLOCK),
  };
  const weekly = required.weeklyRequiredBlocks;
  const riskLabel = WEEK_LOAD_LABEL[required.riskLevel];

  return (
    <section className="rounded-3xl border border-cream-200 bg-gradient-to-br from-sky-50 to-cream-50 p-4 shadow-soft">
      <div className="flex items-center gap-1.5">
        <Target className="h-3.5 w-3.5 text-sky-600" />
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-sky-700">
          志望校までのギャップ
        </h2>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2">
        <Stat label="現在偏差値" value={currentDeviation} unit="" tone="bg-white text-ink-900" />
        <Stat
          label="目標偏差値"
          value={border}
          unit=""
          tone="bg-sky-500 text-white"
        />
        <Stat
          label="差"
          value={Math.max(0, border - currentDeviation)}
          unit="pt"
          tone="bg-coral-300 text-white"
        />
      </div>

      <div className="mt-3 rounded-2xl bg-white p-3">
        <div className="flex items-baseline justify-between">
          <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
            必要有効学習時間（推定）
          </div>
          <div className="text-[10px] text-ink-400">残り {totalMonths}ヶ月</div>
        </div>
        <div className="mt-1 text-base font-black text-ink-900 tabular-nums">
          {baseHours.lower.toLocaleString()}〜{baseHours.upper.toLocaleString()}
          <span className="ml-1 text-xs font-bold text-ink-500">時間</span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
          <Mini icon={<Clock />} label="今後の必要時間" value={`${futureRangeHours.lower}〜${futureRangeHours.upper}h`} />
          <Mini icon={<TrendingUp />} label="今後のブロック数" value={`${futureBlocks.lower}〜${futureBlocks.upper}`} />
        </div>
      </div>

      <div className="mt-3 rounded-2xl bg-white p-3">
        <div className="flex items-baseline justify-between">
          <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
            週あたり必要
          </div>
          <div className="text-[10px] font-bold text-sky-700">{riskLabel}</div>
        </div>
        <div className="mt-1 text-base font-black text-ink-900 tabular-nums">
          {weekly.lower}〜{weekly.upper}
          <span className="ml-1 text-xs font-bold text-ink-500">ブロック / 週</span>
        </div>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-ink-600">
        ※ 偏差値ソースとユーザー実行ログで補正されます。初期値は粗い推定です。
      </p>
    </section>
  );
}

function Stat({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: number;
  unit: string;
  tone: string;
}) {
  return (
    <div className={cn("rounded-2xl px-2 py-2 text-center shadow-soft", tone)}>
      <div className="text-[9px] font-bold opacity-80">{label}</div>
      <div className="mt-0.5 text-xl font-black tabular-nums">
        {value}
        {unit ? <span className="ml-0.5 text-[10px] opacity-70">{unit}</span> : null}
      </div>
    </div>
  );
}

function Mini({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-cream-50 p-2">
      <div className="flex items-center gap-1 text-[9px] font-bold text-ink-500">
        <span className="[&_svg]:h-3 [&_svg]:w-3">{icon}</span>
        {label}
      </div>
      <div className="mt-0.5 font-black text-ink-900 tabular-nums">{value}</div>
    </div>
  );
}
