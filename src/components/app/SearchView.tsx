"use client";

// 探す画面
// タブ: 大学 / 参考書 / 模試（高校・記事は探す対象外）
// 初期表示: 人気セクション
// 大学フィルタ: 文系/理系 + 地域 + 難易度
// 参考書フィルタ: 教科 + 難易度 + 出版社
// 模試フィルタ: 主催者 + 学年

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Building2,
  Check,
  Cloud,
  Filter,
  Plus,
  ScrollText,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/hooks/useStore";
import { setProfile } from "@/lib/store";
import { unifiedSearch } from "@/lib/master";
import { UNIVERSITIES } from "@/lib/master/universities";
import { TEXTBOOKS } from "@/lib/master/textbooks";
import { MOCK_EXAMS } from "@/lib/master/mockexams";
import {
  remoteEnabled,
  remoteSearchMockExams,
  remoteSearchTextbooks,
  remoteSearchUniversities,
} from "@/lib/master/remote";
import type {
  Highschool,
  MockExam,
  MockExamProvider,
  Textbook,
  TextbookLevel,
  University,
} from "@/lib/master";
import { PROVIDER_LABEL } from "@/lib/master/mockexams";
import { TIER_LABEL } from "@/lib/master/universities";
import { PUBLISHERS, SUBJECT_AREAS } from "@/lib/master/subjects";
import type { SubjectAreaId } from "@/lib/master/subjects";
import { AddEntityModal, type AddEntityKind } from "@/components/master/AddEntityModal";

type Tab = "university" | "textbook" | "mock-exam";

const TABS: { id: Tab; label: string; icon: typeof Building2 }[] = [
  { id: "university", label: "大学", icon: Building2 },
  { id: "textbook", label: "参考書", icon: BookOpen },
  { id: "mock-exam", label: "模試", icon: ScrollText },
];

// 人気どころ（最初に出すリスト）
const POPULAR_UNI_IDS = [
  "u-tokyo",
  "u-kyoto",
  "waseda",
  "keio",
  "hitotsubashi",
  "titech",
  "osaka",
  "nagoya",
  "sophia",
  "rikadai",
  "meiji",
  "doshisha",
];
const POPULAR_BOOK_IDS = [
  "tb-math-yellow-chart",
  "tb-math-blue-chart",
  "tb-math-1taich",
  "tb-eng-target1900",
  "tb-eng-system",
  "tb-eng-vintage",
  "tb-jp-genbun-akahon",
  "tb-jp-kobun-tango",
];

