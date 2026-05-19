"use client";

// ヘルプ・使い方ページ — ⑭ HelpScreen スタイル
// 上: 「ヘルプ」大見出し
// 中: 検索バー (実装は filter のみ)
// 下: よくある質問 (アコーディオン) + お問い合わせ

import Link from "next/link";
import {
  BookOpen,
  Calendar,
  ChevronDown,
  ClipboardList,
  Compass,
  Flame,
  HelpCircle,
  Search,
  Sparkles,
  Target,
  Timer,
} from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";

type Section = {
  icon: typeof BookOpen;
  title: string;
  body: string;
  steps?: string[];
};

const SECTIONS: Section[] = [
  {
    icon: ClipboardList,
    title: "テストを追加する",
    body: "模試・校内テストの結果を入力すると、AI が弱点を分析して今日の 25分を整えます。",
    steps: [
      "ホームの「最初のテストを追加」または下タブの「テスト」へ",
      "手入力 or 写真撮影を選ぶ (写真は β 版)",
      "科目を複数選んで点数を入力 (単元は任意)",
      "「AI で診断する」で完了",
    ],
  },
  {
    icon: Timer,
    title: "25分ブロックで集中する",
    body: "ポモドーロ式の 25分タイマー。テスト診断から自動で「今日やるべき25分」が並びます。",
    steps: [
      "ホームの「はじめる」または下タブの「集中」へ",
      "今日のブロックから 25分タイマーを起動",
      "終わったら振り返り (5段階) を記録",
      "完了したブロックは緑チェックで残ります",
    ],
  },
  {
    icon: Sparkles,
    title: "気分に合わせて調整",
    body: "毎日の「気分」を選ぶだけで、その日のブロック数が自動で増減します。",
    steps: [
      "ホームの「今日の準備」で気分を選ぶ",
      "並=±0 / 大盛=+2 / 特盛=+4 / 少なめ=−2",
      "就寝時間まで物理的に入る上限で自動カット",
      "「この設定で進める」で今日の予定が確定",
    ],
  },
  {
    icon: Calendar,
    title: "週間プランを立てる",
    body: "週次の目標ブロックを設定して、ドラッグで日ごとに割り振れます。",
    steps: [
      "下タブの「計画」へ",
      "週次目標 (目標 / 最低 / 余力) を入力",
      "ボードで日付にタスクをドラッグ",
      "日曜/月曜には自動で振り返りカードが出ます",
    ],
  },
  {
    icon: Target,
    title: "弱点を一覧する",
    body: "テスト診断から弱点・原因・優先度が抽出され、領域別の偏差値も自動更新されます。",
    steps: [
      "テスト追加後の診断画面に弱点が表示",
      "下タブの「マイ」→ 教科をタップで領域詳細",
      "単元タップで「得意/苦手」を記録 (永続化)",
    ],
  },
  {
    icon: Flame,
    title: "ストリークと経験値",
    body: "毎日 25分やると連続日数が伸び、ヒートマップとレベルが更新されます。",
    steps: [
      "1日 1ブロック以上で連続加算",
      "AM 6時で日付が切り替わる (深夜セーフ)",
      "「マイ」のレベル山は完了ブロック数と連動",
    ],
  },
  {
    icon: Compass,
    title: "AI とチャット",
    body: "ホーム下部の AI チャットに質問できます。学年・志望校・直近テストを踏まえて返答します。",
  },
  {
    icon: BookOpen,
    title: "データのバックアップ",
    body: "設定 → データ から JSON でエクスポート/インポートできます。",
    steps: [
      "下タブ「マイ」→「設定」へ",
      "「データをエクスポート」で .json を保存",
      "別端末で同じファイルを読み込むと復元",
    ],
  },
];

const CONTACT_ITEMS = [
  { label: "チャットで質問する", href: "/app" },
  { label: "メールで送る", href: "mailto:support@testall.app" },
  { label: "コミュニティを見る", href: "#" },
];

