// 偏差値ギャップ → 必要有効学習時間 テーブル
//
// 設計仕様 §18.5 + §19.3 を実装。
// このモデルは絶対値ではなく初期推定値で、ユーザーの実行ログで補正される。
//
// 単位: 有効学習時間 (時間)。1ブロック = 0.75時間。

// ── 5偏差値帯ごとの 1pt 上昇に必要な有効時間 (時間) ──
// 例: 55→60 の 1pt = 50〜75h
export const HOURS_PER_POINT: { range: [number, number]; lower: number; upper: number }[] = [
  { range: [40, 45], lower: 30, upper: 50 },
  { range: [45, 50], lower: 35, upper: 55 },
  { range: [50, 55], lower: 40, upper: 60 },
  { range: [55, 60], lower: 50, upper: 75 },
  { range: [60, 65], lower: 80, upper: 120 },
  { range: [65, 70], lower: 140, upper: 220 },
  { range: [70, 75], lower: 220, upper: 350 },
  { range: [75, 80], lower: 350, upper: 500 },
];

// ── 現在偏差値 → 目標偏差値 必要時間表 ──
// §19.3 に基づく。NULL は不要(現在 ≥ 目標)。
export type EffortRange = { lower: number; upper: number };

const TABLE: Record<number, Record<number, EffortRange>> = {
  45: {
    50: { lower: 175, upper: 275 },
    55: { lower: 375, upper: 575 },
    60: { lower: 625, upper: 950 },
    65: { lower: 1025, upper: 1550 },
    70: { lower: 1725, upper: 2650 },
    75: { lower: 2825, upper: 4400 },
  },
  50: {
    55: { lower: 200, upper: 300 },
    60: { lower: 450, upper: 675 },
    65: { lower: 850, upper: 1275 },
    70: { lower: 1550, upper: 2375 },
    75: { lower: 2650, upper: 4125 },
  },
  55: {
    60: { lower: 250, upper: 375 },
    65: { lower: 650, upper: 975 },
    70: { lower: 1350, upper: 2075 },
    75: { lower: 2450, upper: 3825 },
  },
  60: {
    65: { lower: 400, upper: 600 },
    70: { lower: 1100, upper: 1700 },
    75: { lower: 2200, upper: 3450 },
  },
  65: {
    70: { lower: 700, upper: 1100 },
    75: { lower: 1800, upper: 2850 },
  },
  70: {
    75: { lower: 1100, upper: 1750 },
  },
};

// 補間: テーブル外/中間の偏差値も扱う
function bucket5(x: number): number {
  return Math.round(x / 5) * 5;
}

export function lookupRequiredHours(current: number, target: number): EffortRange {
  if (target <= current) return { lower: 0, upper: 0 };
  const c = Math.max(40, Math.min(75, bucket5(current)));
  const t = Math.max(c + 5, Math.min(75, bucket5(target)));
  const direct = TABLE[c]?.[t];
  if (direct) return direct;
  // 累積で補間: c→c+5, c+5→c+10, ... を足す
  let lo = 0;
  let hi = 0;
  for (let p = c; p < t; p += 5) {
    const seg = TABLE[p]?.[p + 5];
    if (seg) {
      lo += seg.lower;
      hi += seg.upper;
    }
  }
  return { lower: lo, upper: hi };
}

// ── 学習品質係数 ──
export type StudyQuality =
  | "video-only"
  | "read-only"
  | "drill"
  | "review"
  | "self-recall"
  | "past-exam";

export const QUALITY_FACTOR: Record<StudyQuality, [number, number]> = {
  "video-only": [0.3, 0.5],
  "read-only":  [0.4, 0.6],
  drill:        [0.8, 1.0],
  review:       [1.0, 1.2],
  "self-recall":[1.2, 1.5],
  "past-exam":  [1.2, 1.5],
};

// ── 定着係数 ──
export type Retention =
  | "answer-seen"
  | "solved-here"
  | "solved-tomorrow"
  | "solved-week-later";

export const RETENTION_FACTOR: Record<Retention, [number, number]> = {
  "answer-seen":      [0.4, 0.6],
  "solved-here":      [0.7, 0.9],
  "solved-tomorrow":  [1.0, 1.2],
  "solved-week-later":[1.2, 1.4],
};

// ── 直近性係数 ──
export function recencyFactor(monthsAgo: number): number {
  if (monthsAgo <= 1) return 1.0;
  if (monthsAgo <= 3) return 0.8;
  if (monthsAgo <= 6) return 0.6;
  return 0.4;
}

// ── 週負荷判定 ──
export function weekLoadJudgement(hoursPerWeek: number):
  | "realistic"
  | "stretch"
  | "high-load"
  | "exam-focus"
  | "unrealistic" {
  if (hoursPerWeek <= 15) return "realistic";
  if (hoursPerWeek <= 25) return "stretch";
  if (hoursPerWeek <= 40) return "high-load";
  if (hoursPerWeek <= 55) return "exam-focus";
  return "unrealistic";
}

export const WEEK_LOAD_LABEL: Record<ReturnType<typeof weekLoadJudgement>, string> = {
  realistic: "現実的",
  stretch: "かなり努力が必要",
  "high-load": "高負荷。生活設計が必要",
  "exam-focus": "受験専念レベル",
  unrealistic: "かなり危険。目標・期間・戦略の再検討が必要",
};

// ── 学年別の標準的な残り月数 ──
export function defaultRemainingMonths(grade: "h1" | "h2" | "h3" | "ronin"): number {
  if (grade === "h1") return 30;
  if (grade === "h2") return 18;
  if (grade === "h3") return 10;
  return 12;
}
