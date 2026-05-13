// 必要学習量の推定
//
// estimateRequiredBlocks():
//   ギャップ・能力値・参考書進捗・残り週数 → 必要ブロック数
//
// 過去の有効学習時間 = 学習時間 × 学習品質 × 定着 × 直近性

import type { SubjectAreaId } from "../master/subjects";
import type {
  GapResult,
  RequiredBlocksResult,
} from "./types";
import {
  QUALITY_FACTOR,
  RETENTION_FACTOR,
  recencyFactor,
  weekLoadJudgement,
  type Retention,
  type StudyQuality,
} from "./effort-table";

const HOURS_PER_BLOCK = 0.75;

export type PastSession = {
  area?: SubjectAreaId;
  hours: number;
  quality: StudyQuality;
  retention: Retention;
  monthsAgo: number;
};

export function effectiveHoursOf(session: PastSession): number {
  const [qa, qb] = QUALITY_FACTOR[session.quality];
  const [ra, rb] = RETENTION_FACTOR[session.retention];
  const q = (qa + qb) / 2;
  const r = (ra + rb) / 2;
  const rec = recencyFactor(session.monthsAgo);
  return session.hours * q * r * rec;
}

export type Input = {
  gap: GapResult;
  remainingWeeks: number;
  pastSessions?: PastSession[];
  realisticWeeklyBlocks?: number; // 現実上限
};

export function estimateRequiredBlocks(input: Input): RequiredBlocksResult {
  const past = (input.pastSessions ?? []).reduce(
    (sum, s) => sum + effectiveHoursOf(s),
    0,
  );

  const total = input.gap.totalRequiredHours;
  const futureLower = Math.max(0, total.lower - past);
  const futureUpper = Math.max(0, total.upper - past);

  // 科目別配分（ギャップ × 配点重みで重み付け）
  const totalScore = input.gap.subjects.reduce(
    (s, x) => s + x.gap * x.examWeight,
    0,
  );

  const perSubject = input.gap.subjects.map((s) => {
    const w = totalScore > 0 ? (s.gap * s.examWeight) / totalScore : 0;
    const hLower = Math.round(futureLower * w);
    const hUpper = Math.round(futureUpper * w);
    return {
      area: s.area,
      hoursLower: hLower,
      hoursUpper: hUpper,
      blocksLower: Math.round(hLower / HOURS_PER_BLOCK),
      blocksUpper: Math.round(hUpper / HOURS_PER_BLOCK),
    };
  });

  const weeks = Math.max(1, input.remainingWeeks);
  const weeklyRequiredHoursLower = futureLower / weeks;
  const weeklyRequiredHoursUpper = futureUpper / weeks;

  const weeklyRequiredBlocks = {
    lower: Math.round(weeklyRequiredHoursLower / HOURS_PER_BLOCK),
    upper: Math.round(weeklyRequiredHoursUpper / HOURS_PER_BLOCK),
  };

  // 判定は中央値で行う
  const weeklyMid = (weeklyRequiredHoursLower + weeklyRequiredHoursUpper) / 2;
  const riskLevel = weekLoadJudgement(weeklyMid);

  return {
    totalRequiredHours: total,
    pastEffectiveHours: Math.round(past),
    futureRequiredHours: {
      lower: Math.round(futureLower),
      upper: Math.round(futureUpper),
    },
    perSubject,
    weeklyRequiredBlocks,
    riskLevel,
  };
}
