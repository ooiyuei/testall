// 依存ゼロのインメモリ・スライディングウィンドウ レートリミッタ。
// 目的: 無認証APIの連打/コスト爆発(Anthropic課金枯渇)への第一防壁。
// 注意: Vercelサーバーレスはインスタンス毎にメモリが独立するため完全ではない。
//       本番スケール時は @upstash/ratelimit + Upstash Redis に置換すること(横断的な制限が要る)。
//       それでも「1インスタンスを誰かが連打して即焼く」最悪ケースは確実に防げる。

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();
let lastSweep = 0;

/** リバースプロキシ(Vercel/CDN)越しのクライアントIPを推定する */
export function clientIp(req: Request): string {
  const h = req.headers;
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

export type RateResult = { ok: boolean; remaining: number; retryAfter: number };

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateResult {
  const now = Date.now();
  // 期限切れバケットの定期掃除(メモリリーク防止)
  if (now - lastSweep > 60_000) {
    for (const [k, b] of store) if (b.resetAt < now) store.delete(k);
    lastSweep = now;
  }
  const b = store.get(key);
  if (!b || b.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }
  if (b.count >= limit) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count += 1;
  return { ok: true, remaining: limit - b.count, retryAfter: 0 };
}

/** ルートハンドラ先頭で呼ぶ。name 毎・IP毎に制限する。 */
export function checkRateLimit(
  req: Request,
  opts: { name: string; limit: number; windowMs: number },
): RateResult {
  return rateLimit(`${opts.name}:${clientIp(req)}`, opts.limit, opts.windowMs);
}

/** 429 レスポンス(Retry-After付き)。レート超過時に return する。 */
export function tooManyRequests(retryAfter: number): Response {
  return new Response(JSON.stringify({ ok: false, error: "rate_limited" }), {
    status: 429,
    headers: {
      "content-type": "application/json",
      "retry-after": String(Math.max(1, retryAfter)),
    },
  });
}
