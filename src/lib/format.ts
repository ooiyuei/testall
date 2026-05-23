// 数値・パーセント・時間の表示フォーマッタ
// ja-JP の Intl.NumberFormat ベース、SSR でも安全。

const intNumberFmt = new Intl.NumberFormat("ja-JP", {
  maximumFractionDigits: 0,
});

const oneDecimalFmt = new Intl.NumberFormat("ja-JP", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** 1234 → "1,234" / 12345 → "12,345" */
export function fmtInt(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return intNumberFmt.format(Math.round(n));
}

/** 50.5 → "50.5" / 偏差値などの 1桁小数 */
export function fmtDev(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return oneDecimalFmt.format(n);
}

/** 0.45 → "45%" / 整数パーセント */
export function fmtPct(ratio: number): string {
  if (!Number.isFinite(ratio)) return "—";
  return `${Math.round(ratio * 100)}%`;
}

/** 125 分 → "2時間5分" / 25 → "25分" / 0 → "0分" */
export function fmtMinutes(min: number): string {
  if (!Number.isFinite(min) || min <= 0) return "0分";
  if (min < 60) return `${Math.round(min)}分`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m === 0 ? `${h}時間` : `${h}時間${m}分`;
}
