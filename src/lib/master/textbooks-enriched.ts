// Placeholder — Phase B (scripts/enrich-textbooks.ts) で上書きされる
// 本ファイルが空でも getAllTextbooks() は動作する
//
// Phase B 実行手順:
//   1) .env.local に ANTHROPIC_API_KEY=sk-ant-... を追加
//   2) pnpm tsx scripts/enrich-textbooks.ts
//   3) 本ファイルが上書きされ、TEXTBOOKS_ENRICHED と TEXTBOOKS_ENRICHED_BY_KEY が埋まる
//   4) getAllTextbooks() が rank/strengths/tableOfContents/recommendedFor 等を含む拡張版を返す

export type EnrichedTextbook = {
  rank: number;
  title: string;
  publisher: string;
  tableOfContents: { section: string; items: string[]; confidence: "high" | "medium" | "low" }[];
  strengths: string[];
  weaknesses: string[];
  recommendedFor: string;
  estimatedHours: number;
  overallConfidence: "high" | "medium" | "low";
  notes: string;
};

export const TEXTBOOKS_ENRICHED: EnrichedTextbook[] = [];

export const TEXTBOOKS_ENRICHED_BY_KEY: Record<string, EnrichedTextbook> = {};
