// 簡易レートリミッタ — インメモリ・スライディングウィンドウ方式
//
// 認証が無い現状、AI ルート (/api/chat, /api/diagnose*, /api/enrich-textbook) は
// 匿名で ANTHROPIC_API_KEY のクォータを無制限に消費できてしまう。
// IP 単位で制限してスクリプトによる連打・クォータ焼き尽くしを防ぐ。
//
// 制約: サーバーレス環境ではインスタンス毎のメモリなので完全ではない。
// TODO: 本番スケール時は Upstash Redis 等の外部ストアに置き換え

type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000; // メモリ保護: 溢れたら全クリア (fail-open)

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b) {
    if (buckets.size >= MAX_BUCKETS) buckets.clear();
    b = { timestamps: [] };
    buckets.set(key, b);
  }
  b.timestamps = b.timestamps.filter((t) => now - t < windowMs);
  if (b.timestamps.length >= limit) {
    const oldest = b.timestamps[0];
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }
  b.timestamps.push(now);
  return { ok: true };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** 429 レスポンスの共通ボディ */
export function tooManyRequests(retryAfterSec: number): Response {
  return new Response(
    JSON.stringify({ ok: false, error: "rate_limited", retryAfterSec }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSec),
      },
    },
  );
}
