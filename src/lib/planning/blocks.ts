// 今日のブロック数計算
//
// adjustTodayBlocks():
//   base_blocks    = 曜日別 通常ブロック数
//   mood_delta     = 少なめ:-2 / 並盛り:0 / 大盛り:+2 / 特盛り:+4
//   requested      = base + delta
//   available      = floor((就寝 - 帰宅 - バッファ) / 55)
//   final          = clamp(requested, 1, available)

import type {
  Mood,
  TodayBlocksInput,
  TodayBlocksResult,
} from "./types";
import { MOOD_DELTA } from "./types";

const MOOD_LABEL: Record<Mood, string> = {
  less: "少なめ",
  normal: "並盛り",
  more: "大盛り",
  max: "特盛り",
};

function parseTimeToMinutes(hhmm: string): number {
  // "18:30" → 18*60+30 = 1110。 "24:00" は 1440 として扱う
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return 0;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  return h * 60 + mm;
}

export function calcAvailableMinutes(
  returnTime: string,
  bedtime: string,
  bufferMinutes: number,
): number {
  const r = parseTimeToMinutes(returnTime);
  let b = parseTimeToMinutes(bedtime);
  if (b <= r) b += 24 * 60; // 翌日想定
  const free = b - r - bufferMinutes;
  return Math.max(0, free);
}

export function adjustTodayBlocks(input: TodayBlocksInput): TodayBlocksResult {
  const blockMinutes = input.blockMinutes ?? 30; // 25 分学習 + 5 分休憩
  const moodDelta = MOOD_DELTA[input.mood];
  const requested = input.baseBlocks + moodDelta;
  const available = Math.floor(
    calcAvailableMinutes(input.returnTime, input.bedtime, input.bufferMinutes) /
      blockMinutes,
  );
  const final = Math.min(Math.max(requested, 1), Math.max(1, available));

  let reason: string;
  if (input.mood === "less") {
    reason = `今日は${MOOD_LABEL[input.mood]}モード。最低限の${final}ブロックに圧縮しました。`;
  } else if (input.mood === "max") {
    reason = `今日は${MOOD_LABEL[input.mood]}モード。追加で${moodDelta}ブロック出します。`;
  } else if (final < requested) {
    reason = `今日は帰宅が遅く、物理的に${final}ブロックが上限です。残りは週末に回します。`;
  } else {
    reason = `今日は${MOOD_LABEL[input.mood]}モード。設定通り${final}ブロックでいきます。`;
  }

  return {
    baseBlocks: input.baseBlocks,
    moodDelta,
    requestedBlocks: requested,
    availableBlocks: available,
    finalBlocks: final,
    reason,
  };
}

// ── 曜日 → 平日/休日 判定 ──
export function isWeekend(date: Date): boolean {
  const d = date.getDay();
  return d === 0 || d === 6;
}

export function todayBaseBlocks(
  date: Date,
  weekday: number,
  weekend: number,
): number {
  return isWeekend(date) ? weekend : weekday;
}
