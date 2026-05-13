// ブロック定数 — ポモドーロ・テクニックに基づく 25 分単位
// 1ブロック = 25分集中 + 5分休憩 = 30分占有

export const BLOCK_MINUTES = 25;
export const BLOCK_OCCUPIES_MINUTES = 30; // 25分学習 + 5分休憩
export const HOURS_PER_BLOCK = BLOCK_MINUTES / 60; // 25/60 ≈ 0.4167h

// 表示文字列
export const BLOCK_LABEL = "25分";
