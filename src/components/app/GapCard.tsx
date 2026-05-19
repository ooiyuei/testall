"use client";

// 志望校ギャップカード — クリーン版
// 大きな数字 + 控えめなラベル + 進捗バー

import { useMemo } from "react";
import { useStore } from "@/lib/hooks/useStore";
import {
  defaultRemainingMonths,
  estimateGoalGap,
  estimateRequiredBlocks,
  lookupRequiredHours,
  WEEK_LOAD_LABEL,
} from "@/lib/planning";

import { HOURS_PER_BLOCK } from "@/lib/planning/constants";

export function GapCard() {
  const { state, hydrated } = useStore();

  const result = useMemo(() => {
    const p = state.profile;
    if (!p?.deviation || !p.targetUniversities?.length) return null;
    const grade = (p.grade as "h1" | "h2" | "h3" | "ronin") ?? "h2";
    const totalMonths = defaultRemainingMonths(grade);
    const remainingWeeks = Math.max(1, Math.round((totalMonths * 30) / 7));

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
    const required = estimateRequiredBlocks({ gap, remainingWeeks });

    return { border, baseHours, totalMonths, currentDeviation: p.deviation, required };
  }, [state.profile]);

  if (!hydrated || !result) return null;

  const { border, baseHours, totalMonths, currentDeviation, required } = result;
  const futureBlocks = {
    lower: Math.round(required.futureRequiredHours.lower / HOURS_PER_BLOCK),
    upper: Math.round(required.futureRequiredHours.upper / HOURS_PER_BLOCK),
  };
  const weekly = required.weeklyRequiredBlocks;
  const gapPt = Math.max(0, border - currentDeviation);
  const progress = Math.max(0, Math.min(100, (currentDeviation / border) * 100));

  return (
    <section className="rounded-2xl border border-ink-100/80 bg-white p-5">
      <div className="flex items-baseline justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
          志望校ギャップ
        </div>
        <span className="text-[10px] font-medium text-ink-500">
          残り {totalMonths}ヶ月
        </span>
      </div>

      {/* 現在偏差値 → 目標偏差値 */}
      <div className="mt-3 flex items-end gap-3">
        <div>
          <div className="text-[10px] font-medium text-ink-400">現在</div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-3xl font-bold tabular-nums text-ink-900">
              {currentDeviation}
            </span>
          </div>
        </div>
        <div className="mx-1 mb-1 flex-1 text-center text-ink-300">→</div>
        <div className="text-right">
          <div className="text-[10px] font-medium text-ink-400">目標</div>
          <div className="mt-0.5 flex items-baseline justify-end gap-1">
            <span className="text-3xl font-bold tabular-nums text-sky-500">
              {border}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-cream-100">
        <div
          className="h-full rounded-full bg-sky-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-1 flex items-baseline justify-between text-[10px] text-ink-500">
        <span>差 {gapPt} pt</span>
        <span className="font-medium">{WEEK_LOAD_LABEL[required.riskLevel]}</span>
      </div>

      {/* 必要時間ブロック */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Stat
          label="必要時間"
          main={`${baseHours.lower}〜${baseHours.upper}`}
          unit="h"
        />
        <Stat
          label="今後ブロック"
          main={`${futureBlocks.lower}〜${futureBlocks.upper}`}
          unit="blk"
        />
      </div>

      <div className="mt-2 rounded-xl bg-cream-50/80 px-3 py-2">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] font-medium text-ink-500">
            週あたり必要
          </span>
          <span className="text-[14px] font-bold tabular-nums text-ink-900">
            {weekly.lower}〜{weekly.upper}
            <span className="ml-1 text-[10px] font-medium text-ink-500">
              blk/週
            </span>
          </span>
        </div>
      </div>

      <p className="mt-2 text-[10px] leading-[1.6] text-ink-400">
        実行ログで自動補正されます。初期値は粗い推定です。
      </p>
    </section>
  );
}

function Stat({
  label,
  main,
  unit,
}: {
  label: string;
  main: string;
  unit: string;
}) {
  return (
    <div className="rounded-xl bg-cream-50/80 px-3 py-2">
      <div className="text-[10px] font-medium text-ink-500">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span className="text-[14px] font-bold tabular-nums text-ink-900">
          {main}
        </span>
        <span className="text-[10px] font-medium text-ink-500">{unit}</span>
      </div>
    </div>
  );
}