export function HelpView() {
  const [query, setQuery] = useState("");
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SECTIONS.map((s, i) => ({ s, i }));
    return SECTIONS
      .map((s, i) => ({ s, i }))
      .filter(({ s }) =>
        s.title.toLowerCase().includes(q) ||
        s.body.toLowerCase().includes(q) ||
        (s.steps?.some((step) => step.toLowerCase().includes(q)) ?? false)
      );
  }, [query]);

  return (
    <div className="px-5 pb-8 pt-2">
      <h1
        className="text-[28px] font-extrabold tracking-[-0.025em] text-ink-900"
        style={{ fontFamily: "var(--font-display)" }}
      >
        ヘルプ
      </h1>

      {/* Search */}
      <div className="relative mt-3.5">
        <Search
          className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
          strokeWidth={1.8}
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="質問を検索"
          className="h-11 w-full rounded-[14px] border border-ink-100 bg-white pl-10 pr-3.5 text-[13px] text-ink-900 outline-none focus:border-sky-400"
        />
      </div>

      {/* FAQ */}
      <section className="mt-5">
        <h2 className="text-[11px] font-medium text-ink-500">よくある質問</h2>
        <div className="mt-2.5 overflow-hidden rounded-2xl border border-ink-100/80 bg-white">
          {visible.length === 0 ? (
            <div className="px-4 py-10 text-center text-[12px] text-ink-400">
              該当する質問が見つかりませんでした
            </div>
          ) : (
            visible.map(({ s, i }, listIdx) => {
              const open = openIdx === i;
              return (
                <div
                  key={i}
                  className={cn(
                    "px-4 py-3.5",
                    listIdx < visible.length - 1 && "border-b border-ink-100/40",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIdx(open ? null : i)}
                    className="flex w-full items-center justify-between gap-3 text-left"
                  >
                    <span
                      className={cn(
                        "text-[13px] tracking-tight text-ink-900",
                        open ? "font-bold" : "font-semibold",
                      )}
                    >
                      {s.title}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 flex-none text-ink-400 transition-transform",
                        open && "rotate-180",
                      )}
                      strokeWidth={2}
                    />
                  </button>
                  {open ? (
                    <div className="mt-2 space-y-2">
                      <p className="text-[12px] leading-[1.7] text-ink-600">
                        {s.body}
                      </p>
                      {s.steps ? (
                        <ol className="space-y-1 rounded-xl bg-cream-50/70 p-3 text-[11px] leading-[1.7] text-ink-600">
                          {s.steps.map((step, j) => (
                            <li key={j} className="flex gap-2">
                              <span className="mt-[2px] flex h-4 w-4 flex-none items-center justify-center rounded-full bg-ink-900 text-[9px] font-bold text-white">
                                {j + 1}
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Contact */}
      <section className="mt-5">
        <h2 className="text-[11px] font-medium text-ink-500">お問い合わせ</h2>
        <div className="mt-2.5 overflow-hidden rounded-2xl border border-ink-100/80 bg-white">
          {CONTACT_ITEMS.map((it, i) => (
            <Link
              key={it.label}
              href={it.href}
              className={cn(
                "flex items-center justify-between px-4 py-3.5 text-[13px] font-semibold text-ink-900 transition active:bg-cream-50",
                i < CONTACT_ITEMS.length - 1 && "border-b border-ink-100/40",
              )}
            >
              {it.label}
              <span className="text-ink-300">›</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Hint footer */}
      <section className="mt-5 rounded-2xl border border-sky-200 bg-sky-50/60 p-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-sky-500" strokeWidth={2.2} />
          <h3 className="text-[12px] font-bold text-ink-900">困ったときは</h3>
        </div>
        <p className="mt-1.5 text-[11px] leading-[1.7] text-ink-600">
          上手く動かないときは、設定 → データ から一度エクスポートしてから、データを削除して再ログインすると改善することがあります。
        </p>
        <div className="mt-3 flex gap-2">
          <Link
            href="/app/me/settings"
            className="flex h-9 flex-1 items-center justify-center rounded-xl bg-white px-3 text-[11px] font-bold text-sky-600"
          >
            設定を開く
          </Link>
          <Link
            href="/app"
            className="flex h-9 flex-1 items-center justify-center rounded-xl bg-ink-900 px-3 text-[11px] font-bold text-white"
          >
            ホームに戻る
          </Link>
        </div>
      </section>
    </div>
  );
}
