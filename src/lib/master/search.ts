// 統合検索レイヤー
// 大学・高校・参考書・模試を横断検索する
// ユーザー追加データもマージ対象

import { UNIVERSITIES } from "./universities";
import { HIGHSCHOOLS } from "./highschools";
import { TEXTBOOKS } from "./textbooks";
import { MOCK_EXAMS } from "./mockexams";
import {
  mergedHighschools,
  mergedMockExams,
  mergedTextbooks,
  mergedUniversities,
} from "./userAdditions";
import type {
  Highschool,
  MasterEntityKind,
  MockExam,
  SearchHit,
  Textbook,
  UnifiedSearchResult,
  University,
} from "./types";

function scoreHit(query: string, text?: string): number {
  if (!text) return 0;
  const lower = text.toLowerCase();
  if (!lower.includes(query)) return 0;
  // 完全一致 > 先頭一致 > 部分一致
  if (lower === query) return 100;
  if (lower.startsWith(query)) return 80;
  return 50;
}

function searchOne<T extends { searchText?: string; name: string }>(
  list: T[],
  query: string,
  limit: number,
  kind: MasterEntityKind,
): SearchHit<T>[] {
  return list
    .map((entity) => {
      const score = Math.max(
        scoreHit(query, entity.searchText),
        scoreHit(query, entity.name.toLowerCase()),
      );
      return { kind, score, entity };
    })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export type SearchOptions = {
  query: string;
  limit?: number;
  kinds?: MasterEntityKind[];
  includeUserAdditions?: boolean;
};

export function unifiedSearch(opts: SearchOptions): UnifiedSearchResult {
  const q = opts.query.trim().toLowerCase();
  const limit = opts.limit ?? 10;
  const includeUser = opts.includeUserAdditions ?? true;
  const kinds = new Set(
    opts.kinds ?? ["university", "highschool", "textbook", "mock-exam"],
  );

  const unis = includeUser ? mergedUniversities(UNIVERSITIES) : UNIVERSITIES;
  const highs = includeUser ? mergedHighschools(HIGHSCHOOLS) : HIGHSCHOOLS;
  const books = includeUser ? mergedTextbooks(TEXTBOOKS) : TEXTBOOKS;
  const exams = includeUser ? mergedMockExams(MOCK_EXAMS) : MOCK_EXAMS;

  const universities: SearchHit<University>[] = kinds.has("university")
    ? searchOne(unis, q, limit, "university")
    : [];
  const highschools: SearchHit<Highschool>[] = kinds.has("highschool")
    ? searchOne(highs, q, limit, "highschool")
    : [];
  const textbooks: SearchHit<Textbook>[] = kinds.has("textbook")
    ? searchOne(books, q, limit, "textbook")
    : [];
  const mockExams: SearchHit<MockExam>[] = kinds.has("mock-exam")
    ? searchOne(exams, q, limit, "mock-exam")
    : [];

  return {
    query: opts.query,
    totalCount:
      universities.length +
      highschools.length +
      textbooks.length +
      mockExams.length,
    universities,
    highschools,
    textbooks,
    mockExams,
  };
}
