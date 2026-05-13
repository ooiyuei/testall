// 週次計画の生成
//
// generateWeeklyPlan():
//   今週の目標ブロック数 + 科目優先度 → 曜日別配分
//
// ルール:
//   - 平日5日 + 休日2日
//   - 日曜は予備日（実行 0 〜 軽め）
//   - 平均 20〜30% を予備に残す
//   - 重点科目を平日に厚く

import type {
  WeeklyPlanInput,
  WeeklyPlanResult,
  DayPlanItem,
} from "./types";
import type { SubjectAreaId } from "../master/subjects";

const DAY_ORDER: DayPlanItem["day"][] = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

export function generateWeeklyPlan(input: WeeklyPlanInput): WeeklyPlanResult {
  const { goal, weekdayBlocks, weekendBlocks } = input;

  // 日曜は予備日として 1〜2 ブロック残す
  const dayBlocks = DAY_ORDER.map((d) => {
    if (d === "Sun") return Math.max(0, Math.min(2, Math.floor(weekendBlocks / 3)));
    if (d === "Sat") return weekendBlocks;
    return weekdayBlocks;
  });
  const baseSum = dayBlocks.reduce((a, b) => a + b, 0);
  const target = goal.targetBlocks;

  // 目標が baseSum を超える場合 → 各日に均等に上乗せ
  // 目標が下回る場合 → 後ろから減らす
  let diff = target - baseSum;
  const finalBlocks = [...dayBlocks];
  if (diff > 0) {
    let i = 0;
    while (diff > 0) {
      // 日曜は予備優先で増やしすぎない
      if (DAY_ORDER[i % 7] !== "Sun") {
        finalBlocks[i % 7] += 1;
        diff -= 1;
      }
      i += 1;
      if (i > 100) break;
    }
  } else if (diff < 0) {
    for (let i = 6; i >= 0 && diff < 0; i--) {
      while (finalBlocks[i] > 0 && diff < 0) {
        finalBlocks[i] -= 1;
        diff += 1;
      }
    }
  }

  // 科目配分: 優先順位に従って日ごとにシャッフル
  const allocation = [...goal.subjectAllocation].sort(
    (a, b) => b.blocks - a.blocks,
  );

  const days: DayPlanItem[] = DAY_ORDER.map((d, idx) => {
    const blocks = finalBlocks[idx];
    if (blocks === 0) {
      return { day: d, blocks: 0, subjects: [], isBuffer: d === "Sun", note: d === "Sun" ? "予備・復習" : "" };
    }
    const subjects = pickSubjectsForDay(allocation, idx, blocks);
    return {
      day: d,
      blocks,
      subjects,
      isBuffer: d === "Sun" && blocks <= 2,
    };
  });

  const totalAllocated = finalBlocks.reduce((a, b) => a + b, 0);
  const bufferBlocks = Math.max(
    0,
    Math.round(target * 0.2), // 全体の 20% は予備として確保推奨
  );

  return {
    goal,
    days,
    totalAllocated,
    bufferBlocks,
  };
}

// dayIdx % allocation.length で 1 ブロックずつ取りに行く
function pickSubjectsForDay(
  allocation: { area: SubjectAreaId; blocks: number }[],
  dayIdx: number,
  blocks: number,
): SubjectAreaId[] {
  if (allocation.length === 0) return [];
  const picked: SubjectAreaId[] = [];
  for (let i = 0; i < blocks; i++) {
    const idx = (dayIdx + i) % allocation.length;
    picked.push(allocation[idx].area);
  }
  return picked;
}

// ── 週次目標を作る（目標時間+優先度から） ──
export function buildWeeklyGoal(args: {
  weekStartISO: string;
  requiredWeeklyBlocks: { lower: number; upper: number };
  realisticWeeklyBlocks: number;
  priority: { area: SubjectAreaId; score: number }[];
}): import("./types").WeeklyGoal {
  // 標準は required の中央値と realistic の小さい方
  const standard = Math.min(
    Math.round((args.requiredWeeklyBlocks.lower + args.requiredWeeklyBlocks.upper) / 2),
    args.realisticWeeklyBlocks,
  );
  const minimum = Math.max(1, Math.round(standard * 0.7));
  const stretch = Math.max(standard, Math.round(args.realisticWeeklyBlocks));

  // 優先度スコアで配分
  const totalPriority = args.priority.reduce((s, p) => s + p.score, 0) || 1;
  const allocation = args.priority
    .filter((p) => p.score > 0)
    .map((p) => ({
      area: p.area,
      blocks: Math.max(1, Math.round((standard * p.score) / totalPriority)),
    }));

  return {
    weekStartISO: args.weekStartISO,
    targetBlocks: standard,
    minimumBlocks: minimum,
    stretchBlocks: stretch,
    subjectAllocation: allocation,
  };
}
