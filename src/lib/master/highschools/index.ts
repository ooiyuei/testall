import type { Highschool } from "../types";
import { HIGHSCHOOLS } from "./data";

export { HIGHSCHOOLS };
export type { Highschool };

export function listHighschools(): Highschool[] {
  return HIGHSCHOOLS;
}

export function getHighschool(id: string): Highschool | undefined {
  return HIGHSCHOOLS.find((h) => h.id === id);
}

export function findByCode(code: string): Highschool | undefined {
  return HIGHSCHOOLS.find((h) => h.schoolCode === code);
}

export function searchHighschools(query: string, limit = 20): Highschool[] {
  const q = query.trim().toLowerCase();
  if (!q) return HIGHSCHOOLS.slice(0, limit);
  return HIGHSCHOOLS
    .filter((h) => h.searchText?.includes(q))
    .slice(0, limit);
}

export function listByPrefecture(prefecture: string): Highschool[] {
  return HIGHSCHOOLS.filter((h) => h.prefecture === prefecture);
}
