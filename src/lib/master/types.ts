// マスターデータ共通型
// 外部データ（NDL/openBD/文科省/大学ポートレートなど）→ Raw層 → 正規化層 → アプリ
//
// 設計方針:
// - 正規化層は name / kana / aliases / search_text を持ち検索しやすくする
// - 全エンティティに source（"manual" | 外部ソース名）と sourceId（外部ID）を持たせ、
//   raw データへの逆引きが可能
// - 検索や統計に使うフィールドはトップレベル、それ以外は data: JSONB に寄せる

export type MasterSource =
  | "manual" // ユーザー手入力
  | "mext" // 文部科学省（学校コード・学習指導要領）
  | "univ-portrait" // 大学ポートレート
  | "ndl" // 国立国会図書館サーチ
  | "openbd" // openBD
  | "kawai" // 河合塾
  | "sundai" // 駿台
  | "toshin" // 東進
  | "yozemi" // 代ゼミ
  | "shinken" // 進研模試
  | "seed"; // 初期 CSV 投入

export type MasterEntityKind =
  | "university"
  | "highschool"
  | "textbook"
  | "mock-exam"
  | "subject"
  | "unit";

// 検索用の共通フィールド
export type Searchable = {
  name: string;
  kana?: string; // ひらがな読み（検索用）
  aliases?: string[]; // 略称・別名
  searchText?: string; // name + kana + aliases + 追加ワード（小文字化）
};

// 外部データへの参照
export type SourceRef = {
  source: MasterSource;
  sourceId?: string; // 文科省学校コード、ISBN、ポートレート ID など
  fetchedAt?: string; // ISO 8601
};

// 共通の永続化メタ
export type MasterMeta = {
  createdAt: string;
  updatedAt: string;
  createdBy?: string; // user id（手入力の場合）
};

// ─── 大学 ────────────────────────────────
export type FacultyCategory =
  | "letters"
  | "law"
  | "economics"
  | "social"
  | "science"
  | "engineering"
  | "medical"
  | "agriculture"
  | "info"
  | "art"
  | "general";

export type ExamSubject = {
  subjectId: string; // curriculum 側の id（例: "math-3"）
  required: boolean;
  weight?: number; // 配点（点）
  notes?: string;
};

export type UniversityFaculty = {
  id: string;
  name: string;
  category: FacultyCategory;
  deviation?: number;
  examSubjects?: ExamSubject[]; // 入試科目・配点（手動追加）
};

export type University = Searchable &
  SourceRef &
  Partial<MasterMeta> & {
    id: string;
    schoolCode?: string; // 文科省学校コード（13桁）
    name: string;
    shortName?: string;
    type: "national" | "public" | "private";
    region: string;
    tier?: "S" | "A" | "B" | "C" | "D";
    faculties: UniversityFaculty[];
    homepage?: string;
  };

// ─── 高校 ────────────────────────────────
export type SemesterSystem = "2-term" | "3-term" | "quarter" | "unknown";

export type Highschool = Searchable &
  SourceRef &
  Partial<MasterMeta> & {
    id: string;
    schoolCode?: string; // 文科省学校コード
    name: string;
    prefecture: string;
    city?: string;
    type: "national" | "public" | "private";
    // 以下はユーザー入力で補完
    deviation?: number;
    semesterSystem?: SemesterSystem;
    regularTestDates?: {
      term: string;
      startDate?: string; // YYYY-MM-DD
      endDate?: string;
    }[];
    homepage?: string;
  };

// ─── 参考書 ────────────────────────────────
export type TextbookLevel = "basic" | "standard" | "advanced" | "top";

export type TextbookUsageTag =
  | "comprehensive" // 網羅系
  | "drill" // 演習・問題集
  | "input" // 講義系・読み物
  | "vocab" // 単語・暗記
  | "past-exam" // 過去問
  | "weak-point" // 弱点補強
  | "speed-run" // 短期完成
  | "mock-prep"; // 模試対策

