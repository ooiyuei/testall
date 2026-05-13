// 科目・単元マスター
// 既存 curriculum.ts の SUBJECTS_V2 をベースに、
// 文科省 学習指導要領コード（mextCode）と Testall 独自タグ（testallTags）を重ねる
//
// mextCode は学習指導要領の科目記号を採用（例: 数学I = "MA-I", 物理基礎 = "PH-B"）
// 実際の正式コードは PDF/Excel しか公開されてないため、暫定の規約

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
  SUBJECTS_V2,
  CATEGORY_DEFS,
  getCategoryDef,
  subjectsForCategory,
};
export type { GradeId, SubjectCategory, SubjectDef, SubjectId };

// 暫定 mext コード（学習指導要領記号ベース）
const MEXT_CODES: Record<string, string> = {
  math1a: "MA-IA",
  math2bc: "MA-IIBC",
  math3c: "MA-IIIC",
  "english-comm": "EN-COM",
  "english-logic": "EN-LOG",
  "japanese-modern": "JP-MOD",
  "japanese-classic": "JP-CLA",
  "physics-basic": "SCI-PH-B",
  physics: "SCI-PH",
  "chemistry-basic": "SCI-CH-B",
  chemistry: "SCI-CH",
  "biology-basic": "SCI-BI-B",
  biology: "SCI-BI",
  "earth-basic": "SCI-ES-B",
  earth: "SCI-ES",
  "history-general": "SOC-HG",
  "japanese-history": "SOC-JH",
  "world-history": "SOC-WH",
  "geography-general": "SOC-GG",
  geography: "SOC-GE",
  "civics-public": "SOC-PB",
  "civics-politics": "SOC-PE",
  "civics-ethics": "SOC-ET",
  info1: "INFO-I",
};

// Testall 受験用独自タグ（単元名 → 受験タグ）
const TESTALL_UNIT_TAGS: Record<string, string[]> = {
  二次関数: ["頻出", "基礎"],
  確率: ["頻出", "苦手注意"],
  整数の性質: ["難関頻出"],
  数列: ["頻出"],
  ベクトル: ["頻出"],
  微分法の応用: ["難関頻出"],
  積分法の応用: ["難関頻出", "計算量大"],
  "リーディング（長文）": ["頻出", "時間配分注意"],
  リスニング: ["頻出"],
  力学: ["頻出", "基礎"],
  電磁気: ["難関頻出"],
  熱力学: ["頻出"],
  波動: ["頻出"],
  原子: ["共通テスト"],
  理論化学: ["頻出"],
  有機化学: ["頻出", "難関頻出"],
  無機化学: ["共通テスト"],
};

export const SUBJECT_MASTER: SubjectMaster[] = SUBJECTS_V2.map((s) => {
  const m: SubjectMaster = {
    id: s.id,
    mextCode: MEXT_CODES[s.id],
    category: s.category,
    name: s.name,
    grades: s.grades,
    source: "mext",
    aliases: [s.shortName],
  };
  m.searchText = buildSearchText(m);
  return m;
});

export const UNIT_MASTER: UnitMaster[] = SUBJECTS_V2.flatMap((s) =>
  s.units.map((unitName, idx): UnitMaster => {
    const u: UnitMaster = {
      id: `${s.id}::${idx}`,
      subjectId: s.id,
      name: unitName,
      testallTags: TESTALL_UNIT_TAGS[unitName],
      source: "mext",
    };
    u.searchText = buildSearchText(u);
    return u;
  }),
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
