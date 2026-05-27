// バッジ定義 + 獲得判定
//
// バッジは見せる "到達点" として 4 カテゴリ:
//   - streak: 連続学習日数
//   - volume: 累計ブロック数
//   - test:   テスト登録数
//   - level:  LV 到達

import type { LevelInfo } from "./exp";
import type { BlockLog, StoredTest } from "./store";
import { computeStreak } from "./analytics";

export type Badge = {
  id: string;
  category: "streak" | "volume" | "test" | "level";
  icon: string; // emoji
  title: string;
  desc: string;
  threshold: number;
};

export const BADGES: Badge[] = [
  // streak
  { id: "streak-3",  category: "streak", icon: "🔥", title: "三日坊主突破", desc: "3日連続で学習", threshold: 3 },
  { id: "streak-7",  category: "streak", icon: "🔥", title: "1週間続いた",   desc: "7日連続で学習", threshold: 7 },
  { id: "streak-30", category: "streak", icon: "🔥", title: "1か月マスター", desc: "30日連続で学習", threshold: 30 },
  { id: "streak-100",category: "streak", icon: "🌋", title: "100日の継続",   desc: "100日連続で学習", threshold: 100 },
  // volume (ブロック数 = 25分 × N)
  { id: "vol-10",   category: "volume", icon: "⏱️", title: "10ブロック", desc: "累計10ブロック (約4時間)", threshold: 10 },
  { id: "vol-50",   category: "volume", icon: "⏱️", title: "50ブロック", desc: "累計50ブロック (約20時間)", threshold: 50 },
  { id: "vol-200",  category: "volume", icon: "⌛", title: "200ブロック", desc: "累計200ブロック (約83時間)", threshold: 200 },
  { id: "vol-1000", category: "volume", icon: "🏛️", title: "1000ブロック", desc: "累計1000ブロック (約417時間)", threshold: 1000 },
  // test
  { id: "test-1",  category: "test", icon: "📝", title: "初テスト登録", desc: "テストを1件登録", threshold: 1 },
  { id: "test-10", category: "test", icon: "📚", title: "10テスト登録", desc: "テストを10件登録", threshold: 10 },
  { id: "test-50", category: "test", icon: "🎓", title: "50テスト登録", desc: "テストを50件登録", threshold: 50 },
  // level
  { id: "lv-5",   category: "level", icon: "⭐", title: "LV 5 到達", desc: "経験値で LV 5 に", threshold: 5 },
  { id: "lv-10",  category: "level", icon: "🌟", title: "LV 10 到達", desc: "経験値で LV 10 に", threshold: 10 },
  { id: "lv-25",  category: "level", icon: "💫", title: "LV 25 到達", desc: "経験値で LV 25 に", threshold: 25 },
];

export type BadgeWithStatus = Badge & { earned: boolean; progress: number };

export function evaluateBadges(args: {
  blockLogs: BlockLog[];
  tests: StoredTest[];
  level: LevelInfo;
}): BadgeWithStatus[] {
  const streak = computeStreak(args.blockLogs);
  const stats = {
    streak: Math.max(streak.current, streak.longest),
    volume: args.blockLogs.length,
    test: args.tests.length,
    level: args.level.level,
  };
  return BADGES.map((b) => {
    const value = stats[b.category];
    return {
      ...b,
      earned: value >= b.threshold,
      progress: Math.min(100, Math.round((value / b.threshold) * 100)),
    };
  });
}
