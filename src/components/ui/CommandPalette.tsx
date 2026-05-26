"use client";

// グローバル検索パレット (Spotlight / Linear / Notion 風)
// Cmd+K で開く半透明オーバーレイ。
// テスト・タスク・本棚・大学・参考書・主要ナビを横断検索。
// ↑↓ で選択、Enter で遷移、Esc で閉じる。

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckSquare,
  ClipboardList,
  CornerDownLeft,
  FileText,
  Home,
  Search,
  Settings,
  Sparkles,
  Target,
  Timer,
  User,
  CalendarRange,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/hooks/useStore";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { haptic } from "@/lib/haptic";

interface CommandItem {
  id: string;
  label: string;
  sub?: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  group: "ナビゲーション" | "テスト" | "タスク" | "本棚" | "クイックアクション";
}

const NAV_ITEMS: CommandItem[] = [
  { id: "nav-home", label: "ホーム", sub: "今日のプラン", href: "/app", icon: Home, group: "ナビゲーション" },
  { id: "nav-todo", label: "TODO", sub: "タスク一覧", href: "/app/todo", icon: CheckSquare, group: "ナビゲーション" },
  { id: "nav-focus", label: "集中", sub: "25分タイマー", href: "/app/focus", icon: Timer, group: "ナビゲーション" },
  { id: "nav-plan", label: "計画", sub: "月カレンダー", href: "/app/plan", icon: CalendarRange, group: "ナビゲーション" },
  { id: "nav-me", label: "マイページ", sub: "実力パラメーター", href: "/app/me", icon: User, group: "ナビゲーション" },
  { id: "nav-search", label: "探す", sub: "大学・参考書・模試", href: "/app/search", icon: Search, group: "ナビゲーション" },
  { id: "nav-ai", label: "AI コーチ", sub: "Sara に相談", href: "/app/ai", icon: Sparkles, group: "ナビゲーション" },
  { id: "nav-settings", label: "設定", href: "/app/me/settings", icon: Settings, group: "ナビゲーション" },
];

