// ---------------------------------------------------------------------------
// チャット応答インメモリキャッシュ (5分 TTL, max 50 entries)
// キー: FNV-1a で userMessage + JSON.stringify(context) をハッシュ化
// Vercel のコールドスタートでリセットされる設計で問題なし。
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ENTRIES = 50;

type CacheEntry = {
  text: string;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry>();

function fnv1a(raw: string): string {
  let h = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(16);
}

function buildCacheKey(
  userMessage: string,
  context: unknown,
): string {
  return fnv1a(userMessage + JSON.stringify(context ?? null));
}

function evictExpired(): void {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now > entry.expiresAt) {
      cache.delete(key);
    }
  }
}

function evictOldest(): void {
  const firstKey = cache.keys().next().value;
  if (firstKey !== undefined) {
    cache.delete(firstKey);
  }
}

export function getChatCache(
  userMessage: string,
  context: unknown,
): string | null {
  evictExpired();
  const key = buildCacheKey(userMessage, context);
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.text;
}

export function setChatCache(
  userMessage: string,
  context: unknown,
  text: string,
): void {
  if (!text) return;
  evictExpired();
  if (cache.size >= MAX_ENTRIES) {
    evictOldest();
  }
  const key = buildCacheKey(userMessage, context);
  cache.set(key, { text, expiresAt: Date.now() + CACHE_TTL_MS });
}
