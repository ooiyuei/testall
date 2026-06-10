export type TestInput = {
  grade: string;
  target: string;
  examDate: string;
  subject: string;
  testName: string;
  score: number;
  fullScore: number;
  units: UnitInput[];
  availableMinutesPerDay: number;
  textbooks: string[];
  // v0.3 拡張
  deviation?: number;
  schoolName?: string;
  weekdayMinutes?: number;
  weekendMinutes?: number;
  targetUniversities?: { universityId: string; faculty?: string }[];
  // v0.4 拡張：複数科目を1テストで管理
  testKindId?: string;
  testDate?: string; // YYYY-MM-DD
  scope?: string; // テスト範囲 (任意) 例: "数列〜ベクトル、教科書p.45-89"
  subjects?: SubjectInput[]; // 複数科目それぞれ点数・単元

  // v0.5 拡張: 診断の文脈データ (AI 精度向上のため)
  history?: {
    pastTests?: PastTestSummary[]; // 直近 3〜5 回のテスト概要
    recentBlockLogs?: { date: string; subject?: string; rating: number }[];
    bookshelf?: { name: string; kind?: string }[];
  };
};

export type PastTestSummary = {
  testName: string;
  subject: string;
  scorePct: number;       // 0..100
  deviation?: number;
  createdAt: string;      // ISO date
  weakUnits?: string[];
};

export type SubjectInput = {
  subjectId: string;
  subjectName: string;
  score: number;
  fullScore: number;
  // v0.5 拡張: 科目別偏差値 (任意)
  deviation?: number;
  units: UnitInput[];
  // 配点や計算問題区分などの任意詳細
  partition?: { label: string; score: number; fullScore: number }[];
};

export type UnitInput = {
  unit: string;
  correct: number;
  total: number;
  cause?: MissCause;
  // v0.5 拡張: 出題形式 + 1問の配点
  format?: string;       // QuestionFormat (NewTestForm 側で定義)
  pointValue?: number;   // 1問あたり配点
};

export type MissCause =
  | "knowledge" // 知識不足
  | "understanding" // 理解不足
  | "time" // 時間不足
  | "careless"; // ケアレスミス

export type Diagnosis = {
  summary: string;
  level: string;
  gap: string;
  weaknesses: Weakness[];
  strengths: string[];
  textbookPlan: TextbookRec[];
  weekPlan: DayPlan[];
  todayBlocks: Block[];
  encouragement: string;
};

export type Weakness = {
  unit: string;
  cause: MissCause;
  severity: "high" | "mid" | "low";
  reason: string;
  recovery: string;
};

export type TextbookRec = {
  name: string;
  units: string[];
  pace: string;
  reps: string;
};

export type DayPlan = {
  day: string;
  focus: string;
  subjects: string[];
  blocks: number;
};

export type Block = {
  startTime: string;
  endTime: string;
  subject: string;
  topic: string;
  source: string;
  goal: string;
  completion: string;
};
