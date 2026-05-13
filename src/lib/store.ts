// Client-only persistence layer backed by sessionStorage.
// TODO: 実データに置き換え（Supabase 接続後）

import type { Diagnosis, TestInput } from "./types";
import type {
  Mood,
  PlanningProfile,
  WeeklyExecutionLog,
  WeeklyGoal,
} from "./planning/types";

export type TargetUniversity = {
  universityId: string;
  faculty?: string;
  priority: 1 | 2 | 3; // 第1〜3志望
  examType?: string; // 一般 / 共通テスト / 総合型 / 推薦
};

// 5大教科ID
export type SubjectAreaId = "japanese" | "math" | "english" | "science" | "social";

export type StoredProfile = {
  // 識別
  name?: string;
  userId?: string;          // @12345 のような5桁番号 (生成)
  gender?: "male" | "female" | "other" | "na";
  birthdate?: string;       // YYYY-MM-DD
  prefecture?: string;
  schoolName?: string;
  // 学習プロフィール
  grade: string;
  deviation?: number;       // 全国偏差値（おおよそ）
  deviationBucket?: DeviationBucket; // 5刻み入力
  deviationByArea?: Partial<Record<SubjectAreaId, DeviationBucket>>; // 教科別偏差値帯
  // 志望校
  target: string;           // 旧フィールド（互換維持）。新規は targetUniversities を使う。
  targetUniversities?: TargetUniversity[];
  targetDeviationBucket?: DeviationBucket; // 5刻みの目標偏差値帯
  universityTypes?: ("national" | "public" | "private")[];           // 国立/公立/私立
  interestedFacultyCategories?: string[];                            // 学部カテゴリ複数
  examDate: string;
  // 勉強時間
  availableMinutesPerDay: number; // 旧フィールド（平均）。新規は weekday/weekend で取る。
  weekdayMinutes?: number;
  weekendMinutes?: number;
  // スケジュール
  wakeupTime?: string;       // "07:00"
  bedTime?: string;          // "23:00"
  returnTime?: string;       // "18:00" 帰宅時刻
  weekendDays?: ("sat" | "sat-half" | "sun" | "sun-half")[];
  // 得意・苦手
  proficiencyByArea?: Partial<Record<SubjectAreaId, "good" | "fair" | "weak" | "bad">>;
  // 所有資材
  textbooks: string[];      // 互換: テキスト名で保持
  bookshelfItems?: BookshelfItem[]; // 拡張版
  // 完了フラグ
  onboardedAt?: string;
};

export type DeviationBucket =
  | "lt45"
  | "45-50"
  | "50-55"
  | "55-60"
  | "60-65"
  | "65-70"
  | "70-75"
  | "gte75";

export const DEVIATION_BUCKETS: { id: DeviationBucket; label: string; mid: number }[] = [
  { id: "lt45", label: "〜45", mid: 42 },
  { id: "45-50", label: "45〜50", mid: 47 },
  { id: "50-55", label: "50〜55", mid: 52 },
  { id: "55-60", label: "55〜60", mid: 57 },
  { id: "60-65", label: "60〜65", mid: 62 },
  { id: "65-70", label: "65〜70", mid: 67 },
  { id: "70-75", label: "70〜75", mid: 72 },
  { id: "gte75", label: "75〜", mid: 77 },
];

export function bucketMid(b: DeviationBucket): number {
  return DEVIATION_BUCKETS.find((x) => x.id === b)?.mid ?? 50;
}

export type BookshelfItem = {
  id: string;
  name: string;
  kind: "textbook" | "school-textbook" | "workbook" | "past-exam" | "other";
  subjectArea?: string;
  progressPct?: number;
  reps?: number;
};

// ── タスク（TODO） ─────────────────────────
export type TaskTag = "homework" | "elective" | "qualification" | "added" | "other";

export type DueBucket = "today" | "tomorrow" | "this-week" | "someday";

export const DUE_LABEL: Record<DueBucket, string> = {
  today: "今日",
  tomorrow: "明日",
  "this-week": "今週",
  someday: "いつでも",
};

// 期日からデフォルトの優先度を導く
export function priorityFromDue(due: DueBucket): 1 | 2 | 3 {
  if (due === "today") return 1;
  if (due === "tomorrow") return 2;
  return 3; // this-week / someday
}

