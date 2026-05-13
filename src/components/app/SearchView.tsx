"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Building2,
  Check,
  Cloud,
  GraduationCap,
  Plus,
  ScrollText,
  Search,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/hooks/useStore";
import { setProfile } from "@/lib/store";
import { unifiedSearch } from "@/lib/master";
import {
  remoteEnabled,
  remoteSearchHighschools,
  remoteSearchMockExams,
  remoteSearchTextbooks,
  remoteSearchUniversities,
} from "@/lib/master/remote";
import type {
  Highschool,
  MockExam,
  Textbook,
  University,
} from "@/lib/master";
import {
  PROVIDER_LABEL,
} from "@/lib/master/mockexams";
import { TIER_LABEL } from "@/lib/master/universities";
import { AddEntityModal, type AddEntityKind } from "@/components/master/AddEntityModal";

type Tab = "all" | "university" | "highschool" | "textbook" | "mock-exam" | "article";

const TABS: { id: Tab; label: string; icon: typeof Building2 }[] = [
  { id: "all", label: "すべて", icon: Sparkles },
  { id: "university", label: "大学", icon: Building2 },
  { id: "highschool", label: "高校", icon: GraduationCap },
  { id: "textbook", label: "参考書", icon: BookOpen },
  { id: "mock-exam", label: "模試", icon: ScrollText },
  { id: "article", label: "記事", icon: Sparkles },
];

const ARTICLES = [
  { id: "a1", title: "高2の冬から逆転合格するための戦略3つ", tags: ["#戦略", "#高2"] },
  {
    id: "a2",
    title: "国公立大学の共通テスト対策ロードマップ（2025年版）",
    tags: ["#共通テスト", "#国公立"],
  },
  { id: "a3", title: "数学の青チャートを3周する勉強法", tags: ["#数学", "#参考書"] },
  { id: "a4", title: "英語長文を時間内に解くための3つのコツ", tags: ["#英語", "#長文"] },
];

type RemoteResults = {
  universities: University[];
  highschools: Highschool[];
  textbooks: Textbook[];
  mockExams: MockExam[];
};

