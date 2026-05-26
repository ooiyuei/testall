"use client";

// 探す画面
// タブ: 大学 / 参考書 / 模試
// 初期表示: 人気セクション
// フィルタ: 大学(文系/理系/地域/難易度) / 参考書(教科/難易度/出版社) / 模試(主催/学年)

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Building2,
  Check,
  ChevronRight,
  Cloud,
  Filter,
  Plus,
  ScrollText,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/hooks/useStore";
import { setProfile } from "@/lib/store";
import { unifiedSearch } from "@/lib/master";
import { UNIVERSITIES } from "@/lib/master/universities";
import { getAllTextbooks } from "@/lib/master/textbooks";
import { MOCK_EXAMS } from "@/lib/master/mockexams";
import {
  remoteEnabled,
  remoteSearchMockExams,
  remoteSearchTextbooks,
  remoteSearchUniversities,
} from "@/lib/master/remote";
import type {
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
import { IconBadge } from "@/components/ui/IconBadge";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { haptic } from "@/lib/haptic";

type Tab = "university" | "textbook" | "mock-exam";

const TABS: { id: Tab; label: string; icon: typeof Building2 }[] = [
  { id: "university", label: "大学", icon: Building2 },
  { id: "textbook", label: "参考書", icon: BookOpen },
  { id: "mock-exam", label: "模試", icon: ScrollText },
];

const POPULAR_UNI_IDS = [
  "u-tokyo", "u-kyoto", "waseda", "keio", "hitotsubashi",
  "titech", "osaka", "nagoya", "sophia", "rikadai", "meiji", "doshisha",
];
const POPULAR_BOOK_IDS = [
  "tb-math-yellow-chart", "tb-math-blue-chart", "tb-math-1taich",
  "tb-eng-target1900", "tb-eng-system", "tb-eng-vintage",
  "tb-jp-genbun-akahon", "tb-jp-kobun-tango",
];

const HISTORY_KEY = "testall.searchHistory";
const HISTORY_LIMIT = 5;

function loadHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((x): x is string => typeof x === "string").slice(0, HISTORY_LIMIT);
    return [];
  } catch {
    return [];
  }
}

function saveHistory(items: readonly string[]): void {
  try {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, HISTORY_LIMIT)));
  } catch {}
}

