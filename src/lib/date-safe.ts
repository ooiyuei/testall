// 日付フィールドの安全な正規化ヘルパー
// 旧データ・破損データ・外部 import で createdAt/completedAt が
// number / Date / null になっているケースに備える。

/** unknown を ISO 日付 (YYYY-MM-DD) に正規化。失敗時は null。 */
export function toDateString(v: unknown): string | null {
  if (typeof v === "string") return v.slice(0, 10);
  if (typeof v === "number") {
    try {
      return new Date(v).toISOString().slice(0, 10);
    } catch {
      return null;
    }
  }
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return null;
}

/** unknown を完全な ISO 文字列に正規化 (ソート比較用)。失敗時は "". */
export function toISOSafe(v: unknown): string {
  if (typeof v === "string") return v;
  if (typeof v === "number") {
    try {
      return new Date(v).toISOString();
    } catch {
      return "";
    }
  }
  if (v instanceof Date) return v.toISOString();
  return "";
}