export function SearchView() {
  const { state, hydrated } = useStore();
  const [tab, setTab] = useState<Tab>("university");
  const [query, setQuery] = useState("");
  const [addModal, setAddModal] = useState<AddEntityKind | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  // フィルタ
  const [uniArea, setUniArea] = useState<"all" | "humanities" | "sciences">("all");
  const [uniRegion, setUniRegion] = useState<string>("all");
  const [uniTier, setUniTier] = useState<string>("all");
  const [bookArea, setBookArea] = useState<"all" | SubjectAreaId>("all");
  const [bookLevel, setBookLevel] = useState<"all" | TextbookLevel>("all");
  const [bookPublisher, setBookPublisher] = useState<string>("all");
  const [examProvider, setExamProvider] = useState<"all" | MockExamProvider>("all");
  const [examGrade, setExamGrade] = useState<string>("all");

  // リモート検索
  const [remoteRes, setRemoteRes] = useState<{
    universities: University[];
    textbooks: Textbook[];
    mockExams: MockExam[];
  } | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const useRemote = remoteEnabled();

  useEffect(() => {
    if (!useRemote) return;
    const q = query.trim();
    if (!q) {
      setRemoteRes(null);
      return;
    }
    setRemoteLoading(true);
    const t = setTimeout(async () => {
      const [universities, textbooks, mockExams] = await Promise.all([
        remoteSearchUniversities(q, 30),
        remoteSearchTextbooks(q, 30),
        remoteSearchMockExams(q, 30),
      ]);
      setRemoteRes({ universities, textbooks, mockExams });
      setRemoteLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query, useRemote]);

  // 表示データ
  const items = useMemo(() => {
    if (tab === "university") {
      const all = remoteRes?.universities ?? (query.trim()
        ? unifiedSearch({ query, kinds: ["university"], limit: 30 }).universities.map((h) => h.entity)
        : UNIVERSITIES);
      const filtered = applyUniFilter(all, uniArea, uniRegion, uniTier);
      if (!query.trim()) {
        const popular = POPULAR_UNI_IDS
          .map((id) => filtered.find((u) => u.id === id))
          .filter((u): u is University => !!u);
        return [...popular, ...filtered.filter((u) => !POPULAR_UNI_IDS.includes(u.id))].slice(0, 30);
      }
      return filtered;
    }
    if (tab === "textbook") {
      const all = remoteRes?.textbooks ?? (query.trim()
        ? unifiedSearch({ query, kinds: ["textbook"], limit: 30 }).textbooks.map((h) => h.entity)
        : TEXTBOOKS);
      const filtered = applyBookFilter(all, bookArea, bookLevel, bookPublisher);
      if (!query.trim()) {
        const popular = POPULAR_BOOK_IDS
          .map((id) => filtered.find((b) => b.id === id))
          .filter((b): b is Textbook => !!b);
        return [...popular, ...filtered.filter((b) => !POPULAR_BOOK_IDS.includes(b.id))].slice(0, 30);
      }
      return filtered;
    }
    // mock-exam
    const all = remoteRes?.mockExams ?? (query.trim()
      ? unifiedSearch({ query, kinds: ["mock-exam"], limit: 30 }).mockExams.map((h) => h.entity)
      : MOCK_EXAMS);
    return applyExamFilter(all, examProvider, examGrade).slice(0, 30);
  }, [
    tab,
    query,
    remoteRes,
    uniArea,
    uniRegion,
    uniTier,
    bookArea,
    bookLevel,
    bookPublisher,
    examProvider,
    examGrade,
  ]);

  const addKind: AddEntityKind = tab as AddEntityKind;
  const filterCount =
    (tab === "university"
      ? (uniArea !== "all" ? 1 : 0) + (uniRegion !== "all" ? 1 : 0) + (uniTier !== "all" ? 1 : 0)
      : tab === "textbook"
      ? (bookArea !== "all" ? 1 : 0) + (bookLevel !== "all" ? 1 : 0) + (bookPublisher !== "all" ? 1 : 0)
      : (examProvider !== "all" ? 1 : 0) + (examGrade !== "all" ? 1 : 0));

  return (
    <div className="px-4 pt-3 pb-32">
      {/* 検索バー */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="大学・参考書・模試で検索"
          className="h-11 w-full rounded-2xl border border-cream-200 bg-white pl-9 pr-3 text-sm text-ink-900 outline-none focus:border-sky-400"
        />
      </div>

      {useRemote ? (
        <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-ink-500">
          <Cloud className="h-3 w-3 text-mint-600" />
          {remoteLoading ? "Supabase 検索中…" : "Supabase 接続中"}
        </div>
      ) : null}

      {/* タブ + フィルタボタン */}
      <div className="mt-3 flex items-center gap-2">
        <ul className="flex flex-1 gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <li key={t.id} className="flex-none">
              <button
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex h-9 items-center gap-1 rounded-full px-3 text-xs font-bold transition",
                  tab === t.id
                    ? "bg-sky-500 text-white shadow-soft"
                    : "bg-white text-ink-700 border border-cream-200",
                )}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setFilterOpen((v) => !v)}
          className={cn(
            "flex h-9 flex-none items-center gap-1 rounded-full px-3 text-xs font-bold transition",
            filterCount > 0
              ? "bg-sun-300 text-ink-900"
              : "bg-white text-ink-700 border border-cream-200",
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          絞り込み
          {filterCount > 0 ? (
            <span className="ml-0.5 rounded-full bg-ink-900 px-1.5 text-[10px] text-white tabular-nums">
              {filterCount}
            </span>
          ) : null}
        </button>
      </div>

      {/* フィルタパネル */}
      {filterOpen ? (
        <div className="mt-3 rounded-2xl border border-cream-200 bg-white p-3 shadow-soft">
          {tab === "university" ? (
            <UniversityFilter
              area={uniArea}
              setArea={setUniArea}
              region={uniRegion}
              setRegion={setUniRegion}
              tier={uniTier}
              setTier={setUniTier}
            />
          ) : tab === "textbook" ? (
            <TextbookFilter
              area={bookArea}
              setArea={setBookArea}
              level={bookLevel}
              setLevel={setBookLevel}
              publisher={bookPublisher}
              setPublisher={setBookPublisher}
            />
          ) : (
            <MockExamFilter
              provider={examProvider}
              setProvider={setExamProvider}
              grade={examGrade}
              setGrade={setExamGrade}
            />
          )}
        </div>
      ) : null}

      {/* 「人気」見出し（クエリなし時） */}
      {!query.trim() ? (
        <h2 className="mt-5 text-[10px] font-bold uppercase tracking-widest text-ink-500">
          <Sparkles className="mr-1 inline-block h-3 w-3 align-baseline" />
          人気の{tab === "university" ? "大学" : tab === "textbook" ? "参考書" : "模試"}
        </h2>
      ) : null}

      {/* 結果リスト */}
      <ul className="mt-2 space-y-1.5">
        {tab === "university"
          ? items.map((u) => <UniversityRow key={(u as University).id} u={u as University} />)
          : tab === "textbook"
          ? items.map((b) => (
              <TextbookRow
                key={(b as Textbook).id}
                b={b as Textbook}
                owned={
                  hydrated &&
                  (state.profile?.textbooks ?? []).includes((b as Textbook).name)
                }
                onToggleOwn={(name) => {
                  const current = state.profile;
                  if (!current) return;
                  const owned = current.textbooks ?? [];
                  const next = owned.includes(name)
                    ? owned.filter((x) => x !== name)
                    : [...owned, name];
                  setProfile({ ...current, textbooks: next });
                }}
              />
            ))
          : items.map((m) => <MockExamRow key={(m as MockExam).id} m={m as MockExam} />)}
        {items.length === 0 ? (
          <li className="rounded-2xl bg-white p-6 text-center text-xs text-ink-500">
            条件に該当なし
          </li>
        ) : null}
      </ul>

      {/* 手動追加 */}
      <button
        type="button"
        onClick={() => setAddModal(addKind)}
        className="mt-4 flex w-full items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-cream-200 bg-white p-4 text-xs font-bold text-ink-500 hover:border-sky-300 hover:bg-sky-50"
      >
        <Plus className="h-3.5 w-3.5" />
        一覧にない{tab === "university" ? "大学" : tab === "textbook" ? "参考書" : "模試"}を追加
      </button>

      {addModal ? (
        <AddEntityModal
          kind={addModal}
          initialName={query.trim() || undefined}
          onClose={() => setAddModal(null)}
        />
      ) : null}
    </div>
  );
}

// ───── フィルタ適用 ─────
function applyUniFilter(
  arr: University[],
  area: "all" | "humanities" | "sciences",
  region: string,
  tier: string,
): University[] {
  return arr.filter((u) => {
    if (region !== "all" && u.region !== region) return false;
    if (tier !== "all" && u.tier !== tier) return false;
    if (area !== "all") {
      const cats = u.faculties.map((f) => f.category);
      const isHumanities = cats.some((c) =>
        ["letters", "law", "economics", "social"].includes(c),
      );
      const isSciences = cats.some((c) =>
        ["science", "engineering", "medical", "agriculture", "info"].includes(c),
      );
      if (area === "humanities" && !isHumanities) return false;
      if (area === "sciences" && !isSciences) return false;
    }
    return true;
  });
}

function applyBookFilter(
  arr: Textbook[],
  area: "all" | SubjectAreaId,
  level: "all" | TextbookLevel,
  publisher: string,
): Textbook[] {
  return arr.filter((b) => {
    if (area !== "all") {
      // book.subject はカテゴリ id（japanese/math/.../social/info）。area は教科 (history/civics 含む)
      // 旧 social は新 history と civics の両方を含むので、両方とも area として一致させる
      if (area === "history" || area === "civics") {
        if (b.subject !== "social" && b.subject !== area) return false;
      } else if (b.subject !== area) return false;
    }
    if (level !== "all" && b.level !== level) return false;
    if (publisher !== "all" && b.publisher !== publisher) return false;
    return true;
  });
}

function applyExamFilter(
  arr: MockExam[],
  provider: "all" | MockExamProvider,
  grade: string,
): MockExam[] {
  return arr.filter((m) => {
    if (provider !== "all" && m.provider !== provider) return false;
    if (grade !== "all" && !m.targetGrades.includes(grade)) return false;
    return true;
  });
}

// ───── フィルタ UI ─────
function ChipRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
        {label}
      </div>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "h-7 rounded-full px-2.5 text-[10px] font-bold transition",
              value === o.value
                ? "bg-sky-500 text-white"
                : "bg-cream-50 text-ink-700 hover:bg-cream-100",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function UniversityFilter({
  area,
  setArea,
  region,
  setRegion,
  tier,
  setTier,
}: {
  area: "all" | "humanities" | "sciences";
  setArea: (v: "all" | "humanities" | "sciences") => void;
  region: string;
  setRegion: (v: string) => void;
  tier: string;
  setTier: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <ChipRow
        label="区分"
        value={area}
        onChange={(v) => setArea(v as typeof area)}
        options={[
          { value: "all", label: "すべて" },
          { value: "humanities", label: "文系" },
          { value: "sciences", label: "理系" },
        ]}
      />
      <ChipRow
        label="地域"
        value={region}
        onChange={setRegion}
        options={[
          { value: "all", label: "全国" },
          ...["北海道", "東北", "関東", "中部", "関西", "中国", "四国", "九州"].map((r) => ({
            value: r,
            label: r,
          })),
        ]}
      />
      <ChipRow
        label="難易度"
        value={tier}
        onChange={setTier}
        options={[
          { value: "all", label: "すべて" },
          { value: "S", label: "最難関" },
          { value: "A", label: "難関" },
          { value: "B", label: "準難関" },
          { value: "C", label: "中堅" },
          { value: "D", label: "一般" },
        ]}
      />
    </div>
  );
}

function TextbookFilter({
  area,
  setArea,
  level,
  setLevel,
  publisher,
  setPublisher,
}: {
  area: "all" | SubjectAreaId;
  setArea: (v: "all" | SubjectAreaId) => void;
  level: "all" | TextbookLevel;
  setLevel: (v: "all" | TextbookLevel) => void;
  publisher: string;
  setPublisher: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <ChipRow
        label="教科"
        value={area}
        onChange={(v) => setArea(v as typeof area)}
        options={[
          { value: "all", label: "すべて" },
          ...SUBJECT_AREAS.map((a) => ({ value: a.id, label: a.name })),
        ]}
      />
      <ChipRow
        label="難易度"
        value={level}
        onChange={(v) => setLevel(v as typeof level)}
        options={[
          { value: "all", label: "すべて" },
          { value: "basic", label: "基礎" },
          { value: "standard", label: "標準" },
          { value: "advanced", label: "応用" },
          { value: "top", label: "最難関" },
        ]}
      />
      <ChipRow
        label="出版社"
        value={publisher}
        onChange={setPublisher}
        options={[
          { value: "all", label: "すべて" },
          ...PUBLISHERS.map((p) => ({ value: p, label: p })),
        ]}
      />
    </div>
  );
}

function MockExamFilter({
  provider,
  setProvider,
  grade,
  setGrade,
}: {
  provider: "all" | MockExamProvider;
  setProvider: (v: "all" | MockExamProvider) => void;
  grade: string;
  setGrade: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <ChipRow
        label="主催"
        value={provider}
        onChange={(v) => setProvider(v as typeof provider)}
        options={[
          { value: "all", label: "すべて" },
          { value: "kawai", label: "河合塾" },
          { value: "sundai", label: "駿台" },
          { value: "toshin", label: "東進" },
          { value: "yozemi", label: "代ゼミ" },
          { value: "benesse", label: "ベネッセ" },
        ]}
      />
      <ChipRow
        label="学年"
        value={grade}
        onChange={setGrade}
        options={[
          { value: "all", label: "すべて" },
          { value: "h1", label: "高1" },
          { value: "h2", label: "高2" },
          { value: "h3", label: "高3" },
          { value: "ronin", label: "浪人" },
        ]}
      />
    </div>
  );
}

// ───── 行コンポーネント ─────
function UniversityRow({ u }: { u: University }) {
  const devs = u.faculties
    .map((f) => f.deviation)
    .filter((v): v is number => typeof v === "number");
  const minDev = devs.length ? Math.min(...devs) : undefined;
  const maxDev = devs.length ? Math.max(...devs) : undefined;
  return (
    <li className="rounded-2xl border border-cream-200 bg-white p-3 shadow-soft">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-black text-ink-900">{u.name}</span>
        {minDev !== undefined && maxDev !== undefined ? (
          <span className="flex-none rounded-full bg-cream-100 px-2 py-0.5 text-[10px] font-bold text-ink-700 tabular-nums">
            偏差値 {minDev}-{maxDev}
          </span>
        ) : null}
      </div>
      <div className="mt-0.5 text-[10px] text-ink-500">
        {u.tier ? `${TIER_LABEL[u.tier]} · ` : ""}
        {u.region} · 全{u.faculties.length}学部
      </div>
    </li>
  );
}

const LEVEL_LABEL: Record<Textbook["level"], string> = {
  basic: "基礎",
  standard: "標準",
  advanced: "応用",
  top: "最難関",
};
const LEVEL_TONE: Record<Textbook["level"], string> = {
  basic: "bg-mint-100 text-mint-600",
  standard: "bg-sky-100 text-sky-700",
  advanced: "bg-peach-100 text-peach-500",
  top: "bg-coral-300 text-white",
};

function TextbookRow({
  b,
  owned,
  onToggleOwn,
}: {
  b: Textbook;
  owned: boolean;
  onToggleOwn: (name: string) => void;
}) {
  return (
    <li className="rounded-2xl border border-cream-200 bg-white p-3 shadow-soft">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "flex-none rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                LEVEL_TONE[b.level],
              )}
            >
              {LEVEL_LABEL[b.level]}
            </span>
            <span className="text-sm font-black text-ink-900 line-clamp-1">
              {b.name}
            </span>
          </div>
          <div className="mt-1 text-[10px] text-ink-500">{b.publisher}</div>
          {b.description ? (
            <p className="mt-1 text-[11px] text-ink-700">{b.description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onToggleOwn(b.name)}
          className={cn(
            "flex h-9 flex-none items-center gap-1 rounded-full px-2.5 text-[10px] font-black transition",
            owned
              ? "bg-mint-500 text-white"
              : "bg-cream-100 text-ink-700 hover:bg-cream-200",
          )}
        >
          {owned ? <Check className="h-3.5 w-3.5" /> : null}
          持ってる
        </button>
      </div>
    </li>
  );
}

function MockExamRow({ m }: { m: MockExam }) {
  return (
    <li className="rounded-2xl border border-cream-200 bg-white p-3 shadow-soft">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-black text-ink-900 line-clamp-1">
          {m.name}
        </span>
        <span className="flex-none rounded-full bg-cream-100 px-2 py-0.5 text-[10px] font-bold text-ink-700">
          {PROVIDER_LABEL[m.provider]}
        </span>
      </div>
      <div className="mt-0.5 text-[10px] text-ink-500">
        {m.examDate ?? "—"} · {m.targetGrades.join("/")} · {m.year}
      </div>
    </li>
  );
}
