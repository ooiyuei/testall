// 科目・単元マスター
// 階層: 教科(area) → 科目(subject) → 領域(domain) → 単元(unit) → 能力(ability)
// 既存 curriculum.ts の SUBJECTS_V2 とは互換維持しつつ、新階層 (CURRICULUM) を提供。

import {
  CURRICULUM,
  SUBJECT_AREAS,
  ABILITIES,
  getSubject,
  subjectsByArea,
  allUnits,
  type SubjectArea,
  type SubjectAreaId,
  type Subject as SubjectHier,
  type Domain,
  type Unit as UnitHier,
  type Ability,
  type GradeId as GradeIdH,
} from "./hierarchy";

import {
  SUBJECTS_V2,
  CATEGORY_DEFS,
  getCategoryDef,
  subjectsForCategory,
  type GradeId,
  type SubjectCategory,
  type SubjectDef,
  type SubjectId,
} from "../../curriculum";

import type { SubjectMaster, UnitMaster } from "../types";
import { buildSearchText } from "../types";

export {
  // 旧（互換）
  SUBJECTS_V2,
  CATEGORY_DEFS,
  getCategoryDef,
  subjectsForCategory,
  // 新（階層）
  CURRICULUM,
  SUBJECT_AREAS,
  ABILITIES,
  getSubject,
  subjectsByArea,
  allUnits,
};

export type {
  GradeId,
  SubjectCategory,
  SubjectDef,
  SubjectId,
  SubjectArea,
  SubjectAreaId,
  SubjectHier,
  Domain,
  UnitHier,
  Ability,
};

// ── 教科 → SubjectCategory 互換マップ（旧 5 大分類） ──
// 旧 social = 地歴+公民
export function areaToLegacyCategory(area: SubjectAreaId): SubjectCategory {
  if (area === "history" || area === "civics") return "social";
  return area as SubjectCategory;
}

// ── 出版社一覧（参考書フィルタ用） ──
// 既存 textbooks の publisher を集めて公開（重複排除）
import { TEXTBOOKS as RAW_TEXTBOOKS } from "../../textbooks";
export const PUBLISHERS: string[] = Array.from(
  new Set(RAW_TEXTBOOKS.map((b) => b.publisher)),
).sort();

// ── マスター層への変換（既存 SUBJECT_MASTER / UNIT_MASTER） ──
const MEXT_CODES: Record<string, string> = Object.fromEntries(
  CURRICULUM.map((s) => [s.id, s.mextCode ?? ""]),
);

export const SUBJECT_MASTER: SubjectMaster[] = CURRICULUM.map((s) => {
  const m: SubjectMaster = {
    id: s.id,
    mextCode: MEXT_CODES[s.id] || undefined,
    category: areaToLegacyCategory(s.area),
    name: s.name,
    grades: s.grades,
    source: "mext",
    aliases: [s.shortName],
  };
  m.searchText = buildSearchText(m);
  return m;
});

export const UNIT_MASTER: UnitMaster[] = CURRICULUM.flatMap((s) =>
  s.domains.flatMap((d) =>
    d.units.map((u): UnitMaster => {
      const m: UnitMaster = {
        id: u.id,
        subjectId: s.id,
        name: `${d.name} / ${u.name}`,
        testallTags: u.abilities ? Array.from(u.abilities) : undefined,
        examFrequency: u.examFrequency,
        source: "mext",
      };
      m.searchText = buildSearchText(m);
      return m;
    }),
  ),
);

export function getSubjectMaster(id: string): SubjectMaster | undefined {
  return SUBJECT_MASTER.find((s) => s.id === id);
}

export function listUnitsBySubject(subjectId: string): UnitMaster[] {
  return UNIT_MASTER.filter((u) => u.subjectId === subjectId);
}

export function searchUnits(query: string, limit = 30): UnitMaster[] {
  const q = query.trim().toLowerCase();
  if (!q) return UNIT_MASTER.slice(0, limit);
  return UNIT_MASTER.filter((u) => u.searchText?.includes(q)).slice(0, limit);
}
