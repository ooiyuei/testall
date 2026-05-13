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
};

export type UnitInput = {
  unit: string;
  correct: number;
  total: number;
  cause?: MissCause;
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
