// テスト結果から profile.deviation / deviationByArea を自動補正
//
// 直近 3 テストの偏差値平均を取って、現在偏差値を更新する。
// score/fullScore から推定偏差値を作る (deviation 未設定時)。

import type { StoredProfile } from "./store";
import type { TestInput, SubjectInput } from "./types";
import type { DeviationBucket } from "./store";
import { DEVIATION_BUCKETS, bucketMid } from "./store";
import { guessArea } from "./master/subjects/guessArea";
import type { SubjectAreaId } from "./master/subjects";

// 得点率 → 偏差値の粗い推定 (50% → 50, 80% → 60, 95% → 65)
function scorePctToDeviation(pct: number): number {
  const clamped = Math.max(0, Math.min(100, pct));
  return Math.round(35 + clamped * 0.3);
}

function deviationToBucket(v: number): DeviationBucket {
  if (v < 45) return "lt45";
  if (v < 50) return "45-50";
  if (v < 55) return "50-55";
  if (v < 60) return "55-60";
  if (v < 65) return "60-65";
  if (v < 70) return "65-70";
  if (v < 75) return "70-75";
  return "gte75";
}

/** テスト1件から、教科ごとの推定偏差値マップを返す */
export function deriveDeviationFromTest(
  input: TestInput,
): Partial<Record<SubjectAreaId, number>> {
  const out: Partial<Record<SubjectAreaId, number>> = {};

  // subjects[] があれば各科目で
  if (input.subjects && input.subjects.length > 0) {
    for (const s of input.subjects) {
      const area = guessArea(s.subjectName);
      const dev = s.fullScore > 0
        ? scorePctToDeviation((s.score / s.fullScore) * 100)
        : undefined;
      if (dev !== undefined) {
        // 同じ area で複数科目あれば平均
        const prev = out[area];
        out[area] = prev ? Math.round((prev + dev) / 2) : dev;
      }
    }
  } else {
    // 互換: subject 文字列のみ
    const area = guessArea(input.subject);
    const dev =
      input.deviation ??
      (input.fullScore > 0
        ? scorePctToDeviation((input.score / input.fullScore) * 100)
        : undefined);
    if (dev !== undefined) out[area] = dev;
  }
  return out;
}

/** 直近 N 件のテストから profile を補正した新しいオブジェクトを返す */
export function updateProfileFromTests(
  profile: StoredProfile | undefined,
  tests: { input: TestInput; createdAt: string }[],
  maxRecent = 3,
): StoredProfile | undefined {
  if (!profile) return profile;
  if (tests.length === 0) return profile;

  // 直近 N 件
  const recent = [...tests]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, maxRecent);

  // 教科ごとに集計
  const sums: Partial<Record<SubjectAreaId, { sum: number; count: number }>> = {};
  for (const t of recent) {
    const derived = deriveDeviationFromTest(t.input);
    for (const [area, dev] of Object.entries(derived)) {
      const a = area as SubjectAreaId;
      if (dev === undefined) continue;
      const cur = sums[a] ?? { sum: 0, count: 0 };
      sums[a] = { sum: cur.sum + dev, count: cur.count + 1 };
    }
  }

  const newByArea: Partial<Record<SubjectAreaId, DeviationBucket>> = {
    ...(profile.deviationByArea ?? {}),
  };
  const devValues: number[] = [];
  for (const [a, agg] of Object.entries(sums)) {
    if (!agg || agg.count === 0) continue;
    const avg = Math.round(agg.sum / agg.count);
    devValues.push(avg);
    newByArea[a as SubjectAreaId] = deviationToBucket(avg);
  }

  // 全体平均
  const overallAvg =
    devValues.length > 0
      ? Math.round(devValues.reduce((a, b) => a + b, 0) / devValues.length)
      : profile.deviation;

  return {
    ...profile,
    deviation: overallAvg ?? profile.deviation,
    deviationBucket: overallAvg ? deviationToBucket(overallAvg) : profile.deviationBucket,
    deviationByArea: newByArea,
  };
}

// 互換: bucketMid を再エクスポート (UI で使いやすく)
export { bucketMid, DEVIATION_BUCKETS };
