"use client";

// 高校編集モーダル
// - 検索バー (リアルタイム)
// - 都道府県フィルタ (47都道府県プルダウン)
// - Supabase remoteSearchHighschools(query) / ローカルseedと統合表示
// - 検索結果リスト (名前/都道府県/市区町村/種別)
// - クリックで schoolName を更新
// - 手動入力フォールバック

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Plus, School, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { searchHighschools } from "@/lib/master/highschools";
import { remoteSearchHighschools, remoteListHighschoolsByPrefecture } from "@/lib/master/remote";
import type { Highschool } from "@/lib/master/types";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];

const TYPE_LABEL: Record<Highschool["type"], string> = {
  national: "国立",
  public: "公立",
  private: "私立",
};

const TYPE_TONE: Record<Highschool["type"], string> = {
  national: "bg-coral-50 text-coral-500",
  public: "bg-sky-50 text-sky-600",
  private: "bg-mint-50 text-mint-600",
};

type Props = {
  currentName?: string;
  onSelect: (name: string) => void;
  onClose: () => void;
};

export function HighschoolEditModal({ currentName, onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [prefecture, setPrefecture] = useState<string>("all");
  const [manual, setManual] = useState(false);
  const [remoteResults, setRemoteResults] = useState<Highschool[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trapRef = useFocusTrap<HTMLDivElement>(true);

  // Esc 閉じ + body scroll lock
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  // リモート検索（debounce 300ms）
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        if (prefecture !== "all" && !query.trim()) {
          const results = await remoteListHighschoolsByPrefecture(prefecture, 50);
          setRemoteResults(results);
        } else {
          const results = await remoteSearchHighschools(query, 50);
          setRemoteResults(results);
        }
      } catch {
        setRemoteResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, prefecture]);

  // ローカルseedと統合・都道府県フィルタ適用
  const localResults = useMemo(() => {
    const list = searchHighschools(query, 30);
    if (prefecture !== "all") return list.filter((h) => h.prefecture === prefecture);
    return list;
  }, [query, prefecture]);

  // 重複除去してマージ（remoteを優先、ローカルで補完）
  const merged = useMemo((): Highschool[] => {
    const remoteIds = new Set(remoteResults.map((h) => h.id));
    const localOnly = localResults.filter((h) => !remoteIds.has(h.id));
    const combined = [...remoteResults, ...localOnly];
    // 都道府県フィルタ（リモート結果にも適用）
    const filtered = prefecture !== "all"
      ? combined.filter((h) => h.prefecture === prefecture)
      : combined;
    return filtered.slice(0, 50);
  }, [remoteResults, localResults, prefecture]);

  function pick(h: Highschool) {
    onSelect(h.name);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-ink-900/40 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="高校を選択"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="閉じる"
        onClick={onClose}
      />
      <div
        ref={trapRef}
        className="sheet-in relative z-10 mx-auto flex max-h-[92vh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-3xl bg-cream-50 shadow-pop"
      >
        {/* ヘッダ */}
        <div className="px-5 pt-3">
          <div className="mx-auto h-1 w-9 rounded-full bg-ink-200" />
          <div className="mt-3 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-ink-900">高校を選択</h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-500 active:bg-cream-200"
              aria-label="閉じる"
            >
              <X className="h-[18px] w-[18px]" />
            </button>
          </div>

          {/* 検索バー */}
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="高校名・地域で検索"
              autoFocus
              className="h-10 w-full rounded-xl border border-ink-100/80 bg-white pl-8 pr-3 text-[13px] text-ink-900 outline-none focus:border-sky-400"
            />
          </div>

          {/* 都道府県フィルタ */}
          <div className="mt-2">
            <select
              value={prefecture}
              onChange={(e) => setPrefecture(e.target.value)}
              className="h-9 w-full rounded-xl border border-ink-100/80 bg-white px-3 text-[12px] text-ink-900 outline-none focus:border-sky-400"
            >
              <option value="all">都道府県を絞り込む</option>
              {PREFECTURES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* リスト */}
        <div className="mt-3 flex-1 overflow-y-auto px-5 pb-4">
          {/* 件数表示 */}
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[10px] font-medium text-ink-500 tabular-nums">
              {loading ? "検索中…" : `${merged.length} 件`}
            </div>
            {currentName ? (
              <div className="text-[10px] text-ink-500">
                現在: <span className="font-bold text-ink-700">{currentName}</span>
              </div>
            ) : null}
          </div>

          {merged.length === 0 && !loading ? (
            <div className="rounded-xl border border-dashed border-ink-200 bg-white px-4 py-6 text-center">
              <p className="text-[12px] text-ink-500">該当する高校が見つかりません</p>
              <button
                type="button"
                onClick={() => setManual(true)}
                className="mt-3 inline-flex h-9 items-center gap-1 rounded-full bg-ink-900 px-3 text-[11px] font-bold text-white"
              >
                <Plus className="h-3 w-3" strokeWidth={2.5} />
                手入力で登録
              </button>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {merged.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    onClick={() => pick(h)}
                    className="group flex w-full items-start gap-3 rounded-xl border border-ink-100/80 bg-white p-3 text-left transition active:bg-cream-50"
                  >
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-cream-100 text-ink-700">
                      <School className="h-[16px] w-[16px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                            TYPE_TONE[h.type],
                          )}
                        >
                          {TYPE_LABEL[h.type]}
                        </span>
                        <span className="line-clamp-1 text-[13px] font-bold text-ink-900">
                          {h.name}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-ink-500">
                        {h.prefecture}
                        {h.city ? `・${h.city}` : ""}
                        {h.deviation ? `　偏差値 ${h.deviation}` : ""}
                      </div>
                    </div>
                    <Check className="mt-1 h-4 w-4 flex-none text-ink-300 group-active:text-mint-500" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* 手動入力フォールバック */}
          {manual ? (
            <ManualInput
              initialName={query}
              onDone={(name) => {
                onSelect(name);
                onClose();
              }}
              onCancel={() => setManual(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setManual(true)}
              className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-ink-200 bg-white py-3 text-[11px] font-bold text-ink-500 hover:border-sky-300 hover:bg-sky-50"
            >
              <Plus className="h-3 w-3" strokeWidth={2.5} />
              一覧にない高校を手入力
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ManualInput({
  initialName,
  onDone,
  onCancel,
}: {
  initialName: string;
  onDone: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);

  function handle(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onDone(name.trim());
  }

  return (
    <form onSubmit={handle} className="mt-3 rounded-xl border border-ink-100/80 bg-white p-3">
      <div className="text-[10px] font-semibold text-ink-400">
        手入力
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="高校名"
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
          決定
        </button>
      </div>
    </form>
  );
}
