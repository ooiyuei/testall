// 経験値 / レベル計算
//
// 設計:
//   レベル 1 で 1000 EXP 必要、以降 ×1.4 倍ずつ増加
//   タスク完了: 30 EXP × ブロック数
//   模試登録: 200 EXP
//   集中ブロック完了: 50 EXP/ブロック
//   ログイン: 10 EXP/日
//   連続ログイン: 連続日数×5 EXP (上限 50)
//
// 補正は後でユーザーログから調整

import type { BlockLog, StoredTask, StoredTest } from "./store";

const BASE_EXP_PER_LEVEL = 1000;
const GROWTH = 1.4;

export type LevelInfo = {
  level: number;
  totalExp: number;
  currentLevelExp: number;
  nextLevelExp: number;
  progressPct: number; // 0..100
};

export function expRequiredForLevel(level: number): number {
  // level N → N+1 に必要な EXP
  return Math.round(BASE_EXP_PER_LEVEL * Math.pow(GROWTH, level - 1));
}

export function totalExpToReach(level: number): number {
  // レベル 1→level までに累計必要な EXP
  let sum = 0;
  for (let i = 1; i < level; i++) {
    sum += expRequiredForLevel(i);
  }
  return sum;
}

export function levelFromExp(totalExp: number): LevelInfo {
  let level = 1;
  let cumulative = 0;
  while (true) {
    const needed = expRequiredForLevel(level);
    if (cumulative + needed > totalExp) break;
    cumulative += needed;
    level += 1;
  }
  const currentLevelExp = totalExp - cumulative;
  const nextLevelExp = expRequiredForLevel(level);
  return {
    level,
    totalExp,
    currentLevelExp,
    nextLevelExp,
    progressPct: Math.min(100, Math.round((currentLevelExp / nextLevelExp) * 100)),
  };
}

// ── EXP 計算（state から） ────────────────────
export function computeTotalExp(args: {
  tasks: StoredTask[];
  tests: StoredTest[];
  blockLogs: BlockLog[];
  loginDays?: number;          // ログイン日数（dailyMoodLogs 数）
  streakDays?: number;
}): number {
  let exp = 0;
  // タスク完了
  for (const t of args.tasks) {
    if (t.status === "done") exp += 30 * Math.max(1, t.blocks ?? 1);
  }
  // 模試・テスト登録
  exp += args.tests.length * 200;
  // 集中ブロック
  exp += args.blockLogs.length * 50;
  // ログイン
  if (args.loginDays) exp += args.loginDays * 10;
  // 連続ログイン
  if (args.streakDays) exp += Math.min(50, args.streakDays * 5);
  return exp;
}
