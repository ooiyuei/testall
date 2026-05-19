// マスターデータの公開エクスポート
// 名前衝突を避けるため、各DBはネームスペース風に再エクスポートする
// 単体型・関数の re-export は明示的に行う

import * as universities from "./universities";
import * as highschools from "./highschools";
import * as textbooks from "./textbooks";
import * as mockexams from "./mockexams";
import * as subjects from "./subjects";

export { universities, highschools, textbooks, mockexams, subjects };

// 共通型
export type {
  University,
  Highschool,
  Textbook,
  MockExam,
  MockExamProvider,
  TextbookUsageTag,
  TextbookLevel,
  UniversityFaculty,
  FacultyCategory,
  ExamSubject,
  SemesterSystem,
  MockExamFormat,
  SubjectMaster,
  UnitMaster,
  MasterEntityKind,
  MasterSource,
  SourceRef,
  Searchable,
  UserAddition,
  SearchHit,
  UnifiedSearchResult,
} from "./types";

export { buildSearchText } from "./types";

// 統合検索
export { unifiedSearch } from "./search";
export type { SearchOptions } from "./search";

// ユーザー追加
export {
  listAdditions,
  addUniversity,
  addHighschool,
  addTextbook,
  addMockExam,
  deleteAddition,
  mergedUniversities,
  mergedHighschools,
  mergedTextbooks,
  mergedMockExams,
} from "./userAdditions";