export type Textbook = Searchable &
  SourceRef &
  Partial<MasterMeta> & {
    id: string;
    isbn?: string; // 13桁優先（NDL/openBD）
    isbn10?: string;
    name: string;
    author?: string;
    publisher: string;
    coverUrl?: string; // openBD など
    // ─── Testall 独自タグ ───
    subject: string; // curriculum category id
    subjectDetail?: string; // 例: 数IA / 物基
    level: TextbookLevel;
    usageTags: TextbookUsageTag[];
    forGrades: string[]; // GradeId[]
    targetUnitIds?: string[]; // 対応単元（unit.id）
    recommendedReps?: number; // 推奨周回数
    usageNotes?: string; // 使い方ガイド
    description?: string;
    legacyTags?: string[]; // 旧 tags（互換）
  };

// ─── 模試 ────────────────────────────────
export type MockExamProvider =
  | "kawai" // 河合塾
  | "sundai" // 駿台
  | "toshin" // 東進
  | "yozemi" // 代ゼミ
  | "benesse" // ベネッセ
  | "shinken" // 進研模試（学校実施）
  | "school" // 校内実施
  | "other";

export type MockExamFormat =
  | "mark" // マーク
  | "descriptive" // 記述
  | "mark-descriptive" // マーク+記述
  | "common-test-trial" // 共通テスト型
  | "univ-specific"; // 大学別冠模試

export type MockExam = Searchable &
  SourceRef &
  Partial<MasterMeta> & {
    id: string;
    provider: MockExamProvider;
    name: string;
    year: number;
    examDate?: string; // YYYY-MM-DD
    deadline?: string;
    targetGrades: string[]; // ["h2","h3","ronin"]
    format: MockExamFormat;
    officialUrl?: string;
    targetUniversityIds?: string[]; // 冠模試の場合
    notes?: string;
  };

// ─── 科目・単元 ────────────────────────────────
export type SubjectMaster = Searchable &
  SourceRef & {
    id: string; // Testall 内部 ID
    mextCode?: string; // 学習指導要領コード
    category: string; // japanese / math / english / science / social / info
    name: string;
    grades: string[];
  };

export type UnitMaster = Searchable &
  SourceRef & {
    id: string;
    subjectId: string;
    mextCode?: string;
    name: string;
    testallTags?: string[]; // 受験用独自タグ
    examFrequency?: "high" | "mid" | "low"; // 出題頻度
  };

// ─── 検索結果 ────────────────────────────────
export type SearchHit<T> = {
  kind: MasterEntityKind;
  score: number; // 関連度
  entity: T;
};

export type UnifiedSearchResult = {
  query: string;
  totalCount: number;
  universities: SearchHit<University>[];
  highschools: SearchHit<Highschool>[];
  textbooks: SearchHit<Textbook>[];
  mockExams: SearchHit<MockExam>[];
};

// ─── ユーザー追加（pending → approved） ────────
export type UserAddition = {
  id: string;
  kind: MasterEntityKind;
  data: Partial<
    University | Highschool | Textbook | MockExam | SubjectMaster | UnitMaster
  >;
  status: "draft" | "pending" | "approved" | "rejected";
  createdBy?: string;
  createdAt: string;
  reviewNote?: string;
};

// ─── ヘルパー: search_text 生成 ────────────────
export function buildSearchText(s: Searchable & { [k: string]: unknown }): string {
  const parts: string[] = [s.name];
  if (s.kana) parts.push(s.kana);
  if (s.aliases && s.aliases.length > 0) parts.push(...s.aliases);
  // 役立ちそうな他フィールドも巻き込む
  for (const key of ["shortName", "publisher", "author", "prefecture", "provider"]) {
    const v = s[key];
    if (typeof v === "string" && v) parts.push(v);
  }
  return parts.join(" ").toLowerCase();
}