export function SearchView() {
  const { state, hydrated } = useStore();
  const [tab, setTab] = useState<Tab>("university");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 220);
  const [focused, setFocused] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [addModal, setAddModal] = useState<AddEntityKind | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  // debounced query が確定したら履歴に積む
  useEffect(() => {
    const q = debouncedQuery.trim();
    if (q.length < 2) return;
    setHistory((prev) => {
      if (prev[0] === q) return prev;
      const next = [q, ...prev.filter((x) => x !== q)].slice(0, HISTORY_LIMIT);
      saveHistory(next);
      return next;
    });
  }, [debouncedQuery]);

  const [uniArea, setUniArea] = useState<"all" | "humanities" | "sciences">("all");
  const [uniRegion, setUniRegion] = useState<string>("all");
  const [uniTier, setUniTier] = useState<string>("all");
  const [bookArea, setBookArea] = useState<"all" | SubjectAreaId>("all");
  const [bookLevel, setBookLevel] = useState<"all" | TextbookLevel>("all");
  const [bookPublisher, setBookPublisher] = useState<string>("all");
  const [examProvider, setExamProvider] = useState<"all" | MockExamProvider>("all");
  const [examGrade, setExamGrade] = useState<string>("all");

  const [remoteRes, setRemoteRes] = useState<{
    universities: University[];
    textbooks: Textbook[];
    mockExams: MockExam[];
  } | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const useRemote = remoteEnabled();

  useEffect(() => {
    if (!useRemote) return;
    const q = debouncedQuery.trim();
    if (!q) { setRemoteRes(null); return; }
    setRemoteLoading(true);
    let cancelled = false;
    (async () => {
      const [universities, textbooks, mockExams] = await Promise.all([
        remoteSearchUniversities(q, 30),
        remoteSearchTextbooks(q, 30),
        remoteSearchMockExams(q, 30),
      ]);
      if (cancelled) return;
      setRemoteRes({ universities, textbooks, mockExams });
      setRemoteLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, useRemote]);

  const items = useMemo(() => {
    if (tab === "university") {
      const all = remoteRes?.universities ?? (debouncedQuery.trim()
        ? unifiedSearch({ query: debouncedQuery, kinds: ["university"], limit: 30 }).universities.map((h) => h.entity)
        : UNIVERSITIES);
      const filtered = applyUniFilter(all, uniArea, uniRegion, uniTier);
      return filtered.slice(0, 40);
    }
    if (tab === "textbook") {
      const allBooks = getAllTextbooks();
      const all = remoteRes?.textbooks ?? (debouncedQuery.trim()
        ? allBooks.filter((b) => {
            const q = debouncedQuery.trim().toLowerCase();
            return (
              b.searchText?.toLowerCase().includes(q) ||
              b.name.toLowerCase().includes(q) ||
              b.publisher.toLowerCase().includes(q) ||
              (b.author ?? "").toLowerCase().includes(q)
            );
          })
        : allBooks);
      const filtered = applyBookFilter(all, bookArea, bookLevel, bookPublisher);
      return [...filtered].sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999)).slice(0, 50);
    }
    const all = remoteRes?.mockExams ?? (debouncedQuery.trim()
      ? unifiedSearch({ query: debouncedQuery, kinds: ["mock-exam"], limit: 30 }).mockExams.map((h) => h.entity)
      : MOCK_EXAMS);
    return applyExamFilter(all, examProvider, examGrade).slice(0, 30);
  }, [tab, debouncedQuery, remoteRes, uniArea, uniRegion, uniTier, bookArea, bookLevel, bookPublisher, examProvider, examGrade]);

  // 人気ピック（横スクロール用、クエリなし時のみ）
  const popularForTab = useMemo(() => {
    if (tab === "university") {
      return POPULAR_UNI_IDS
        .map((id) => UNIVERSITIES.find((u) => u.id === id))
        .filter((u): u is University => !!u);
    }
    if (tab === "textbook") {
      const allBooks = getAllTextbooks();
      return POPULAR_BOOK_IDS
        .map((id) => allBooks.find((b) => b.id === id))
        .filter((b): b is Textbook => !!b);
    }
    return [];
  }, [tab]);

  const filterCount =
    tab === "university"
      ? (uniArea !== "all" ? 1 : 0) + (uniRegion !== "all" ? 1 : 0) + (uniTier !== "all" ? 1 : 0)
      : tab === "textbook"
      ? (bookArea !== "all" ? 1 : 0) + (bookLevel !== "all" ? 1 : 0) + (bookPublisher !== "all" ? 1 : 0)
      : (examProvider !== "all" ? 1 : 0) + (examGrade !== "all" ? 1 : 0);

  const addKind: AddEntityKind = tab as AddEntityKind;
  const tabLabel = tab === "university" ? "大学" : tab === "textbook" ? "参考書" : "模試";

  return (
    <div className="px-5 pb-8 pt-2 space-y-3">
      {/* Header */}
      <h1
        className="text-[28px] font-extrabold tracking-[-0.025em] text-ink-900"
        style={{ fontFamily: "var(--font-display)" }}
      >
        探す
      </h1>

      {/* 検索バー */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" strokeWidth={1.75} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          placeholder="大学・参考書・模試で検索"
          className="h-12 w-full rounded-2xl border border-ink-100/80 bg-white pl-10 pr-10 text-[13px] text-ink-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              haptic.light();
              setQuery("");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-ink-200 text-ink-600"
            aria-label="検索をクリア"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        ) : null}
      </div>

      {/* 検索履歴 — query が空 + focus or 履歴あり時のみ */}
      {!query.trim() && history.length > 0 && (focused || true) ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold text-ink-400">最近の検索</span>
          {history.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => {
                haptic.light();
                setQuery(h);
              }}
              className="inline-flex h-7 items-center gap-1 rounded-full bg-cream-100 px-2.5 text-[11px] font-medium text-ink-700 transition active:scale-[0.96]"
            >
              <Search className="h-3 w-3 text-ink-400" strokeWidth={2} />
              {h}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              haptic.light();
              saveHistory([]);
              setHistory([]);
            }}
            className="ml-auto text-[10px] font-medium text-ink-400"
          >
            クリア
          </button>
        </div>
      ) : null}

      {/* リモート接続インジケータは PDF デザインでは非表示。検索中のみ控えめに出す。 */}
      {useRemote && remoteLoading ? (
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-ink-400">
          <Cloud className="h-3.5 w-3.5 text-mint-500" strokeWidth={1.75} />
          検索中…
        </div>
      ) : null}

      {/* タブ + フィルタ */}
      <div className="flex items-center gap-2">
        <ul className="flex flex-1 gap-1.5 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <li key={t.id} className="flex-none">
              <button
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex h-9 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium transition",
                  tab === t.id
                    ? "bg-ink-900 text-white shadow-soft"
                    : "bg-white text-ink-700 border border-ink-100/80 hover:bg-cream-50",
                )}
              >
                <t.icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                {t.label}
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setFilterOpen((v) => !v)}
          className={cn(
            "flex h-9 flex-none items-center gap-1.5 rounded-full px-3 text-[12px] font-medium transition",
            filterCount > 0
              ? "bg-ink-900 text-white"
              : "bg-white text-ink-700 border border-ink-100/80 hover:bg-cream-50",
          )}
        >
          <Filter className="h-3.5 w-3.5" strokeWidth={1.75} />
          絞り込み
          {filterCount > 0 ? (
            <span className="ml-0.5 rounded-full bg-white/20 px-1.5 tabular-nums text-[10px]">
              {filterCount}
            </span>
          ) : null}
        </button>
      </div>

      {/* フィルタパネル */}
      {filterOpen ? (
        <div className="rounded-2xl border border-cream-200 bg-white p-4 shadow-soft">
          {tab === "university" ? (
            <UniversityFilter
              area={uniArea} setArea={setUniArea}
              region={uniRegion} setRegion={setUniRegion}
              tier={uniTier} setTier={setUniTier}
            />
          ) : tab === "textbook" ? (
            <TextbookFilter
              area={bookArea} setArea={setBookArea}
              level={bookLevel} setLevel={setBookLevel}
              publisher={bookPublisher} setPublisher={setBookPublisher}
            />
          ) : (
            <MockExamFilter
              provider={examProvider} setProvider={setExamProvider}
              grade={examGrade} setGrade={setExamGrade}
            />
          )}
        </div>
      ) : null}

      {/* 人気ピック横スクロール — クエリなし時のみ */}
      {!debouncedQuery.trim() && popularForTab.length > 0 ? (
        <section className="space-y-2">
          <SectionLabel title="人気ピック" />
          <ul className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar snap-x">
            {popularForTab.map((item) =>
              tab === "university" ? (
                <li key={(item as University).id} className="flex-none snap-start">
                  <PopularUniCard u={item as University} />
                </li>
              ) : tab === "textbook" ? (
                <li key={(item as Textbook).id} className="flex-none snap-start">
                  <PopularBookCard b={item as Textbook} />
                </li>
              ) : null
            )}
          </ul>
          <SectionLabel title={`すべての${tabLabel}`} />
        </section>
      ) : !debouncedQuery.trim() ? (
        <SectionLabel title={`すべての${tabLabel}`} />
      ) : null}

      {/* 結果リスト */}
      <ul className="space-y-2">
        {tab === "university"
          ? items.map((u) => <UniversityCard key={(u as University).id} u={u as University} />)
          : tab === "textbook"
          ? items.map((b) => (
              <TextbookCard
                key={(b as Textbook).id}
                b={b as Textbook}
                owned={hydrated && (state.profile?.textbooks ?? []).includes((b as Textbook).name)}
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
          : items.map((m) => <MockExamCard key={(m as MockExam).id} m={m as MockExam} />)}
        {items.length === 0 ? (
          <li className="rounded-2xl border border-ink-100/80 bg-white p-8 text-center">
            <p className="text-[13px] text-ink-500">条件に該当なし</p>
          </li>
        ) : null}
      </ul>

      {/* 手動追加 */}
      <button
        type="button"
        onClick={() => setAddModal(addKind)}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-cream-200 bg-white p-4 text-[12px] font-medium text-ink-500 hover:border-sky-300 hover:bg-sky-50 transition"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
        一覧にない{tabLabel}を追加
      </button>

      {addModal ? (
        <AddEntityModal
          kind={addModal}
          initialName={debouncedQuery.trim() || undefined}
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
      const isHumanities = cats.some((c) => ["letters", "law", "economics", "social"].includes(c));
      const isSciences = cats.some((c) => ["science", "engineering", "medical", "agriculture", "info"].includes(c));
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
      <div className="text-[11px] font-medium text-ink-500">{label}</div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "h-7 rounded-full px-3 text-[11px] font-medium transition active:scale-[0.96]",
              value === o.value
                ? "bg-sky-500 text-white shadow-soft"
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
  area, setArea, region, setRegion, tier, setTier,
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
          ...["北海道", "東北", "関東", "中部", "関西", "中国", "四国", "九州"].map((r) => ({ value: r, label: r })),
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
  area, setArea, level, setLevel, publisher, setPublisher,
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
  provider, setProvider, grade, setGrade,
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

// ───── カードコンポーネント ─────
function UniversityCard({ u }: { u: University }) {
  const devs = u.faculties
    .map((f) => f.deviation)
    .filter((v): v is number => typeof v === "number");
  const minDev = devs.length ? Math.min(...devs) : undefined;
  const maxDev = devs.length ? Math.max(...devs) : undefined;

  const tierTone: Record<string, string> = {
    S: "bg-coral-300/30 text-coral-600",
    A: "bg-coral-100 text-coral-500",
    B: "bg-sky-100 text-sky-600",
    C: "bg-mint-100 text-mint-600",
    D: "bg-cream-100 text-ink-600",
  };

  return (
    <li>
      <button
        type="button"
        className="w-full flex items-center gap-3 rounded-2xl border border-cream-200 bg-white p-3 shadow-soft text-left hover:bg-cream-50 transition"
      >
        <IconBadge tone="primary" size="md">
          <Building2 strokeWidth={1.75} />
        </IconBadge>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[14px] font-bold text-ink-900">{u.name}</span>
            {u.tier ? (
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", tierTone[u.tier] ?? "bg-cream-100 text-ink-600")}>
                {TIER_LABEL[u.tier]}
              </span>
            ) : null}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-400">
            <span>{u.region}</span>
            <span>·</span>
            <span>全{u.faculties.length}学部</span>
            {minDev !== undefined && maxDev !== undefined ? (
              <>
                <span>·</span>
                <span className="font-medium text-ink-600 tabular-nums">偏差値 {minDev}–{maxDev}</span>
              </>
            ) : null}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 flex-none text-ink-300" strokeWidth={1.75} />
      </button>
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
  advanced: "bg-coral-100 text-coral-500",
  top: "bg-coral-300 text-white",
};

function TextbookCard({
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
      <div className="flex items-start gap-3">
        <IconBadge tone="warning" size="md">
          <BookOpen strokeWidth={1.75} />
        </IconBadge>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1.5 flex-wrap">
            <span className={cn("mt-0.5 flex-none rounded-full px-2 py-0.5 text-[10px] font-medium", LEVEL_TONE[b.level])}>
              {LEVEL_LABEL[b.level]}
            </span>
            {b.rank !== undefined && b.rank <= 20 ? (
              <span className="mt-0.5 flex-none rounded-full bg-sun-200 px-2 py-0.5 text-[10px] font-bold text-ink-800 tabular-nums">
                #{b.rank}
              </span>
            ) : null}
          </div>
          <div className="mt-1 text-[13px] font-bold text-ink-900 line-clamp-1">{b.name}</div>
          <div className="mt-0.5 text-[11px] text-ink-400">{b.publisher}</div>
          {b.description ? (
            <p className="mt-1 text-[11px] text-ink-600 line-clamp-2">{b.description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onToggleOwn(b.name)}
          className={cn(
            "flex h-8 flex-none items-center gap-1 rounded-full px-2.5 text-[11px] font-medium transition",
            owned
              ? "bg-mint-500 text-white"
              : "bg-cream-100 text-ink-600 hover:bg-cream-200",
          )}
        >
          {owned ? <Check className="h-3.5 w-3.5" strokeWidth={2} /> : null}
          持ってる
        </button>
      </div>
    </li>
  );
}

function MockExamCard({ m }: { m: MockExam }) {
  const providerTone: Record<string, string> = {
    kawai: "bg-sky-100 text-sky-700",
    sundai: "bg-coral-100 text-coral-500",
    toshin: "bg-mint-100 text-mint-600",
    yozemi: "bg-sun-200 text-ink-700",
    benesse: "bg-cream-100 text-ink-700",
  };

  return (
    <li>
      <button
        type="button"
        className="w-full flex items-center gap-3 rounded-2xl border border-cream-200 bg-white p-3 shadow-soft text-left hover:bg-cream-50 transition"
      >
        <IconBadge tone="info" size="md">
          <ScrollText strokeWidth={1.75} />
        </IconBadge>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", providerTone[m.provider] ?? "bg-cream-100 text-ink-600")}>
              {PROVIDER_LABEL[m.provider]}
            </span>
          </div>
          <div className="mt-0.5 text-[13px] font-bold text-ink-900 line-clamp-1">{m.name}</div>
          <div className="mt-0.5 text-[11px] text-ink-400">
            {m.examDate ?? "—"} · {m.targetGrades.join("/")} · {m.year}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 flex-none text-ink-300" strokeWidth={1.75} />
      </button>
    </li>
  );
}

// ───── 人気ピック・コンパクトカード（横スクロール用） ─────
const TIER_STRIPE: Record<string, string> = {
  S: "bg-coral-500",
  A: "bg-coral-400",
  B: "bg-sky-500",
  C: "bg-mint-500",
  D: "bg-cream-300",
};

const SUBJECT_STRIPE: Record<string, string> = {
  japanese: "bg-coral-400",
  math: "bg-sky-500",
  english: "bg-mint-500",
  science: "bg-sun-400",
  social: "bg-ink-400",
};

function PopularUniCard({ u }: { u: University }) {
  const devs = u.faculties
    .map((f) => f.deviation)
    .filter((d): d is number => typeof d === "number");
  const maxDev = devs.length ? Math.max(...devs) : null;

  return (
    <button
      type="button"
      className="flex h-[116px] w-[104px] flex-col rounded-[18px] border border-cream-200 bg-white p-3 text-left shadow-soft transition active:scale-[0.97]"
    >
      <div className={cn("h-[3px] w-full rounded-full", TIER_STRIPE[u.tier ?? "D"] ?? "bg-cream-300")} />
      <div className="mt-2 flex-1 text-[12px] font-extrabold leading-snug tracking-[-0.02em] text-ink-900 line-clamp-3">
        {u.name}
      </div>
      <div className="mt-1 text-[10px] text-ink-400 truncate">{u.region}</div>
      {maxDev !== null ? (
        <div className="mt-0.5 text-[11px] font-bold tabular-nums text-ink-500">
          {maxDev}
        </div>
      ) : null}
    </button>
  );
}

function PopularBookCard({ b }: { b: Textbook }) {
  return (
    <button
      type="button"
      className="flex h-[116px] w-[104px] flex-col rounded-[18px] border border-cream-200 bg-white p-3 text-left shadow-soft transition active:scale-[0.97]"
    >
      <div className={cn("h-[3px] w-full rounded-full", SUBJECT_STRIPE[b.subject] ?? "bg-cream-300")} />
      <div className="mt-2 flex-1 text-[11px] font-extrabold leading-snug tracking-[-0.02em] text-ink-900 line-clamp-4">
        {b.name}
      </div>
      <span className={cn("mt-1 self-start rounded-full px-1.5 py-0.5 text-[9px] font-bold", LEVEL_TONE[b.level])}>
        {LEVEL_LABEL[b.level]}
      </span>
    </button>
  );
}
