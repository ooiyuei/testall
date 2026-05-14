import type { Diagnosis, TestInput } from "./types";

// ---------------------------------------------------------------------------
// 診断結果インメモリキャッシュ (24h TTL)
// Vercel のコールドスタートでリセットされる設計で問題なし。
// 目的: 同一テストを再表示したときのレイテンシ削減 + API コスト削減
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

type CacheEntry = {
  result: Diagnosis;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry>();

function hashInput(input: TestInput): string {
  // history は診断の精度に影響するので含める
  // ただし recentBlockLogs は揮発性が高いため除外して安定したキーを作る
  const key = {
    grade: input.grade,
    target: input.target,
    examDate: input.examDate,
    subject: input.subject,
    testName: input.testName,
    score: input.score,
    fullScore: input.fullScore,
    units: input.units,
    textbooks: input.textbooks,
    pastTests: input.history?.pastTests ?? [],
    bookshelf: input.history?.bookshelf ?? [],
  };
  const raw = JSON.stringify(key);
  // 簡易ハッシュ: FNV-1a 32bit
  let h = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h.toString(16);
}

export function getCachedDiagnosis(input: TestInput): Diagnosis | null {
  const key = hashInput(input);
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.result;
}

export function setCachedDiagnosis(input: TestInput, result: Diagnosis): void {
  const key = hashInput(input);
  cache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });
}