export function SearchView() {
  const { state, hydrated } = useStore();
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [addModal, setAddModal] = useState<AddEntityKind | null>(null);
  const [remote, setRemote] = useState<RemoteResults | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const useRemote = remoteEnabled();

  // ローカル seed の即時表示
  const localResults = useMemo(() => {
    if (!query.trim()) {
      return unifiedSearch({ query: "a", limit: 5 });
    }
    return unifiedSearch({ query, limit: tab === "all" ? 5 : 20 });
  }, [query, tab]);

  // Supabase に問い合わせ（300ms デバウンス）
  useEffect(() => {
    if (!useRemote) return;
    const q = query.trim();
    if (!q) {
      setRemote(null);
      return;
    }
    setRemoteLoading(true);
    const t = setTimeout(async () => {
      const limit = tab === "all" ? 5 : 30;
      const [universities, highschools, textbooks, mockExams] = await Promise.all([
        remoteSearchUniversities(q, limit),
        remoteSearchHighschools(q, limit),
        remoteSearchTextbooks(q, limit),
        remoteSearchMockExams(q, limit),
      ]);
      setRemote({ universities, highschools, textbooks, mockExams });
      setRemoteLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query, tab, useRemote]);

  // 表示用: remote ヒットがあれば優先、なければ local seed
  const results = useMemo(() => {
    if (remote) {
      return {
        universities: remote.universities.map((entity) => ({
          kind: "university" as const,
          score: 50,
          entity,
        })),
        highschools: remote.highschools.map((entity) => ({
          kind: "highschool" as const,
          score: 50,
          entity,
        })),
        textbooks: remote.textbooks.map((entity) => ({
          kind: "textbook" as const,
          score: 50,
          entity,
        })),
        mockExams: remote.mockExams.map((entity) => ({
          kind: "mock-exam" as const,
          score: 50,
          entity,
        })),
      };
    }
    return localResults;
  }, [remote, localResults]);

  const showUni = tab === "all" || tab === "university";
  const showHs = tab === "all" || tab === "highschool";
  const showBook = tab === "all" || tab === "textbook";
  const showExam = tab === "all" || tab === "mock-exam";
  const showArticle = tab === "all" || tab === "article";

  return (
    <div className="px-4 pt-3 pb-32">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="大学・高校・参考書・模試で検索"
          className="h-11 w-full rounded-2xl border border-cream-200 bg-white pl-9 pr-3 text-sm text-ink-900 outline-none focus:border-sky-400"
        />
      </div>

      {useRemote ? (
        <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-ink-500">
          <Cloud className="h-3 w-3 text-mint-600" />
          {remoteLoading
            ? "Supabase で検索中…"
            : `Supabase 接続中（${query.trim() ? "リモート結果" : "ローカルseed"}）`}
        </div>
      ) : null}

      {/* Tabs */}
      <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
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
              {t.label}
            </button>
          </li>
        ))}
      </ul>

      {/* 大学 */}
      {showUni ? (
        <Section
          title="大学"
          icon={Building2}
          empty={results.universities.length === 0 && !!query.trim()}
          onAdd={() => setAddModal("university")}
        >
          {results.universities.map((h) => (
            <UniversityRow key={h.entity.id} u={h.entity} />
          ))}
        </Section>
      ) : null}

      {/* 高校 */}
      {showHs ? (
        <Section
          title="高校"
          icon={GraduationCap}
          empty={results.highschools.length === 0 && !!query.trim()}
          onAdd={() => setAddModal("highschool")}
        >
          {results.highschools.map((h) => (
            <HighschoolRow key={h.entity.id} h={h.entity} />
          ))}
        </Section>
      ) : null}

      {/* 参考書 */}
      {showBook ? (
        <Section
          title="参考書"
          icon={BookOpen}
          empty={results.textbooks.length === 0 && !!query.trim()}
          onAdd={() => setAddModal("textbook")}
        >
          {results.textbooks.map((h) => (
            <TextbookRow
              key={h.entity.id}
              b={h.entity}
              owned={
                hydrated && (state.profile?.textbooks ?? []).includes(h.entity.name)
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
          ))}
        </Section>
      ) : null}

      {/* 模試 */}
      {showExam ? (
        <Section
          title="模試"
          icon={ScrollText}
          empty={results.mockExams.length === 0 && !!query.trim()}
          onAdd={() => setAddModal("mock-exam")}
        >
          {results.mockExams.map((h) => (
            <MockExamRow key={h.entity.id} m={h.entity} />
          ))}
        </Section>
      ) : null}

      {/* 記事 */}
      {showArticle ? (
        <section className="mt-6">
          <SectionHeader icon={Sparkles} title="記事" />
          <ul className="mt-2 space-y-1.5">
            {ARTICLES.map((a) => (
              <li
                key={a.id}
                className="rounded-2xl border border-cream-200 bg-white p-3 shadow-soft"
              >
                <div className="text-sm font-bold text-ink-900">{a.title}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {a.tags.map((tg) => (
                    <span
                      key={tg}
                      className="rounded-full bg-cream-100 px-2 py-0.5 text-[10px] font-bold text-ink-500"
                    >
                      {tg}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-center text-[11px] text-ink-400">
            （記事は近日公開。AI受験戦略の連載を準備中）
          </p>
        </section>
      ) : null}

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

// ─── 各種行 ────────────────────────────────
function Section({
  title,
  icon,
  empty,
  onAdd,
  children,
}: {
  title: string;
  icon: typeof Building2;
  empty?: boolean;
  onAdd?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5">
      <div className="flex items-center justify-between">
        <SectionHeader icon={icon} title={title} />
        {onAdd ? (
          <button
            type="button"
            onClick={onAdd}
            className="flex h-7 items-center gap-1 rounded-full bg-cream-100 px-2.5 text-[10px] font-bold text-ink-700 hover:bg-cream-200"
          >
            <Plus className="h-3 w-3" />
            追加
          </button>
        ) : null}
      </div>
      <ul className="mt-2 space-y-1.5">{children}</ul>
      {empty ? (
        <button
          type="button"
          onClick={onAdd}
          className="mt-2 flex w-full items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-cream-200 bg-white p-4 text-xs text-ink-500 hover:border-sky-300 hover:bg-sky-50"
        >
          <Plus className="h-3.5 w-3.5" />
          見つからない場合は手動で追加
        </button>
      ) : null}
    </section>
  );
}

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: typeof Building2;
  title: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-ink-500" />
      <h2 className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
        {title}
      </h2>
    </div>
  );
}

function UniversityRow({ u }: { u: University }) {
  const devs = u.faculties.map((f) => f.deviation).filter((v): v is number => typeof v === "number");
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

function HighschoolRow({ h }: { h: Highschool }) {
  return (
    <li className="rounded-2xl border border-cream-200 bg-white p-3 shadow-soft">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-black text-ink-900">{h.name}</span>
        {h.deviation ? (
          <span className="flex-none rounded-full bg-cream-100 px-2 py-0.5 text-[10px] font-bold text-ink-700 tabular-nums">
            偏差値 {h.deviation}
          </span>
        ) : null}
      </div>
      <div className="mt-0.5 text-[10px] text-ink-500">
        {h.prefecture}
        {h.city ? ` · ${h.city}` : ""} ·{" "}
        {h.type === "private" ? "私立" : h.type === "national" ? "国立" : "公立"}
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
