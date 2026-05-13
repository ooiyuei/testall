"use client";

// 本棚追加モーダル
// - 種類タブ (参考書/教科書/問題集/過去問/その他)
// - 人気セクション + 検索 + 絞り込み (科目・難易度・出版社)
// - ヒットなし → 手入力にフォールバック
// - バーコードスキャン → ISBN → /api/isbn-lookup で書籍情報を解決

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  BookOpen,
  Check,
  Filter,
  Loader2,
  Plus,
  ScanLine,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { addBookshelfItem } from "@/lib/store";
import type { BookshelfItem } from "@/lib/store";
import { TEXTBOOKS } from "@/lib/master/textbooks";
import type { Textbook, TextbookLevel } from "@/lib/master";
import { PUBLISHERS, SUBJECT_AREAS } from "@/lib/master/subjects";
import type { SubjectAreaId } from "@/lib/master/subjects";

// SSR で getUserMedia を触ると壊れるので client-only にする
const BarcodeScanner = dynamic(
  () => import("./BarcodeScanner").then((m) => m.BarcodeScanner),
  { ssr: false },
);

type LookupCustom = {
  isbn: string;
  title: string;
  author?: string;
  publisher?: string;
  pubdate?: string;
  coverUrl?: string;
};

type LookupOk =
  | { ok: true; source: "local"; textbook: Textbook }
  | { ok: true; source: "openbd"; custom: LookupCustom };

type LookupFail = { ok: false; error: string };

type LookupResponse = LookupOk | LookupFail;

const KIND_LABEL: Record<BookshelfItem["kind"], string> = {
  textbook: "参考書",
  "school-textbook": "教科書",
  workbook: "問題集",
  "past-exam": "過去問",
  other: "その他",
};

// 人気どころ (id) — TODO: 利用ログから自動算出
const POPULAR_IDS = [
  "tb-math-yellow-chart",
  "tb-math-blue-chart",
  "tb-math-1taich",
  "tb-eng-target1900",
  "tb-eng-system",
  "tb-eng-vintage",
  "tb-jp-genbun-akahon",
  "tb-jp-kobun-tango",
];

