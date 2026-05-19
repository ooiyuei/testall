// Supabase 経由でマスターデータを取得する非同期 API
// クライアントコンポーネントで使う：
//   1. useEffect 内で remoteSearchUniversities などを呼ぶ
//   2. 取得結果を local state にセット
//   3. Supabase 未接続時は同期版 (UNIVERSITIES 等) にフォールバック
//
// 命名規則: search* / list* / get* で同期版（master/）と対応する

import { getSupabase } from "../supabase";
import type {
  Highschool,
  MockExam,
  Textbook,
  University,
} from "./types";

export type RemoteEnabled = boolean;

export function remoteEnabled(): RemoteEnabled {
  return getSupabase() !== null;
}

// 共通: search_text に対する ILIKE
async function tableSearch<T>(
  table: string,
  query: string,
  limit: number,
): Promise<T[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const q = query.trim();
  let req = sb.from(table).select("*").limit(limit);
  if (q) {
    req = req.ilike("search_text", `%${q.toLowerCase()}%`);
  }
  const { data, error } = await req;
  if (error) {
    console.error(`[remote] ${table} search error:`, error);
    return [];
  }
  return (data ?? []) as T[];
}

// ─── 大学 ────────────────────────────────
export async function remoteSearchUniversities(
  query: string,
  limit = 30,
): Promise<University[]> {
  const rows = await tableSearch<RemoteUniversity>("universities", query, limit);
  return rows.map(mapUniversity);
}

export async function remoteListUniversitiesByRegion(
  region: string,
  limit = 100,
): Promise<University[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("universities")
    .select("*")
    .eq("region", region)
    .limit(limit);
  if (error) {
    console.error(error);
    return [];
  }
  return (data ?? []).map((r) => mapUniversity(r as RemoteUniversity));
}

// ─── 高校 ────────────────────────────────
export async function remoteSearchHighschools(
  query: string,
  limit = 30,
): Promise<Highschool[]> {
  const rows = await tableSearch<RemoteHighschool>("highschools", query, limit);
  return rows.map(mapHighschool);
}

export async function remoteListHighschoolsByPrefecture(
  prefecture: string,
  limit = 100,
): Promise<Highschool[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("highschools")
    .select("*")
    .eq("prefecture", prefecture)
    .limit(limit);
  if (error) {
    console.error(error);
    return [];
  }
  return (data ?? []).map((r) => mapHighschool(r as RemoteHighschool));
}

// ─── 参考書・模試（必要に応じて拡張） ────────────────
export async function remoteSearchTextbooks(
  query: string,
  limit = 30,
): Promise<Textbook[]> {
  const rows = await tableSearch<RemoteTextbook>("textbooks", query, limit);
  return rows.map(mapTextbook);
}

export async function remoteSearchMockExams(
  query: string,
  limit = 30,
): Promise<MockExam[]> {
  const rows = await tableSearch<RemoteMockExam>("mock_exams", query, limit);
  return rows.map(mapMockExam);
}

// ─── DB行 → アプリ型 マッピング ──────────────────
type RemoteUniversity = {
  id: string;
  school_code: string | null;
  name: string;
  short_name: string | null;
  kana: string | null;
  aliases: string[] | null;
  type: "national" | "public" | "private";
  region: string;
  tier: "S" | "A" | "B" | "C" | "D" | null;
  homepage: string | null;
  source: string;
  search_text: string | null;
};

function mapUniversity(r: RemoteUniversity): University {
  return {
    id: r.id,
    schoolCode: r.school_code ?? undefined,
    name: r.name,
    shortName: r.short_name ?? undefined,
    kana: r.kana ?? undefined,
    aliases: r.aliases ?? undefined,
    type: r.type,
    region: r.region,
    tier: r.tier ?? undefined,
    homepage: r.homepage ?? undefined,
    source: (r.source as University["source"]) ?? "mext",
    searchText: r.search_text ?? undefined,
    faculties: [], // 学部は別テーブル。必要時に join 取得
  };
}

