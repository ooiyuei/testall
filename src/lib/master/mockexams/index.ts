import type { MockExam, MockExamProvider } from "../types";
import { MOCK_EXAMS } from "./data";
import { localYMD } from "../../date-safe";

export { MOCK_EXAMS };
export type { MockExam, MockExamProvider };

export const PROVIDER_LABEL: Record<MockExamProvider, string> = {
  kawai: "河合塾",
  sundai: "駿台",
  toshin: "東進",
  yozemi: "代ゼミ",
  benesse: "ベネッセ",
  shinken: "進研模試",
  school: "校内実施",
  other: "その他",
};

export function listMockExams(): MockExam[] {
  return MOCK_EXAMS;
}

export function getMockExam(id: string): MockExam | undefined {
  return MOCK_EXAMS.find((m) => m.id === id);
}

export function searchMockExams(query: string, limit = 20): MockExam[] {
  const q = query.trim().toLowerCase();
  if (!q) return MOCK_EXAMS.slice(0, limit);
  return MOCK_EXAMS
    .filter((m) => m.searchText?.includes(q))
    .slice(0, limit);
}

export function listByProvider(provider: MockExamProvider): MockExam[] {
  return MOCK_EXAMS.filter((m) => m.provider === provider);
}

export function listByGrade(grade: string): MockExam[] {
  return MOCK_EXAMS.filter((m) => m.targetGrades.includes(grade));
}

export function upcomingExams(grade?: string, today = new Date()): MockExam[] {
  const todayStr = localYMD(today);
  return MOCK_EXAMS
    .filter((m) => !m.examDate || m.examDate >= todayStr)
    .filter((m) => !grade || m.targetGrades.includes(grade))
    .sort((a, b) => (a.examDate ?? "").localeCompare(b.examDate ?? ""));
}
