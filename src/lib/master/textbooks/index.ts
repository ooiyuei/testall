// 参考書マスターレイヤー
// 既存 src/lib/textbooks.ts の TEXTBOOKS を取り込み、
// isbn / kana / usageTags / recommendedReps などの Testall 独自タグを付加できる構造に拡張
//
// 既存 tags は legacyTags に保持しつつ、新しい usageTags にマッピングする
// TODO: ISBN は NDL/openBD から手動補完 → 後で CSV/SQL に置換

import { TEXTBOOKS as RAW_TEXTBOOKS } from "../../textbooks";
import type { Textbook as LegacyBook } from "../../textbooks";
import type { Textbook, TextbookUsageTag } from "../types";
import { buildSearchText } from "../types";

export type { Textbook, TextbookUsageTag };

// 旧 tags → 新 usageTags のマッピング
const LEGACY_TAG_TO_USAGE: Record<string, TextbookUsageTag> = {
  網羅系: "comprehensive",
  例題: "comprehensive",
  問題集: "drill",
  演習: "drill",
  講義系: "input",
  読み物: "input",
  単語: "vocab",
  暗記: "vocab",
  過去問: "past-exam",
  弱点補強: "weak-point",
  短期: "speed-run",
  薄め: "speed-run",
  模試: "mock-prep",
};

function deriveUsageTags(legacyTags: string[]): TextbookUsageTag[] {
  const set = new Set<TextbookUsageTag>();
  for (const t of legacyTags) {
    const usage = LEGACY_TAG_TO_USAGE[t];
    if (usage) set.add(usage);
  }
  // 何も拾えなかったら drill にフォールバック
  if (set.size === 0) set.add("drill");
  return [...set];
}

// ISBN / 著者 / 周回数の手動補完辞書
// TODO: NDLサーチでバッチ取得して置換
type BookEnrich = {
  isbn?: string;
  author?: string;
  recommendedReps?: number;
  subjectDetail?: string;
};

const BOOK_ENRICHMENT: Record<string, BookEnrich> = {
  "tb-math-yellow-chart": { recommendedReps: 3, subjectDetail: "数IA/IIBC/IIIC" },
  "tb-math-blue-chart": { recommendedReps: 3, subjectDetail: "数IA/IIBC/IIIC" },
  "tb-math-focus-gold": { recommendedReps: 2 },
  "tb-math-kihon-rensyu": { isbn: "9784010347027", recommendedReps: 3 },
  "tb-math-1taich": { recommendedReps: 2 },
};

function toMaster(b: LegacyBook): Textbook {
  const enrich = BOOK_ENRICHMENT[b.id] ?? {};
  const enriched: Textbook = {
    id: b.id,
    name: b.name,
    publisher: b.publisher,
    subject: b.subject,
    level: b.level,
    forGrades: b.forGrades,
    description: b.description,
    legacyTags: b.tags,
    usageTags: deriveUsageTags(b.tags),
    isbn: enrich.isbn,
    author: enrich.author,
    recommendedReps: enrich.recommendedReps,
    subjectDetail: enrich.subjectDetail,
    source: "seed",
  };
  enriched.searchText = buildSearchText({
    ...enriched,
    aliases: [...(b.tags ?? [])],
  });
  return enriched;
}

export const TEXTBOOKS: Textbook[] = RAW_TEXTBOOKS.map(toMaster);

export function getTextbook(id: string): Textbook | undefined {
  return TEXTBOOKS.find((t) => t.id === id);
}

export function findByIsbn(isbn: string): Textbook | undefined {
  return TEXTBOOKS.find((t) => t.isbn === isbn);
}

export function searchTextbooks(query: string, limit = 30): Textbook[] {
  const q = query.trim().toLowerCase();
  if (!q) return TEXTBOOKS.slice(0, limit);
  return TEXTBOOKS.filter((t) => t.searchText?.includes(q)).slice(0, limit);
}

export function listBySubject(subject: string): Textbook[] {
  return TEXTBOOKS.filter((t) => t.subject === subject);
}

export function listByLevel(level: Textbook["level"]): Textbook[] {
  return TEXTBOOKS.filter((t) => t.level === level);
}
