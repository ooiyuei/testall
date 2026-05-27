// 学習分析 — blockLogs / tests / dailyMoodLogs から各種指標を算出
//
// すべて純関数 (state を引数で受ける) → useMemo でキャッシュしやすい
//
// 用語:
//   ブロック = 25 分の集中セッション 1 回
//   streak = 今日 (または昨日まで) から遡って連続でブロック完了した日数

import type { BlockLog, StoredTest } from "./store";
import { guessArea } from "./master/subjects/guessArea";
import type { SubjectAreaId } from "./master/subjects/hierarchy";

// ─── 日付ユーティリティ (ローカルタイム基準) ───────────
function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function startOfWeekMonday(base: Date): Date {
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  const dow = (d.getDay() + 6) % 7; // 月=0..日=6
  d.setDate(d.getDate() - dow);
  return d;
}

// ─── streak (連続記録) ─────────────────────────
export function computeStreak(blockLogs: BlockLog[]): {
  current: number;
  longest: number;
  todayDone: boolean;
} {
  if (blockLogs.length === 0) return { current: 0, longest: 0, todayDone: false };

  // 日別の完了有無 set
  const days = new Set<string>();
  for (const b of blockLogs) {
    if (!b.completedAt) continue;
    days.add(ymd(new Date(b.completedAt)));
  }

  const today = new Date();
  const todayKey = ymd(today);
  const yesterdayKey = ymd(addDays(today, -1));
  const todayDone = days.has(todayKey);

  // 現在の streak: 今日 or 昨日 から遡って連続
  let cursor: Date;
  if (todayDone) cursor = today;
  else if (days.has(yesterdayKey)) cursor = addDays(today, -1);
  else return { current: 0, longest: computeLongestStreak(days), todayDone };

  let current = 0;
  while (days.has(ymd(cursor))) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  return { current, longest: Math.max(current, computeLongestStreak(days)), todayDone };
}

function computeLongestStreak(days: Set<string>): number {
  if (days.size === 0) return 0;
  const sorted = Array.from(days).sort();
  let best = 1;
  let cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const next = new Date(sorted[i]);
    const diff = Math.round((next.getTime() - prev.getTime()) / 86_400_000);
    if (diff === 1) {
      cur += 1;
      best = Math.max(best, cur);
    } else {
      cur = 1;
    }
  }
  return best;
}

// ─── 過去 N 日の日別ブロック数 ─────────────────
export type DailyBlocks = { date: string; weekday: string; count: number; minutes: number };

const WEEKDAY_JP = ["日", "月", "火", "水", "木", "金", "土"];

export function computeDailyBlocks(blockLogs: BlockLog[], days = 7): DailyBlocks[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const map = new Map<string, { count: number; minutes: number }>();
  for (let i = days - 1; i >= 0; i--) {
    map.set(ymd(addDays(today, -i)), { count: 0, minutes: 0 });
  }
  for (const b of blockLogs) {
    if (!b.completedAt) continue;
    const key = ymd(new Date(b.completedAt));
    const entry = map.get(key);
    if (!entry) continue;
    entry.count += 1;
    entry.minutes += Math.round((b.durationSec ?? 1500) / 60);
  }
  const result: DailyBlocks[] = [];
  for (const [date, v] of map.entries()) {
    const d = new Date(date);
    result.push({ date, weekday: WEEKDAY_JP[d.getDay()], count: v.count, minutes: v.minutes });
  }
  return result;
}

// ─── 今週・今月の集計 ─────────────────────────
export type PeriodStats = {
  blocks: number;
  minutes: number;
  daysActive: number;
  goalBlocks: number;
  goalProgressPct: number;
};

export function computeWeekStats(
  blockLogs: BlockLog[],
  goalBlocksPerDay = 3,
): PeriodStats {
  const start = startOfWeekMonday(new Date());
  const end = addDays(start, 7);
  return aggregatePeriod(blockLogs, start, end, goalBlocksPerDay * 7);
}

export function computeMonthStats(
  blockLogs: BlockLog[],
  goalBlocksPerDay = 3,
): PeriodStats {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const daysInMonth = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  return aggregatePeriod(blockLogs, start, end, goalBlocksPerDay * daysInMonth);
}

function aggregatePeriod(
  blockLogs: BlockLog[],
  start: Date,
  end: Date,
  goalBlocks: number,
): PeriodStats {
  let blocks = 0;
  let minutes = 0;
  const active = new Set<string>();
  for (const b of blockLogs) {
    if (!b.completedAt) continue;
    const t = new Date(b.completedAt).getTime();
    if (t < start.getTime() || t >= end.getTime()) continue;
    blocks += 1;
    minutes += Math.round((b.durationSec ?? 1500) / 60);
    active.add(ymd(new Date(b.completedAt)));
  }
  return {
    blocks,
    minutes,
    daysActive: active.size,
    goalBlocks,
    goalProgressPct: goalBlocks > 0 ? Math.min(100, Math.round((blocks / goalBlocks) * 100)) : 0,
  };
}

// ─── 科目別時間配分 ─────────────────────────
export type SubjectShare = {
  areaId: SubjectAreaId | "unknown";
  label: string;
  blocks: number;
  minutes: number;
  pct: number;
};

const AREA_LABEL: Record<SubjectAreaId, string> = {
  japanese: "国語",
  math: "数学",
  english: "英語",
  science: "理科",
  history: "歴史",
  civics: "公民",
  info: "情報",
};

export function computeSubjectShare(
  blockLogs: BlockLog[],
  tests: StoredTest[],
  withinDays = 30,
): SubjectShare[] {
  const since = Date.now() - withinDays * 86_400_000;
  const testMap = new Map(tests.map((t) => [t.id, t.input.subject]));
  const buckets = new Map<SubjectAreaId | "unknown", { blocks: number; minutes: number }>();

  for (const b of blockLogs) {
    if (!b.completedAt) continue;
    if (new Date(b.completedAt).getTime() < since) continue;
    const subject = testMap.get(b.testId);
    const area: SubjectAreaId | "unknown" = subject ? guessArea(subject) : "unknown";
    const entry = buckets.get(area) ?? { blocks: 0, minutes: 0 };
    entry.blocks += 1;
    entry.minutes += Math.round((b.durationSec ?? 1500) / 60);
    buckets.set(area, entry);
  }

  const totalBlocks = Array.from(buckets.values()).reduce((s, v) => s + v.blocks, 0);
  const result: SubjectShare[] = [];
  for (const [areaId, v] of buckets.entries()) {
    result.push({
      areaId,
      label: areaId === "unknown" ? "未分類" : AREA_LABEL[areaId],
      blocks: v.blocks,
      minutes: v.minutes,
      pct: totalBlocks > 0 ? Math.round((v.blocks / totalBlocks) * 100) : 0,
    });
  }
  return result.sort((a, b) => b.blocks - a.blocks);
}