// 期日が迫ったタスクは優先度を自動 UP
// today はそのまま、tomorrow は本日を過ぎていれば 1
export function effectivePriority(task: StoredTask, today = new Date()): 1 | 2 | 3 {
  if (task.priority === 1) return 1;
  if (!task.due) return task.priority;
  const todayISO = today.toISOString().slice(0, 10);
  if (task.due === "today" || (task.dueDate && task.dueDate <= todayISO)) {
    return 1;
  }
  if (task.due === "tomorrow") {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (todayISO >= tomorrow.toISOString().slice(0, 10)) return 1;
    return 2;
  }
  return task.priority;
}

export type StoredTask = {
  id: string;
  title: string;
  blocks: number;         // 1〜 (1ブロック = 25分)
  tag: TaskTag;
  subjectArea?: string;   // SubjectAreaId
  priority: 1 | 2 | 3;    // 1=高
  due?: DueBucket;        // 期日カテゴリ
  dueDate?: string;       // 具体日 (任意, YYYY-MM-DD)
  status: "todo" | "doing" | "done";
  createdAt: string;
  completedAt?: string;
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

export type DailyMoodLog = {
  dateISO: string;            // YYYY-MM-DD
  mood: Mood;
  returnTime: string;         // "18:30"
  finalBlocks: number;
  reason: string;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

export type StoreState = {
  profile?: StoredProfile;
  planning?: PlanningProfile;
  tests: StoredTest[];
  blockLogs: BlockLog[];
  events?: CalendarEvent[];
  dailyMoodLogs?: DailyMoodLog[];
  weeklyGoals?: WeeklyGoal[];
  weeklyExecutions?: WeeklyExecutionLog[];
  tasks?: StoredTask[];
  chatMessages?: ChatMessage[];
};

const STORAGE_KEY = "testall:v1";

const EMPTY_STATE: StoreState = {
  tests: [],
  blockLogs: [],
  events: [],
  dailyMoodLogs: [],
  weeklyGoals: [],
  weeklyExecutions: [],
  tasks: [],
  chatMessages: [],
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
      planning: parsed.planning,
      tests: Array.isArray(parsed.tests) ? parsed.tests : [],
      blockLogs: Array.isArray(parsed.blockLogs) ? parsed.blockLogs : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
      dailyMoodLogs: Array.isArray(parsed.dailyMoodLogs)
        ? parsed.dailyMoodLogs
        : [],
      weeklyGoals: Array.isArray(parsed.weeklyGoals) ? parsed.weeklyGoals : [],
      weeklyExecutions: Array.isArray(parsed.weeklyExecutions)
        ? parsed.weeklyExecutions
        : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      chatMessages: Array.isArray(parsed.chatMessages) ? parsed.chatMessages : [],
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
  const todayISO = currentDayISO();
  return readStore().blockLogs.filter((b) => {
    return currentDayISO(new Date(b.completedAt)) === todayISO;
  });
}

// Streak: count consecutive days (6時リセット) that have at least one logged block.
export function getStreak(): number {
  const logs = readStore().blockLogs;
  if (logs.length === 0) return 0;

  const dateSet = new Set(
    logs.map((b) => currentDayISO(new Date(b.completedAt))),
  );

  const todayISO = currentDayISO();

  // Allow grace: if today has no log yet but yesterday does, start from yesterday.
  const [ty, tm, td] = todayISO.split("-").map(Number);
  const todayDate = new Date(ty, tm - 1, td);
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayISO = yesterdayDate.toISOString().slice(0, 10);

  let cursorISO = dateSet.has(todayISO)
    ? todayISO
    : dateSet.has(yesterdayISO)
      ? yesterdayISO
      : null;

  if (!cursorISO) return 0;

  let count = 0;
  const [cy, cm, cd] = cursorISO.split("-").map(Number);
  const cursor = new Date(cy, cm - 1, cd);
  while (dateSet.has(cursor.toISOString().slice(0, 10))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export function clearAll(): StoreState {
  return writeStore(EMPTY_STATE);
}

// ── プランニングプロフィール ─────────────────
export function setPlanning(planning: PlanningProfile): StoreState {
  const current = readStore();
  return writeStore({ ...current, planning });
}

// ── 日付ヘルパ（6時リセット） ────────────────
// 06:00 未満は「前日」扱いにする。
export function currentDayISO(now = new Date()): string {
  const d = new Date(now);
  if (d.getHours() < 6) {
    d.setDate(d.getDate() - 1);
  }
  return d.toISOString().slice(0, 10);
}

// ── 日次気分ログ ──────────────────────────
export function logDailyMood(log: DailyMoodLog): StoreState {
  const current = readStore();
  const existing = current.dailyMoodLogs ?? [];
  const filtered = existing.filter((l) => l.dateISO !== log.dateISO);
  return writeStore({
    ...current,
    dailyMoodLogs: [log, ...filtered],
  });
}

export function getTodayMoodLog(today = new Date()): DailyMoodLog | undefined {
  const dateISO = currentDayISO(today);
  return (readStore().dailyMoodLogs ?? []).find((l) => l.dateISO === dateISO);
}

// ── 週次目標 ────────────────────────────
export function saveWeeklyGoal(goal: WeeklyGoal): StoreState {
  const current = readStore();
  const existing = current.weeklyGoals ?? [];
  const filtered = existing.filter((g) => g.weekStartISO !== goal.weekStartISO);
  return writeStore({
    ...current,
    weeklyGoals: [goal, ...filtered],
  });
}

export function getCurrentWeekGoal(today = new Date()): WeeklyGoal | undefined {
  const start = startOfWeek(today);
  return (readStore().weeklyGoals ?? []).find((g) => g.weekStartISO === start);
}

export function startOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  // 月曜始まり: day=0(日) を -6 として扱う
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

// ── 週次実行ログ ─────────────────────────
export function saveWeeklyExecution(log: WeeklyExecutionLog): StoreState {
  const current = readStore();
  const existing = current.weeklyExecutions ?? [];
  const filtered = existing.filter((l) => l.weekStartISO !== log.weekStartISO);
  return writeStore({
    ...current,
    weeklyExecutions: [log, ...filtered],
  });
}

// ── ユーザーID ────────────────────────────
// 5 桁の数字 (10000〜99999)
export function generateUserId(): string {
  return String(10000 + Math.floor(Math.random() * 90000));
}

export function ensureUserId(): string {
  const current = readStore();
  if (current.profile?.userId) return current.profile.userId;
  const id = generateUserId();
  if (current.profile) {
    writeStore({ ...current, profile: { ...current.profile, userId: id } });
  }
  return id;
}

// ── タスク ───────────────────────────────
export function listTasks(): StoredTask[] {
  return readStore().tasks ?? [];
}

export function saveTask(task: StoredTask): StoreState {
  const current = readStore();
  const existing = current.tasks ?? [];
  const filtered = existing.filter((t) => t.id !== task.id);
  return writeStore({
    ...current,
    tasks: [task, ...filtered],
  });
}

export function deleteTask(id: string): StoreState {
  const current = readStore();
  return writeStore({
    ...current,
    tasks: (current.tasks ?? []).filter((t) => t.id !== id),
  });
}

export function toggleTaskStatus(id: string): StoreState {
  const current = readStore();
  const tasks = (current.tasks ?? []).map((t) => {
    if (t.id !== id) return t;
    if (t.status === "done") return { ...t, status: "todo" as const, completedAt: undefined };
    return { ...t, status: "done" as const, completedAt: new Date().toISOString() };
  });
  return writeStore({ ...current, tasks });
}

// 7日経った完了タスクをクリーンアップ
export function cleanupCompletedTasks(today = new Date()): StoreState {
  const current = readStore();
  const week = new Date(today);
  week.setDate(week.getDate() - 7);
  const cutoff = week.toISOString();
  const tasks = (current.tasks ?? []).filter((t) => {
    if (t.status !== "done") return true;
    if (!t.completedAt) return true;
    return t.completedAt >= cutoff;
  });
  return writeStore({ ...current, tasks });
}

// ── 本棚 ────────────────────────────────
export function addBookshelfItem(item: BookshelfItem): StoreState {
  const current = readStore();
  const p = current.profile;
  if (!p) return current;
  const items = p.bookshelfItems ?? [];
  const filtered = items.filter((x) => x.id !== item.id);
  return writeStore({
    ...current,
    profile: { ...p, bookshelfItems: [item, ...filtered] },
  });
}

export function removeBookshelfItem(id: string): StoreState {
  const current = readStore();
  const p = current.profile;
  if (!p) return current;
  return writeStore({
    ...current,
    profile: {
      ...p,
      bookshelfItems: (p.bookshelfItems ?? []).filter((x) => x.id !== id),
    },
  });
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

// ── チャット履歴 ─────────────────────────────
export function addChatMessage(message: ChatMessage): StoreState {
  const current = readStore();
  const existing = current.chatMessages ?? [];
  return writeStore({ ...current, chatMessages: [...existing, message] });
}

export function clearChat(): StoreState {
  const current = readStore();
  return writeStore({ ...current, chatMessages: [] });
}