export function BookshelfAddModal({ onClose }: { onClose: () => void }) {
  const [kind, setKind] = useState<BookshelfItem["kind"]>("textbook");
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  // フィルタ
  const [filterArea, setFilterArea] = useState<"all" | SubjectAreaId>("all");
  const [filterLevel, setFilterLevel] = useState<"all" | TextbookLevel>("all");
  const [filterPub, setFilterPub] = useState<string>("all");
  const [manual, setManual] = useState(false);

  // バーコードスキャン関連
  const [scanOpen, setScanOpen] = useState(false);
  const [lookupState, setLookupState] = useState<
    | { phase: "idle" }
    | { phase: "loading"; isbn: string }
    | { phase: "found"; isbn: string; result: LookupOk }
    | { phase: "miss"; isbn: string; reason: string }
  >({ phase: "idle" });

  const handleDetect = useCallback(async (isbn: string) => {
    setScanOpen(false);
    setLookupState({ phase: "loading", isbn });
    try {
      const res = await fetch(
        `/api/isbn-lookup?isbn=${encodeURIComponent(isbn)}`,
      );
      const body = (await res.json()) as LookupResponse;
      if (body.ok) {
        setLookupState({ phase: "found", isbn, result: body });
      } else {
        setLookupState({ phase: "miss", isbn, reason: body.error });
      }
    } catch (e) {
      setLookupState({
        phase: "miss",
        isbn,
        reason: e instanceof Error ? e.message : "network_error",
      });
    }
  }, []);

  function confirmAddFromLookup() {
    if (lookupState.phase !== "found") return;
    const r = lookupState.result;
    if (r.source === "local") {
      const b = r.textbook;
      addBookshelfItem({
        id: `bk-${Date.now().toString(36)}-${b.id}`,
        name: b.name,
        kind,
        subjectArea: b.subject,
        isbn: b.isbn ?? lookupState.isbn,
        publisher: b.publisher,
        author: b.author,
        coverUrl: b.coverUrl,
      });
    } else {
      const c = r.custom;
      addBookshelfItem({
        id: `bk-${Date.now().toString(36)}-isbn-${c.isbn}`,
        name: c.title,
        kind,
        isbn: c.isbn,
        publisher: c.publisher,
        author: c.author,
        coverUrl: c.coverUrl,
      });
    }
    onClose();
  }

  function dismissLookup() {
    setLookupState({ phase: "idle" });
  }

  const filtered = useMemo(() => {
    let list = TEXTBOOKS;
    if (filterArea !== "all") {
      list = list.filter((b) =>
        filterArea === "history" || filterArea === "civics"
          ? b.subject === "social" || b.subject === filterArea
          : b.subject === filterArea,
      );
    }
    if (filterLevel !== "all") list = list.filter((b) => b.level === filterLevel);
    if (filterPub !== "all") list = list.filter((b) => b.publisher === filterPub);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((b) => b.searchText?.includes(q));
    }
    return list;
  }, [filterArea, filterLevel, filterPub, query]);

  const popular = useMemo(
    () =>
      POPULAR_IDS.map((id) => TEXTBOOKS.find((b) => b.id === id)).filter(
        (b): b is Textbook => !!b,
      ),
    [],
  );

  const noQuery = !query.trim() && filterArea === "all" && filterLevel === "all" && filterPub === "all";
  const list: Textbook[] = noQuery ? popular : filtered;

  function pick(b: Textbook) {
    addBookshelfItem({
      id: `bk-${Date.now().toString(36)}-${b.id}`,
      name: b.name,
      kind,
      subjectArea: b.subject,
    });
    onClose();
  }

  function activeFilterCount(): number {
    let n = 0;
    if (filterArea !== "all") n++;
    if (filterLevel !== "all") n++;
    if (filterPub !== "all") n++;
    return n;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-ink-900/40 backdrop-blur-[2px]">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="閉じる"
        onClick={onClose}
      />
      <div className="sheet-in relative z-10 mx-auto flex max-h-[92vh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-3xl bg-cream-50 shadow-pop">
        <div className="px-5 pt-3">
          <div className="mx-auto h-1 w-9 rounded-full bg-ink-200" />
          <div className="mt-3 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-ink-900">本棚に追加</h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-500 active:bg-cream-200"
              aria-label="閉じる"
            >
              <X className="h-[18px] w-[18px]" />
            </button>
          </div>

          {/* 種類タブ */}
          <ul className="mt-3 flex gap-1 overflow-x-auto rounded-xl bg-cream-100/70 p-1">
            {(Object.keys(KIND_LABEL) as BookshelfItem["kind"][]).map((k) => (
              <li key={k} className="flex-1">
                <button
                  type="button"
                  onClick={() => setKind(k)}
                  className={cn(
                    "flex h-9 w-full items-center justify-center rounded-lg text-[11px] font-bold whitespace-nowrap transition",
                    kind === k ? "bg-white text-ink-900 shadow-soft" : "text-ink-500",
                  )}
                >
                  {KIND_LABEL[k]}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* 検索 */}
        <div className="mt-3 px-5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="書名・著者で検索"
                className="h-10 w-full rounded-xl border border-ink-100/80 bg-white pl-8 pr-3 text-[13px] text-ink-900 outline-none focus:border-sky-400"
              />
            </div>
            <button
              type="button"
              onClick={() => setScanOpen(true)}
              aria-label="バーコードでスキャン"
              className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-ink-100/80 bg-white text-ink-700 active:bg-cream-50"
            >
              <ScanLine className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setFilterOpen((v) => !v)}
              className={cn(
                "flex h-10 flex-none items-center gap-1 rounded-xl border px-3 text-[11px] font-bold transition",
                activeFilterCount() > 0
                  ? "border-ink-900 bg-ink-900 text-white"
                  : "border-ink-100/80 bg-white text-ink-700",
              )}
            >
              <Filter className="h-3.5 w-3.5" />
              絞る
              {activeFilterCount() > 0 ? (
                <span className="ml-0.5 rounded-full bg-white/15 px-1.5 tabular-nums">
                  {activeFilterCount()}
                </span>
              ) : null}
            </button>
          </div>

          {/* フィルタパネル */}
          {filterOpen ? (
            <div className="mt-3 space-y-3 rounded-xl border border-ink-100/80 bg-white p-3">
              <Chips
                label="教科"
                value={filterArea}
                onChange={(v) => setFilterArea(v as typeof filterArea)}
                options={[
                  { value: "all", label: "すべて" },
                  ...SUBJECT_AREAS.map((a) => ({ value: a.id, label: a.name })),
                ]}
              />
              <Chips
                label="難易度"
                value={filterLevel}
                onChange={(v) => setFilterLevel(v as typeof filterLevel)}
                options={[
                  { value: "all", label: "すべて" },
                  { value: "basic", label: "基礎" },
                  { value: "standard", label: "標準" },
                  { value: "advanced", label: "応用" },
                  { value: "top", label: "最難関" },
                ]}
              />
              <Chips
                label="出版社"
                value={filterPub}
                onChange={setFilterPub}
                options={[
                  { value: "all", label: "すべて" },
                  ...PUBLISHERS.map((p) => ({ value: p, label: p })),
                ]}
              />
              {activeFilterCount() > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setFilterArea("all");
                    setFilterLevel("all");
                    setFilterPub("all");
                  }}
                  className="text-[10px] font-bold text-ink-500 underline-offset-2 hover:underline"
                >
                  絞り込みをクリア
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* リスト */}
        <div className="mt-3 flex-1 overflow-y-auto px-5 pb-4">
          {noQuery ? (
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
              人気の{KIND_LABEL[kind]}
            </div>
          ) : (
            <div className="mb-2 text-[10px] font-medium text-ink-500 tabular-nums">
              {list.length} 件
            </div>
          )}
          {list.length === 0 ? (
            <div className="rounded-xl border border-dashed border-ink-200 bg-white px-4 py-6 text-center">
              <p className="text-[12px] text-ink-500">該当する書籍が見つかりません</p>
              <button
                type="button"
                onClick={() => setManual(true)}
                className="mt-3 inline-flex h-9 items-center gap-1 rounded-full bg-ink-900 px-3 text-[11px] font-bold text-white"
              >
                <Plus className="h-3 w-3" strokeWidth={2.5} />
                手入力で追加
              </button>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {list.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => pick(b)}
                    className="group flex w-full items-start gap-3 rounded-xl border border-ink-100/80 bg-white p-3 text-left active:bg-cream-50 transition"
                  >
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-cream-100 text-ink-700">
                      <BookOpen className="h-[16px] w-[16px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                            LEVEL_TONE[b.level],
                          )}
                        >
                          {LEVEL_LABEL[b.level]}
                        </span>
                        <span className="line-clamp-1 text-[13px] font-bold text-ink-900">
                          {b.name}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-ink-500">
                        {b.publisher}
                      </div>
                    </div>
                    <Check className="mt-1 h-4 w-4 flex-none text-ink-300 group-active:text-mint-500" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* 手入力フォールバック */}
          {manual ? (
            <ManualInput
              kind={kind}
              initialName={query}
              onDone={onClose}
              onCancel={() => setManual(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setManual(true)}
              className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-ink-200 bg-white py-3 text-[11px] font-bold text-ink-500 hover:border-sky-300 hover:bg-sky-50"
            >
              <Plus className="h-3 w-3" strokeWidth={2.5} />
              一覧にない書籍を手入力
            </button>
          )}
        </div>
      </div>

      {/* バーコードスキャナー */}
      {scanOpen ? (
        <BarcodeScanner
          onDetect={handleDetect}
          onCancel={() => setScanOpen(false)}
          onManualFallback={() => {
            setScanOpen(false);
            setManual(true);
          }}
        />
      ) : null}

      {/* ISBN ルックアップ結果 */}
      {lookupState.phase !== "idle" ? (
        <LookupSheet
          state={lookupState}
          onCancel={dismissLookup}
          onConfirm={confirmAddFromLookup}
          onRetry={() => {
            setLookupState({ phase: "idle" });
            setScanOpen(true);
          }}
          onManual={() => {
            setLookupState({ phase: "idle" });
            setManual(true);
          }}
        />
      ) : null}
    </div>
  );
}

