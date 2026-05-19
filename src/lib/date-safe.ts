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

/**
 * 相対日時 ("3分前" / "昨日" / "先週") を日本語で返す。
 * Intl.RelativeTimeFormat ベース。基準時刻 (now) を指定可能。
 * 60秒以内は「たった今」、それ以降は最も適切な単位を返す。
 */
export function formatRelative(v: unknown, now: Date = new Date()): string {
  const iso = toISOSafe(v);
  if (!iso) return "";
  const target = new Date(iso).getTime();
  if (!Number.isFinite(target)) return "";
  const diffSec = Math.round((target - now.getTime()) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return "たった今";

  const rtf = new Intl.RelativeTimeFormat("ja", { numeric: "auto" });
  const units: ReadonlyArray<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
  ];
  for (const [unit, sec] of units) {
    if (abs >= sec) {
      return rtf.format(Math.round(diffSec / sec), unit);
    }
  }
  return rtf.format(diffSec, "second");
}

/**
 * 短い相対日時 ("3分" / "2時間" / "昨日" / "5/14")。
 * UI でぱっと見せる用途。1日以上は MM/DD 形式に切り替え。
 */
export function formatRelativeShort(v: unknown, now: Date = new Date()): string {
  const iso = toISOSafe(v);
  if (!iso) return "";
  const target = new Date(iso);
  const t = target.getTime();
  if (!Number.isFinite(t)) return "";
  const diffMs = now.getTime() - t;
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return "たった今";
  if (sec < 3600) return `${Math.round(sec / 60)}分前`;
  if (sec < 86400) return `${Math.round(sec / 3600)}時間前`;
  const days = Math.round(sec / 86400);
  if (days === 1) return "昨日";
  if (days < 7) return `${days}日前`;
  return `${target.getMonth() + 1}/${target.getDate()}`;
}
