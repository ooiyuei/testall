// 大学マスターレイヤー
// 既存 src/lib/universities.ts の UNIVERSITIES を取り込み、
// kana / aliases / searchText / schoolCode を付加して検索しやすくする

import {
  UNIVERSITIES as RAW_UNIVERSITIES,
  TIER_LABEL,
  FACULTY_CATEGORY_LABEL,
} from "../../universities";
import type { University as LegacyUniv } from "../../universities";
import type { University } from "../types";
import { buildSearchText } from "../types";
import { UNIVERSITY_ALIASES } from "./aliases";

export { TIER_LABEL, FACULTY_CATEGORY_LABEL };
export type { University };

function toMaster(u: LegacyUniv): University {
  const alias = UNIVERSITY_ALIASES[u.id];
  const enriched: University = {
    id: u.id,
    name: u.name,
    shortName: u.shortName,
    type: u.type,
    region: u.region,
    tier: u.tier,
    faculties: u.faculties.map((f, i) => ({
      id: `${u.id}-${i}`,
      name: f.name,
      category: f.category,
      deviation: f.deviation,
    })),
    kana: alias?.kana,
    aliases: alias?.aliases,
    schoolCode: alias?.schoolCode,
    homepage: alias?.homepage,
    source: "seed",
  };
  enriched.searchText = buildSearchText(enriched);
  return enriched;
}

export const UNIVERSITIES: University[] = RAW_UNIVERSITIES.map(toMaster);

export function getUniversity(id: string): University | undefined {
  return UNIVERSITIES.find((u) => u.id === id);
}

export function findByCode(schoolCode: string): University | undefined {
  return UNIVERSITIES.find((u) => u.schoolCode === schoolCode);
}

export function searchUniversities(query: string, limit = 30): University[] {
  const q = query.trim().toLowerCase();
  if (!q) return UNIVERSITIES.slice(0, limit);
  return UNIVERSITIES.filter((u) => u.searchText?.includes(q)).slice(0, limit);
}

export function listByRegion(region: string): University[] {
  return UNIVERSITIES.filter((u) => u.region === region);
}

export function listByTier(tier: string): University[] {
  return UNIVERSITIES.filter((u) => u.tier === tier);
}