function LookupSheet({
  state,
  onCancel,
  onConfirm,
  onRetry,
  onManual,
}: {
  state:
    | { phase: "loading"; isbn: string }
    | { phase: "found"; isbn: string; result: LookupOk }
    | { phase: "miss"; isbn: string; reason: string };
  onCancel: () => void;
  onConfirm: () => void;
  onRetry: () => void;
  onManual: () => void;
}) {
  const display = (() => {
    if (state.phase === "found") {
      if (state.result.source === "local") {
        const b = state.result.textbook;
        return {
          title: b.name,
          publisher: b.publisher,
          author: b.author,
          coverUrl: b.coverUrl,
          badge: "DB登録済み",
        };
      }
      const c = state.result.custom;
      return {
        title: c.title,
        publisher: c.publisher,
        author: c.author,
        coverUrl: c.coverUrl,
        badge: "OpenBD",
      };
    }
    return null;
  })();

  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-ink-900/50 backdrop-blur-sm">
      <button
        type="button"
        aria-label="閉じる"
        className="absolute inset-0 cursor-default"
        onClick={onCancel}
      />
      <div className="sheet-in relative z-10 mx-auto w-full max-w-[480px] rounded-t-3xl bg-cream-50 p-5 shadow-pop">
        <div className="mx-auto h-1 w-9 rounded-full bg-ink-200" />

        {state.phase === "loading" ? (
          <div className="mt-6 mb-4 flex flex-col items-center gap-3 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-ink-500" />
            <p className="text-[13px] font-bold text-ink-900">書籍情報を検索中…</p>
            <p className="text-[11px] text-ink-500 tabular-nums">
              ISBN: {state.isbn}
            </p>
          </div>
        ) : null}

        {state.phase === "found" && display ? (
          <div className="mt-4">
            <div className="flex items-start gap-3 rounded-2xl border border-ink-100/80 bg-white p-3">
              {display.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={display.coverUrl}
                  alt=""
                  className="h-20 w-14 flex-none rounded-md object-cover shadow-soft"
                />
              ) : (
                <div className="flex h-20 w-14 flex-none items-center justify-center rounded-md bg-cream-100 text-ink-400">
                  <BookOpen className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="inline-flex h-4 items-center rounded-full bg-mint-50 px-1.5 text-[9px] font-bold text-mint-600">
                  {display.badge}
                </span>
                <h3 className="mt-1 line-clamp-2 text-[14px] font-bold text-ink-900">
                  {display.title}
                </h3>
                {display.author ? (
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-ink-600">
                    {display.author}
                  </p>
                ) : null}
                {display.publisher ? (
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-ink-500">
                    {display.publisher}
                  </p>
                ) : null}
                <p className="mt-1 text-[10px] text-ink-400 tabular-nums">
                  ISBN: {state.isbn}
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="h-10 flex-1 rounded-xl bg-cream-100 text-[12px] font-bold text-ink-700"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="h-10 flex-1 rounded-xl bg-ink-900 text-[12px] font-bold text-white"
              >
                本棚に追加
              </button>
            </div>
          </div>
        ) : null}

        {state.phase === "miss" ? (
          <div className="mt-6 text-center">
            <h3 className="text-[14px] font-bold text-ink-900">
              書籍が見つかりません
            </h3>
            <p className="mt-1 text-[11px] text-ink-500">
              ISBN {state.isbn} は OpenBD・社内DBで未登録でした。
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={onRetry}
                className="h-10 rounded-xl bg-ink-900 text-[12px] font-bold text-white"
              >
                もう一度スキャン
              </button>
              <button
                type="button"
                onClick={onManual}
                className="h-10 rounded-xl bg-cream-100 text-[12px] font-bold text-ink-700"
              >
                手入力で追加
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="h-9 text-[11px] font-bold text-ink-500"
              >
                閉じる
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const LEVEL_LABEL: Record<TextbookLevel, string> = {
  basic: "基礎",
  standard: "標準",
  advanced: "応用",
  top: "最難関",
};
const LEVEL_TONE: Record<TextbookLevel, string> = {
  basic: "bg-mint-50 text-mint-600",
  standard: "bg-sky-50 text-sky-600",
  advanced: "bg-peach-50 text-peach-500",
  top: "bg-coral-300 text-white",
};

function Chips({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
        {label}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "h-7 rounded-full px-2.5 text-[10px] font-bold transition",
              value === o.value
                ? "bg-ink-900 text-white"
                : "bg-cream-100 text-ink-700",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ManualInput({
  kind,
  initialName,
  onDone,
  onCancel,
}: {
  kind: BookshelfItem["kind"];
  initialName: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);

  function handle(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addBookshelfItem({
      id: `bk-${Date.now().toString(36)}`,
      name: name.trim(),
      kind,
    });
    onDone();
  }

  return (
    <form onSubmit={handle} className="mt-3 rounded-xl border border-ink-100/80 bg-white p-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
        手入力
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="書名"
        className="mt-2 h-10 w-full rounded-xl border border-ink-100/80 bg-cream-50 px-3 text-[13px] text-ink-900 outline-none focus:border-sky-400 focus:bg-white"
        required
        autoFocus
      />
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 flex-1 rounded-xl bg-cream-100 text-[12px] font-bold text-ink-700"
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="h-10 flex-1 rounded-xl bg-ink-900 text-[12px] font-bold text-white"
        >
          追加
        </button>
      </div>
    </form>
  );
}