type RemoteHighschool = {
  id: string;
  school_code: string | null;
  name: string;
  kana: string | null;
  aliases: string[] | null;
  prefecture: string;
  city: string | null;
  type: "national" | "public" | "private";
  deviation: number | null;
  semester_system: "2-term" | "3-term" | "quarter" | "unknown" | null;
  regular_test_dates: unknown;
  homepage: string | null;
  source: string;
  search_text: string | null;
};

function mapHighschool(r: RemoteHighschool): Highschool {
  return {
    id: r.id,
    schoolCode: r.school_code ?? undefined,
    name: r.name,
    kana: r.kana ?? undefined,
    aliases: r.aliases ?? undefined,
    prefecture: r.prefecture,
    city: r.city ?? undefined,
    type: r.type,
    deviation: r.deviation ?? undefined,
    semesterSystem: r.semester_system ?? undefined,
    homepage: r.homepage ?? undefined,
    source: (r.source as Highschool["source"]) ?? "mext",
    searchText: r.search_text ?? undefined,
  };
}

type RemoteTextbook = {
  id: string;
  isbn: string | null;
  name: string;
  kana: string | null;
  aliases: string[] | null;
  author: string | null;
  publisher: string;
  cover_url: string | null;
  subject: string;
  subject_detail: string | null;
  level: "basic" | "standard" | "advanced" | "top";
  usage_tags: string[] | null;
  for_grades: string[] | null;
  recommended_reps: number | null;
  description: string | null;
  legacy_tags: string[] | null;
  source: string;
  search_text: string | null;
};

function mapTextbook(r: RemoteTextbook): Textbook {
  return {
    id: r.id,
    isbn: r.isbn ?? undefined,
    name: r.name,
    kana: r.kana ?? undefined,
    aliases: r.aliases ?? undefined,
    author: r.author ?? undefined,
    publisher: r.publisher,
    coverUrl: r.cover_url ?? undefined,
    subject: r.subject,
    subjectDetail: r.subject_detail ?? undefined,
    level: r.level,
    usageTags: (r.usage_tags ?? []) as Textbook["usageTags"],
    forGrades: r.for_grades ?? [],
    recommendedReps: r.recommended_reps ?? undefined,
    description: r.description ?? undefined,
    legacyTags: r.legacy_tags ?? undefined,
    source: (r.source as Textbook["source"]) ?? "seed",
    searchText: r.search_text ?? undefined,
  };
}

type RemoteMockExam = {
  id: string;
  provider: string;
  name: string;
  kana: string | null;
  aliases: string[] | null;
  year: number;
  exam_date: string | null;
  deadline: string | null;
  target_grades: string[];
  format: string;
  official_url: string | null;
  target_university_ids: string[] | null;
  notes: string | null;
  source: string;
  search_text: string | null;
};

function mapMockExam(r: RemoteMockExam): MockExam {
  return {
    id: r.id,
    provider: r.provider as MockExam["provider"],
    name: r.name,
    kana: r.kana ?? undefined,
    aliases: r.aliases ?? undefined,
    year: r.year,
    examDate: r.exam_date ?? undefined,
    deadline: r.deadline ?? undefined,
    targetGrades: r.target_grades,
    format: r.format as MockExam["format"],
    officialUrl: r.official_url ?? undefined,
    targetUniversityIds: r.target_university_ids ?? undefined,
    notes: r.notes ?? undefined,
    source: (r.source as MockExam["source"]) ?? "seed",
    searchText: r.search_text ?? undefined,
  };
}

// ─── 統合検索（Supabase版） ────────────────
export async function remoteUnifiedSearch(query: string, limit = 5) {
  const [universities, highschools, textbooks, mockExams] = await Promise.all([
    remoteSearchUniversities(query, limit),
    remoteSearchHighschools(query, limit),
    remoteSearchTextbooks(query, limit),
    remoteSearchMockExams(query, limit),
  ]);
  return { universities, highschools, textbooks, mockExams };
}
