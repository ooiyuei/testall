// Client-only persistence layer backed by sessionStorage.
// TODO: 実データに置き換え（Supabase 接続後）

import type { Diagnosis, TestInput } from "./types";

export type TargetUniversity = {
  universityId: string;
  faculty?: string;
  priority: 1 | 2 | 3; // 第1〜3志望
  examType?: string; // 一般 / 共通テスト / 総合型 / 推薦
};

export type StoredProfile = {
  // 識別
  name?: string;
  schoolName?: string;
  // 学習プロフィール
  grade: string;
  deviation?: number; // 全国偏差値（おおよそ）
  // 志望校
  target: string; // 旧フィールド（互換維持）。新規は targetUniversities を使う。
  targetUniversities?: TargetUniversity[];
  examDate: string;
  // 勉強時間
  availableMinutesPerDay: number; // 旧フィールド（平均）。新規は weekday/weekend で取る。
  weekdayMinutes?: number;
  weekendMinutes?: number;
  // 所有資材
  textbooks: string[];
  // 完了フラグ
  onboardedAt?: string;
};

export type StoredTest = {
  id: string;
  createdAt: string;
  input: TestInput;
  diagnosis: Diagnosis;
};

export type BlockLog = {
  testId: string;
  blockIdx: number;
  completedAt: string;
  rating: number;
  note?: string;
  durationSec: number;
};

export type CalendarEventKind =
  | "regular-test" // 定期テスト
  | "mock-exam" // 模試
  | "deadline" // 出願・期限
  | "study" // 学習予定
  | "other";

export type CalendarEvent = {
  id: string;
  kind: CalendarEventKind;
  title: string;
  date: string; // YYYY-MM-DD
  endDate?: string; // 連日イベント
  note?: string;
  subject?: string;
};

export type StoreState = {
  profile?: StoredProfile;
  tests: StoredTest[];
  blockLogs: BlockLog[];
  events?: CalendarEvent[];
};

const STORAGE_KEY = "testall:v1";

const EMPTY_STATE: StoreState = {
  tests: [],
  blockLogs: [],
  events: [],
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

export function readStore(): StoreState {
  if (!isBrowser()) return EMPTY_STATE;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as StoreState;
    return {
      profile: parsed.profile,
      tests: Array.isArray(parsed.tests) ? parsed.tests : [],
      blockLogs: Array.isArray(parsed.blockLogs) ? parsed.blockLogs : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    return EMPTY_STATE;
  }
}

function writeStore(next: StoreState): StoreState {
  if (!isBrowser()) return next;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("testall:store"));
  return next;
}

export function setProfile(profile: StoredProfile): StoreState {
  const current = readStore();
  return writeStore({ ...current, profile });
}

export function saveTest(test: StoredTest): StoreState {
  const current = readStore();
  const filtered = current.tests.filter((t) => t.id !== test.id);
  return writeStore({
    ...current,
    tests: [test, ...filtered],
  });
}

export function deleteTest(id: string): StoreState {
  const current = readStore();
  return writeStore({
    ...current,
    tests: current.tests.filter((t) => t.id !== id),
    blockLogs: current.blockLogs.filter((b) => b.testId !== id),
  });
}

export function getTest(id: string): StoredTest | undefined {
  return readStore().tests.find((t) => t.id === id);
}

export function getLatestTest(): StoredTest | undefined {
  return readStore().tests[0];
}

export function logBlock(log: BlockLog): StoreState {
  const current = readStore();
  const filtered = current.blockLogs.filter(
    (b) => !(b.testId === log.testId && b.blockIdx === log.blockIdx),
  );
  return writeStore({
    ...current,
    blockLogs: [log, ...filtered],
  });
}

export function getBlockLog(testId: string, blockIdx: number): BlockLog | undefined {
  return readStore().blockLogs.find(
    (b) => b.testId === testId && b.blockIdx === blockIdx,
  );
}

export function getTodayLogs(): BlockLog[] {
  const today = new Date().toDateString();
  return readStore().blockLogs.filter(
    (b) => new Date(b.completedAt).toDateString() === today,
  );
}

// Streak: count consecutive days that have at least one logged block,
// ending today (or yesterday — still valid until midnight tonight).
export function getStreak(): number {
  const logs = readStore().blockLogs;
  if (logs.length === 0) return 0;

  const dateSet = new Set(
    logs.map((b) => new Date(b.completedAt).toDateString()),
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Allow grace: if today has no log yet but yesterday does, start from yesterday.
  let cursor = new Date(today);
  if (!dateSet.has(cursor.toDateString())) {
    cursor.setDate(cursor.getDate() - 1);
    if (!dateSet.has(cursor.toDateString())) return 0;
  }

  let count = 0;
  while (dateSet.has(cursor.toDateString())) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export function clearAll(): StoreState {
  return writeStore(EMPTY_STATE);
}

// ── イベント（定期テスト・模試など） ──

export function listEvents(): CalendarEvent[] {
  return readStore().events ?? [];
}

export function saveEvent(event: CalendarEvent): StoreState {
  const current = readStore();
  const events = current.events ?? [];
  const filtered = events.filter((e) => e.id !== event.id);
  return writeStore({
    ...current,
    events: [event, ...filtered].sort((a, b) => a.date.localeCompare(b.date)),
  });
}

export function deleteEvent(id: string): StoreState {
  const current = readStore();
  return writeStore({
    ...current,
    events: (current.events ?? []).filter((e) => e.id !== id),
  });
}

// ── 5科目実力パラメーター（テスト履歴から自動計算） ──

export type SubjectStrength = {
  category: string;
  recentPct: number;
  bestPct: number;
  count: number;
  // 0-100 の bar 値（recentPctを基本に、テスト数が増えれば信頼度↑）
  bar: number;
};

function categoryFromSubjectName(name: string): string {
  if (/数学|数IA|数IIBC|数IIIC/.test(name)) return "math";
  if (/英語|英コミュ|英表現/.test(name)) return "english";
  if (/国語|現代文|古典|古文|漢文/.test(name)) return "japanese";
  if (/物理|化学|生物|地学|理科/.test(name)) return "science";
  if (/日史|世史|地理|歴総|地総|政経|倫理|公共|社会|日本史|世界史/.test(name))
    return "social";
  if (/情報/.test(name)) return "info";
  return "other";
}

export function getSubjectStrengths(): SubjectStrength[] {
  const tests = readStore().tests;
  const buckets: Record<string, { pcts: number[]; recentTs: number }> = {};
  for (const t of tests) {
    const cat = categoryFromSubjectName(t.input.subject);
    const pct = Math.round((t.input.score / t.input.fullScore) * 100);
    const ts = new Date(t.createdAt).getTime();
    if (!buckets[cat]) buckets[cat] = { pcts: [], recentTs: 0 };
    buckets[cat].pcts.push(pct);
    if (ts > buckets[cat].recentTs) buckets[cat].recentTs = ts;
  }
  return Object.entries(buckets).map(([category, b]) => {
    const recent = b.pcts[0] ?? 0;
    const best = b.pcts.reduce((m, v) => Math.max(m, v), 0);
    return {
      category,
      recentPct: recent,
      bestPct: best,
      count: b.pcts.length,
      bar: recent,
    };
  });
}
