// Demo seed — オンボーディング完了直後の状態を「使える」状態にする
// 受験生が初回ログイン時に「何があるか分からない」を解消するため、
// 学習サンプルデータ (テスト1件 / タスク3件 / イベント2件 / ブロックログ2件) を投入する。
//
// 削除タイミング: 初回テスト追加時に DEMO_TEST_ID を含むデータを全削除する。
// (実テストが入ったらデモはお役御免)

import type {
  BlockLog,
  CalendarEvent,
  DailyMoodLog,
  StoredTask,
  StoredTest,
} from "./store";
import { localYMD } from "./date-safe";

export const DEMO_TEST_ID = "demo-test-1";
export const DEMO_TASK_PREFIX = "demo-task-";
export const DEMO_EVENT_PREFIX = "demo-event-";
export const DEMO_FLAG = "testall:demo-seeded";

export type DemoSeed = {
  tests: StoredTest[];
  tasks: StoredTask[];
  events: CalendarEvent[];
  blockLogs: BlockLog[];
  dailyMoodLogs: DailyMoodLog[];
};

/** 今日のスケジュールに合わせた 3 ブロックのデモテストを返す */
export function buildDemoSeed(): DemoSeed {
  const now = new Date();
  const todayISO = localYMD(now);
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowISO = localYMD(tomorrowDate);

  // 模試 2 週間後, 定期テスト 4 週間後を自動セット
  const mockDate = new Date(now);
  mockDate.setDate(mockDate.getDate() + 14);
  const examDate = new Date(now);
  examDate.setDate(examDate.getDate() + 28);

  const demoTest: StoredTest = {
    id: DEMO_TEST_ID,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    input: {
      grade: "h2",
      target: "tokyo-univ",
      examDate: "2027-01-18",
      subject: "数学",
      testName: "サンプル模試 (デモ)",
      score: 72,
      fullScore: 100,
      units: [
        { unit: "二次関数", correct: 1, total: 3, cause: "understanding" },
        { unit: "場合の数", correct: 3, total: 5, cause: "time" },
      ],
      availableMinutesPerDay: 100,
      textbooks: [],
      deviation: 60,
    },
    diagnosis: {
      summary: "二次関数で大きく失点。チャート式で復習を。",
      level: "標準＋",
      gap: "二次関数を最優先で",
      weaknesses: [
        { unit: "二次関数", cause: "understanding", severity: "high", reason: "理解不足", recovery: "チャート式 例12〜15" },
        { unit: "場合の数", cause: "time", severity: "mid", reason: "時間不足", recovery: "演習回数を増やす" },
      ],
      strengths: ["図形と計量"],
      textbookPlan: [],
      weekPlan: [],
      todayBlocks: [
        { startTime: "17:00", endTime: "17:25", subject: "数学", topic: "二次関数", source: "チャート式 例12〜15", goal: "解答を見ずに4問中3問", completion: "本文1周+設問" },
        { startTime: "20:00", endTime: "20:25", subject: "英語", topic: "長文読解", source: "ポラリス1 / Unit 4", goal: "本文1周", completion: "" },
        { startTime: "21:30", endTime: "21:55", subject: "古文", topic: "動詞活用", source: "ステップアップ p.42〜", goal: "暗唱", completion: "" },
      ],
      encouragement: "今日も25分から。",
    },
  };

  const tasks: StoredTask[] = [
    {
      id: `${DEMO_TASK_PREFIX}1`,
      title: "数学A 場合の数 例題3まで",
      tag: "homework",
      subjectArea: "math",
      blocks: 2,
      status: "todo",
      due: "today",
      priority: 2,
      createdAt: new Date().toISOString(),
    },
    {
      id: `${DEMO_TASK_PREFIX}2`,
      title: "英文法 Unit 6 演習",
      tag: "homework",
      subjectArea: "english",
      blocks: 1,
      status: "todo",
      due: "today",
      priority: 1,
      createdAt: new Date().toISOString(),
    },
    {
      id: `${DEMO_TASK_PREFIX}3`,
      title: "古文単語100語復習",
      tag: "added",
      subjectArea: "japanese",
      blocks: 1,
      status: "done",
      due: "today",
      priority: 2,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    },
  ];

  const events: CalendarEvent[] = [
    {
      id: `${DEMO_EVENT_PREFIX}1`,
      title: "全統第2回 マーク模試",
      date: localYMD(mockDate),
      endDate: localYMD(mockDate),
      kind: "mock-exam",
    },
    {
      id: `${DEMO_EVENT_PREFIX}2`,
      title: "前期中間テスト",
      date: localYMD(examDate),
      endDate: localYMD(new Date(examDate.getTime() + 2 * 86400000)),
      kind: "regular-test",
    },
  ];

  // 過去2日分のブロックログを入れて「使い始めた感」を演出
  const blockLogs: BlockLog[] = [
    {
      testId: DEMO_TEST_ID,
      blockIdx: 0,
      completedAt: new Date(Date.now() - 86400000).toISOString(),
      rating: 4,
      durationSec: 25 * 60,
    },
    {
      testId: DEMO_TEST_ID,
      blockIdx: 1,
      completedAt: new Date(Date.now() - 86400000 + 3600000).toISOString(),
      rating: 5,
      durationSec: 25 * 60,
    },
  ];

  const dailyMoodLogs: DailyMoodLog[] = [];

  return { tests: [demoTest], tasks, events, blockLogs, dailyMoodLogs };
}

/** seed 済か判定 */
export function isDemoSeeded(): boolean {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return false;
  return localStorage.getItem(DEMO_FLAG) === "1";
}

export function markDemoSeeded(): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;
  localStorage.setItem(DEMO_FLAG, "1");
}

/** 実テスト追加時にデモ系を全部削除 */
export function removeDemoData<T extends { id: string }>(
  arr: T[],
): T[] {
  return arr.filter(
    (x) =>
      x.id !== DEMO_TEST_ID &&
      !x.id.startsWith(DEMO_TASK_PREFIX) &&
      !x.id.startsWith(DEMO_EVENT_PREFIX),
  );
}
