// 志望校ギャップ算出
//
// estimateGoalGap(): 志望校偏差値・現在偏差値・科目別成績 → 科目ごとのギャップ
//
// 優先度スコア:
//   priority = gap × entrance_weight × weakness_score × urgency / required_effort

import type { SubjectAreaId } from "../master/subjects";
import type {
  DeviationSnapshot,
  GapResult,
  SubjectGap,
  UniversityTarget,
} from "./types";
import { lookupRequiredHours } from "./effort-table";

// 大学・方式ごとの科目重みは別途データ化が必要だが、初期は一律重みで実装
const DEFAULT_EXAM_WEIGHT: Record<SubjectAreaId, number> = {
  japanese: 0.20,
  math: 0.25,
  english: 0.30,
  science: 0.15,
  history: 0.15,
  civics: 0.05,
  info: 0.05,
};

type Input = {
  targets: UniversityTarget[];
  currentTotal?: number;                     // 総合偏差値
  currentByArea: Partial<Record<SubjectAreaId, DeviationSnapshot>>;
  remainingWeeks: number;
};

export function estimateGoalGap(input: Input): GapResult {
  const top = input.targets[0];
  if (!top) {
    return {
      subjects: [],
      priorityScores: [],
      totalRequiredHours: { lower: 0, upper: 0 },
    };
  }

  const targetDev = top.borderDeviation;
  const areas: SubjectAreaId[] = [
    "japanese",
    "math",
    "english",
    "science",
    "history",
    "civics",
    "info",
  ];

  const subjects: SubjectGap[] = areas
    .map((area): SubjectGap | null => {
      const snap = input.currentByArea[area];
      const current = snap?.value ?? input.currentTotal;
      if (current === undefined) return null;
      const weight = DEFAULT_EXAM_WEIGHT[area];
      // 入試で使わない可能性が高い科目は外す
      if (weight === undefined) return null;
      return {
        area,
        currentDeviation: current,
        targetDeviation: targetDev,
        gap: Math.max(0, targetDev - current),
        examWeight: weight,
        remainingWeeks: input.remainingWeeks,
      };
    })
    .filter((s): s is SubjectGap => s !== null);

  // 全科目合計の必要時間（粗推定）
  let lower = 0;
  let upper = 0;
  for (const s of subjects) {
    const r = lookupRequiredHours(s.currentDeviation, s.targetDeviation);
    // 配点重みで按分
    lower += r.lower * s.examWeight;
    upper += r.upper * s.examWeight;
  }

  // 優先度スコア
  const priorityScores = subjects
    .map((s) => {
      const r = lookupRequiredHours(s.currentDeviation, s.targetDeviation);
      const required = Math.max(1, (r.lower + r.upper) / 2);
      const weakness = 1 + s.gap / 15;
      const urgency = clamp(1 + (52 - input.remainingWeeks) / 26, 0.5, 2);
      const score = (s.gap * s.examWeight * weakness * urgency) / Math.sqrt(required);
      return { area: s.area, score: round(score, 2) };
    })
    .sort((a, b) => b.score - a.score);

  return {
    subjects,
    priorityScores,
    totalRequiredHours: { lower: Math.round(lower), upper: Math.round(upper) },
  };
}

// ── 現在地に応じた段階目標を出す ──
// §18.8 のように一直線にせず、四半期ごとの目標を提示
export type StagedTarget = {
  monthsAhead: number;
  expectedDeviation: number;
  label: string;
};

export function stagedTargets(
  currentDeviation: number,
  targetDeviation: number,
  totalMonths: number,
): StagedTarget[] {
  if (totalMonths <= 0) return [];
  const stages = Math.min(Math.ceil(totalMonths / 3), 8);
  const out: StagedTarget[] = [];
  for (let i = 1; i <= stages; i++) {
    const months = Math.round((totalMonths * i) / stages);
    const progress = i / stages;
    // 序盤はゆるく、終盤に近づくほど勾配が緩やかになるカーブ
    const eased = 1 - Math.pow(1 - progress, 1.5);
    const dev =
      currentDeviation + (targetDeviation - currentDeviation) * eased;
    out.push({
      monthsAhead: months,
      expectedDeviation: round(dev, 1),
      label: `${months}ヶ月後: 偏差値 ${round(dev, 1)} 目安`,
    });
  }
  return out;
}

// ── ユーティリティ ──
function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

function round(x: number, digits: number): number {
  const m = Math.pow(10, digits);
  return Math.round(x * m) / m;
}
