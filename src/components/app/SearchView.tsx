"use client";

import { useMemo, useState } from "react";
import { BookOpen, Building2, Search, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/hooks/useStore";
import { setProfile } from "@/lib/store";
import {
  searchUniversities,
  TIER_LABEL,
  type University,
} from "@/lib/universities";
import { searchTextbooks, type Textbook } from "@/lib/textbooks";

type Tab = "all" | "university" | "textbook" | "article";

const TABS: { id: Tab; label: string; icon: typeof Building2 }[] = [
  { id: "all", label: "すべて", icon: Sparkles },
  { id: "university", label: "大学", icon: Building2 },
  { id: "textbook", label: "参考書", icon: BookOpen },
  { id: "article", label: "記事", icon: Sparkles },
];

const ARTICLES = [
  {
    id: "a1",
    title: "高2の冬から逆転合格するための戦略3つ",
    tags: ["#戦略", "#高2"],
  },
  {
    id: "a2",
    title: "国公立大学の共通テスト対策ロードマップ（2025年版）",
    tags: ["#共通テスト", "#国公立"],
  },
  {
    id: "a3",
    title: "数学の青チャートを3周する勉強法",
    tags: ["#数学", "#参考書"],
  },
  {
    id: "a4",
    title: "英語長文を時間内に解くための3つのコツ",
    tags: ["#英語", "#長文"],
  },
];

export function SearchView() {
  const { state, hydrated } = useStore();
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");

  const unis = useMemo(() => searchUniversities(query).slice(0, 12), [query]);
  const books = useMemo(() => searchTextbooks(query).slice(0, 20), [query]);

  return (
    <div className="px-4 pt-3 pb-32">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="大学・参考書・キーワード"
          className="h-11 w-full rounded-2xl border border-cream-200 bg-white pl-9 pr-3 text-sm text-ink-900 outline-none focus:border-sky-400"
        />
      </div>

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

      {/* Sections */}
      {tab === "all" || tab === "university" ? (
        <section className="mt-5">
          <SectionHeader icon={Building2} title="大学" />
          <ul className="mt-2 space-y-1.5">
            {unis.slice(0, tab === "university" ? 12 : 5).map((u) => (
              <UniversityRow key={u.id} u={u} />
            ))}
            {unis.length === 0 ? (
              <li className="rounded-2xl bg-white p-4 text-center text-xs text-ink-500">
                該当なし
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}

      {tab === "all" || tab === "textbook" ? (
        <section className="mt-6">
          <SectionHeader icon={BookOpen} title="参考書" />
          <ul className="mt-2 space-y-1.5">
            {books.slice(0, tab === "textbook" ? 20 : 6).map((b) => (
              <TextbookRow
                key={b.id}
                b={b}
                owned={
                  hydrated &&
                  (state.profile?.textbooks ?? []).includes(b.name)
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
          </ul>
        </section>
      ) : null}

      {tab === "all" || tab === "article" ? (
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
    </div>
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
  const minDev = Math.min(...u.faculties.map((f) => f.deviation));
  const maxDev = Math.max(...u.faculties.map((f) => f.deviation));
  return (
    <li className="rounded-2xl border border-cream-200 bg-white p-3 shadow-soft">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-black text-ink-900">{u.name}</span>
        <span className="flex-none rounded-full bg-cream-100 px-2 py-0.5 text-[10px] font-bold text-ink-700 tabular-nums">
          偏差値 {minDev}-{maxDev}
        </span>
      </div>
      <div className="mt-0.5 text-[10px] text-ink-500">
        {TIER_LABEL[u.tier]} · {u.region} · 全{u.faculties.length}学部
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
          <p className="mt-1 text-[11px] text-ink-700">{b.description}</p>
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
          {owned ? "持ってる" : "持ってる"}
        </button>
      </div>
    </li>
  );
}
