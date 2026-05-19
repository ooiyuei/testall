// 週次振り返り
//
// weeklyReviewAndReplan():
//   今週の実行ログ + 目標 → 達成率・次週推奨

import type {
  WeeklyExecutionLog,
  WeeklyGoal,
  WeeklyReview,
} from "./types";

export function weeklyReviewAndReplan(
  goal: WeeklyGoal,
  log: WeeklyExecutionLog,
): WeeklyReview {
  const rate = goal.targetBlocks > 0
    ? log.completedBlocks / goal.targetBlocks
    : 0;

  let trend: WeeklyReview["trend"];
  if (rate < 0.7) trend = "behind";
  else if (rate < 1.05) trend = "on-track";
  else trend = "ahead";

  let recommendation: WeeklyReview["recommendation"];
  let nextTarget = goal.targetBlocks;
  const notes: string[] = [];

  if (rate >= 1.2 && log.comprehension !== "low") {
    recommendation = "increase";
    nextTarget = Math.round(goal.targetBlocks * 1.1);
    notes.push("達成率が高く理解度も良好。次週は10%増を提案。");
  } else if (rate < 0.6) {
    recommendation = "decrease";
    nextTarget = Math.max(goal.minimumBlocks, Math.round(goal.targetBlocks * 0.85));
    notes.push("実行率が低いため、まず継続を優先して15%減らした目標で再開。");
  } else if (rate >= 0.85 && rate < 1.05) {
    recommendation = "maintain";
    notes.push("達成率は標準的。同水準を維持。");
  } else {
    recommendation = "stabilize";
    notes.push("実行が不安定。最低ラインを守ることを最優先。");
  }

  // 未完了の上位 3 件を次週の重点に
  if (log.uncompleted.length > 0) {
    notes.push(
      `未完了が ${log.uncompleted.length} 件。次週は ${log.uncompleted.slice(0, 3).join(", ")} を優先。`,
    );
  }

  if (log.comprehension === "low") {
    notes.push("理解度が低い領域あり。新規より復習・解き直しを増やす。");
  }

  return {
    weekStartISO: goal.weekStartISO,
    achievementRate: round(rate, 2),
    trend,
    recommendation,
    nextWeekTargetBlocks: nextTarget,
    notes,
  };
}

function round(x: number, digits: number): number {
  const m = Math.pow(10, digits);
  return Math.round(x * m) / m;
}
