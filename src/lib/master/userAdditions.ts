// ユーザー手入力マスターデータ層
// 見つからなかった大学・高校・参考書・模試をユーザーが追加できる
// 現状は sessionStorage 保存。Supabase 接続後は user_master_additions テーブルへ
// TODO: 実データに置き換え（Supabase 接続後）

import { nanoid } from "nanoid";
import type {
  Highschool,
  MasterEntityKind,
  MockExam,
  Textbook,
  University,
  UserAddition,
} from "./types";
import { buildSearchText } from "./types";

const STORAGE_KEY = "testall:master-additions:v1";

type Store = {
  additions: UserAddition[];
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

function read(): Store {
  if (!isBrowser()) return { additions: [] };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { additions: [] };
    const parsed = JSON.parse(raw) as Store;
    return { additions: Array.isArray(parsed.additions) ? parsed.additions : [] };
  } catch {
    return { additions: [] };
  }
}

function write(next: Store): Store {
  if (!isBrowser()) return next;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("testall:master-additions"));
  return next;
}

export function listAdditions(kind?: MasterEntityKind): UserAddition[] {
  const all = read().additions;
  return kind ? all.filter((a) => a.kind === kind) : all;
}

export function addUniversity(
  data: Omit<University, "id" | "searchText" | "source">,
): UserAddition {
  return saveAddition("university", {
    ...data,
    id: `user-uni-${nanoid(8)}`,
    source: "manual",
    searchText: buildSearchText(data),
  });
}

export function addHighschool(
  data: Omit<Highschool, "id" | "searchText" | "source">,
): UserAddition {
  return saveAddition("highschool", {
    ...data,
    id: `user-hs-${nanoid(8)}`,
    source: "manual",
    searchText: buildSearchText(data),
  });
}

export function addTextbook(
  data: Omit<Textbook, "id" | "searchText" | "source">,
): UserAddition {
  return saveAddition("textbook", {
    ...data,
    id: `user-tb-${nanoid(8)}`,
    source: "manual",
    searchText: buildSearchText(data),
  });
}

export function addMockExam(
  data: Omit<MockExam, "id" | "searchText" | "source">,
): UserAddition {
  return saveAddition("mock-exam", {
    ...data,
    id: `user-me-${nanoid(8)}`,
    source: "manual",
    searchText: buildSearchText(data),
  });
}

function saveAddition(
  kind: MasterEntityKind,
  data: UserAddition["data"] & { id: string },
): UserAddition {
  const addition: UserAddition = {
    id: nanoid(),
    kind,
    data,
    status: "draft",
    createdAt: new Date().toISOString(),
  };
  const current = read();
  write({ additions: [addition, ...current.additions] });
  return addition;
}

export function deleteAddition(id: string): void {
  const current = read();
  write({ additions: current.additions.filter((a) => a.id !== id) });
}

// マージユーティリティ: シードデータ + ユーザー追加データ
export function mergedUniversities(seed: University[]): University[] {
  const adds = listAdditions("university")
    .filter((a) => a.status !== "rejected")
    .map((a) => a.data as University);
  return [...adds, ...seed];
}

export function mergedHighschools(seed: Highschool[]): Highschool[] {
  const adds = listAdditions("highschool")
    .filter((a) => a.status !== "rejected")
    .map((a) => a.data as Highschool);
  return [...adds, ...seed];
}

export function mergedTextbooks(seed: Textbook[]): Textbook[] {
  const adds = listAdditions("textbook")
    .filter((a) => a.status !== "rejected")
    .map((a) => a.data as Textbook);
  return [...adds, ...seed];
}

export function mergedMockExams(seed: MockExam[]): MockExam[] {
  const adds = listAdditions("mock-exam")
    .filter((a) => a.status !== "rejected")
    .map((a) => a.data as MockExam);
  return [...adds, ...seed];
}
