// 計画AI v0.1 — 共通型
//
// 設計の中心:
//   志望校 → ギャップ → 必要学習量 → 週次目標 → 今日のブロック数
//
// 重要な前提:
//   - 計画の最小単位は 45分ブロック
//   - 偏差値は score_source_type / provider で区別する
//   - 毎週「最低ライン」と「余力ライン」を分ける

import type { SubjectAreaId } from "../master/subjects";

// ── 偏差値ソース ─────────────────────────────
export type ScoreSourceType =
  | "national_mock"   // 全国模試
  | "school_test"     // 校内テスト
  | "prep_school_test" // 塾内テスト
  | "self_estimate";  // 自己申告

export type DeviationSnapshot = {
  // 1 ポイント = 偏差値小数点1桁
  value: number;
  scoreSourceType: ScoreSourceType;
  provider?: string;
  gradeLevel: "h1" | "h2" | "h3" | "ronin";
  subjectArea?: SubjectAreaId; // 未指定なら総合
  dateISO: string; // YYYY-MM-DD
  confidence: 0 | 1 | 2 | 3; // 0=粗い自己申告 / 3=信頼できる模試
  note?: string;
};

// ── プランニング用プロフィール ───────────────
export type PlanningProfile = {
  // 通常ブロック設定
  weekdayBaseBlocks: number;   // 平日通常 (例: 3)
  weekendBaseBlocks: number;   // 休日通常 (例: 6)
  // 帰宅・就寝
  defaultReturnTime: string;   // "18:30"
  defaultBedtime: string;      // "24:00"
  bufferMinutes: number;       // 食事・風呂・休憩などの固定 (例: 90)
  // 学習スタイル
  studyQuality?: number;       // 学習品質係数 (0.4〜1.5)
  retentionFactor?: number;    // 定着係数
  // 部活/塾
  hasClubActivity?: boolean;
  prepSchoolDays?: string[];   // ["月","水"] など
};

// ── 志望校ターゲット ─────────────────────────
export type ExamMethod = "ippan" | "kyotsu" | "ao" | "suisen";

export type UniversityTarget = {
  universityId: string;
  faculty?: string;
  examMethod?: ExamMethod;
  priority: 1 | 2 | 3;
  examDate?: string;             // YYYY-MM-DD
  // 目標偏差値 3 段階
  borderDeviation: number;       // 50% ライン
  safeDeviation: number;         // 安定合格
  stretchDeviation: number;      // 上振れ
};

// ── ギャップ ─────────────────────────────
export type SubjectGap = {
  area: SubjectAreaId;
  currentDeviation: number;
  targetDeviation: number;
  gap: number;
  examWeight: number;     // 入試での重要度 0〜1
  remainingWeeks: number;
};

export type GapResult = {
  subjects: SubjectGap[];
  priorityScores: { area: SubjectAreaId; score: number }[];
  totalRequiredHours: { lower: number; upper: number };
};

// ── 必要学習量 ───────────────────────────
export type RequiredBlocksResult = {
  totalRequiredHours: { lower: number; upper: number };
  pastEffectiveHours: number;
  futureRequiredHours: { lower: number; upper: number };
  perSubject: {
    area: SubjectAreaId;
    hoursLower: number;
    hoursUpper: number;
    blocksLower: number;
    blocksUpper: number;
  }[];
  weeklyRequiredBlocks: { lower: number; upper: number };
  riskLevel: "realistic" | "stretch" | "high-load" | "exam-focus" | "unrealistic";
};

// ── 今日のブロック ──────────────────────────
export type Mood = "less" | "normal" | "more" | "max";

export const MOOD_DELTA: Record<Mood, number> = {
  less: -2,
  normal: 0,
  more: +2,
  max: +4,
};

export type ReturnTimeKind =
  | "usual"
  | "earlier"
  | "later"
  | "custom";

export type TodayBlocksInput = {
  baseBlocks: number;            // 曜日別 通常
  mood: Mood;
  returnTime: string;            // "18:30"
  bedtime: string;               // "24:00"
  bufferMinutes: number;
  blockMinutes?: number;         // 既定 55 (45分学習+10分休憩)
};

export type TodayBlocksResult = {
  baseBlocks: number;
  moodDelta: number;
  requestedBlocks: number;
  availableBlocks: number;
  finalBlocks: number;
  reason: string;
};

// ── 週次計画 ─────────────────────────────
export type WeeklyGoal = {
  weekStartISO: string;          // 日曜開始（YYYY-MM-DD）
  targetBlocks: number;          // 標準ライン
  minimumBlocks: number;         // 最低ライン
  stretchBlocks: number;         // 余力ライン
  subjectAllocation: { area: SubjectAreaId; blocks: number }[];
  focusUnits?: string[];         // 重点 unit id
  notes?: string;
};

export type WeeklyPlanInput = {
  goal: WeeklyGoal;
  weekdayBlocks: number;
  weekendBlocks: number;
  testEvents?: { date: string; title: string }[]; // 期限が近いテスト
};

export type DayPlanItem = {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  date?: string;
  blocks: number;
  subjects: SubjectAreaId[];
  note?: string;
  isBuffer?: boolean;
};

export type WeeklyPlanResult = {
  goal: WeeklyGoal;
  days: DayPlanItem[];
  totalAllocated: number;
  bufferBlocks: number;
};

// ── 振り返り ─────────────────────────────
export type WeeklyExecutionLog = {
  weekStartISO: string;
  completedBlocks: number;
  byArea: { area: SubjectAreaId; completed: number }[];
  uncompleted: string[]; // タスク名 or unit id
  comprehension?: "low" | "mid" | "high";
};

export type WeeklyReview = {
  weekStartISO: string;
  achievementRate: number;        // 0〜1.5+
  trend: "behind" | "on-track" | "ahead";
  recommendation: "increase" | "maintain" | "decrease" | "stabilize";
  nextWeekTargetBlocks: number;
  notes: string[];
};