const QUICK_ACTIONS: CommandItem[] = [
  { id: "qa-test-new", label: "テストを追加", sub: "新規診断", href: "/app/test/new", icon: FileText, group: "クイックアクション" },
  { id: "qa-todo-new", label: "タスクを追加", sub: "今日やること", href: "/app/todo?new=1", icon: ClipboardList, group: "クイックアクション" },
  { id: "qa-focus-run", label: "今すぐ25分集中", sub: "Free Focus", href: "/app/focus/run", icon: Target, group: "クイックアクション" },
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { state } = useStore();
  const [query, setQuery] = useState<string>("");
  const debouncedQuery = useDebounce(query, 80);
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const trapRef = useFocusTrap<HTMLDivElement>(open);

  // 開いた時に query を消して input に focus
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      window.setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // body scroll lock + Esc 閉じ
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // 検索対象を構築
  const items: CommandItem[] = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    const fromTests: CommandItem[] = (state.tests ?? []).slice(0, 20).map((t) => ({
      id: `test-${t.id}`,
      label: t.input.testName,
      sub: `${t.input.subject} · ${t.input.score}/${t.input.fullScore}`,
      href: `/app/test/${t.id}`,
      icon: FileText,
      group: "テスト",
    }));
    const fromTasks: CommandItem[] = (state.tasks ?? [])
      .filter((t) => t.status !== "done")
      .slice(0, 20)
      .map((t) => ({
        id: `task-${t.id}`,
        label: t.title,
        sub: `${t.blocks * 25}分`,
        href: "/app/todo",
        icon: ClipboardList,
        group: "タスク",
      }));
    const fromShelf: CommandItem[] = (state.profile?.bookshelfItems ?? []).slice(0, 20).map((b) => ({
      id: `shelf-${b.id}`,
      label: b.name,
      sub: "本棚",
      href: "/app/me",
      icon: BookOpen,
      group: "本棚",
    }));
    const fromTargets: CommandItem[] = (state.profile?.targetUniversities ?? []).map((u, i) => ({
      id: `uni-${i}`,
      label: u.faculty ? `${u.universityId} ${u.faculty}` : u.universityId,
      sub: "志望校",
      href: "/app/me",
      icon: Building2,
      group: "本棚",
    }));

    const all = [...NAV_ITEMS, ...QUICK_ACTIONS, ...fromTests, ...fromTasks, ...fromShelf, ...fromTargets];
    if (!q) return all.slice(0, 30);
    return all.filter((it) => {
      const hay = `${it.label} ${it.sub ?? ""}`.toLowerCase();
      return hay.includes(q);
    }).slice(0, 40);
  }, [debouncedQuery, state.tests, state.tasks, state.profile]);

  // グループ化 + 描画時に flat 内インデックスを事前計算 (O(n) なくす)
  const grouped = useMemo(() => {
    const map = new Map<string, Array<CommandItem & { _idx: number }>>();
    items.forEach((it, idx) => {
      if (!map.has(it.group)) map.set(it.group, []);
      map.get(it.group)!.push({ ...it, _idx: idx });
    });
    return Array.from(map.entries());
  }, [items]);

  // 全アイテムの flat 配列 (キーボードナビ用)
  const flat = items;

  // activeIdx を範囲内に
  useEffect(() => {
    if (activeIdx >= flat.length) setActiveIdx(Math.max(0, flat.length - 1));
  }, [flat.length, activeIdx]);

  function navigate(item: CommandItem) {
    haptic.medium();
    onClose();
    router.push(item.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = flat[activeIdx];
      if (it) navigate(it);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-ink-900/55 backdrop-blur-md px-4 pt-[10vh] sm:pt-[15vh]"
      role="dialog"
      aria-modal="true"
      aria-label="グローバル検索"
      onClick={onClose}
    >
      <div
        ref={trapRef}
        onClick={(e) => e.stopPropagation()}
        className="sheet-in w-full max-w-[520px] overflow-hidden rounded-2xl bg-cream-50 shadow-pop"
      >
        {/* Input */}
        <div className="flex items-center gap-2 border-b border-ink-100 px-4">
          <Search className="h-4 w-4 flex-none text-ink-400" strokeWidth={1.75} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIdx(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="何を探す？ (テスト / タスク / 本 / 機能)"
            className="h-12 w-full bg-transparent text-[14px] text-ink-900 outline-none placeholder:text-ink-300"
          />
          <kbd className="hidden sm:flex h-5 items-center rounded bg-cream-200/70 px-1.5 text-[10px] font-bold text-ink-500">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-1.5">
          {flat.length === 0 ? (
            <div className="px-3 py-10 text-center text-[12px] text-ink-400">
              該当なし
            </div>
          ) : (
            grouped.map(([group, list]) => (
              <div key={group} className="mb-1.5">
                <div className="px-3 pb-1 pt-2 text-[10px] font-bold text-ink-400">
                  {group}
                </div>
                <ul>
                  {list.map((it) => {
                    const idxInFlat = it._idx;
                    const isActive = idxInFlat === activeIdx;
                    const Icon = it.icon;
                    return (
                      <li key={it.id}>
                        <button
                          type="button"
                          onClick={() => navigate(it)}
                          onMouseEnter={() => setActiveIdx(idxInFlat)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                            isActive ? "bg-sky-50 text-ink-900" : "text-ink-700",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-7 w-7 flex-none items-center justify-center rounded-lg",
                              isActive ? "bg-sky-100 text-sky-600" : "bg-cream-100 text-ink-500",
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-bold">
                              {it.label}
                            </span>
                            {it.sub ? (
                              <span className="block truncate text-[10px] text-ink-500">
                                {it.sub}
                              </span>
                            ) : null}
                          </span>
                          {isActive ? (
                            <ArrowRight
                              className="h-3.5 w-3.5 flex-none text-sky-500"
                              strokeWidth={2}
                            />
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center justify-between border-t border-ink-100 px-3 py-2 text-[10px] text-ink-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-cream-200/70 px-1 font-bold text-ink-600">↑</kbd>
              <kbd className="rounded bg-cream-200/70 px-1 font-bold text-ink-600">↓</kbd>
              選択
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="h-2.5 w-2.5" />
              開く
            </span>
          </div>
          <span>{flat.length} 件</span>
        </div>
      </div>
    </div>
  );
}
