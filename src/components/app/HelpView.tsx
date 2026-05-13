"use client";

// ヘルプ・使い方ページ
// 主要機能を「何ができるか／どう使うか」の2行で説明する FAQ + 機能一覧

import Link from "next/link";
import {
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Compass,
  Flame,
  HelpCircle,
  Sparkles,
  Target,
  Timer,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";

type Section = {
  icon: typeof BookOpen;
  tone: string;
  title: string;
  body: string;
  steps?: string[];
};

const SECTIONS: Section[] = [
  {
    icon: ClipboardList,
    tone: "bg-peach-100 text-peach-500",
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
    tone: "bg-sky-100 text-sky-600",
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
    tone: "bg-mint-100 text-mint-600",
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
    tone: "bg-sky-100 text-sky-700",
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
    tone: "bg-coral-300/30 text-coral-500",
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
    tone: "bg-coral-300/30 text-coral-500",
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
    tone: "bg-mint-100 text-mint-600",
    title: "AI とチャット",
    body: "ホーム下部の AI チャットに質問できます。学年・志望校・直近テストを踏まえて返答します。",
  },
  {
    icon: BookOpen,
    tone: "bg-cream-100 text-ink-700",
    title: "データのバックアップ",
    body: "設定 → データ から JSON でエクスポート/インポートできます。",
    steps: [
      "下タブ「マイ」→「設定」へ",
      "「データをエクスポート」で .json を保存",
      "別端末で同じファイルを読み込むと復元",
    ],
  },
];

export function HelpView() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="px-5 pb-8 pt-3">
      <header className="mb-5">
        <div className="text-[11px] font-medium tracking-wider text-ink-400">
          サポート
        </div>
        <h1 className="mt-1 flex items-center gap-2 text-[22px] font-bold leading-tight text-ink-900">
          <HelpCircle className="h-5 w-5 text-sky-500" />
          ヘルプ・使い方
        </h1>
        <p className="mt-1.5 text-[12px] leading-[1.7] text-ink-500">
          Testall は「テスト結果を、次の25分でやるべき勉強に変える」アプリです。
        </p>
      </header>

      <ul className="space-y-2">
        {SECTIONS.map((s, i) => {
          const open = openIdx === i;
          const Icon = s.icon;
          return (
            <li
              key={i}
              className="overflow-hidden rounded-2xl border border-ink-100/80 bg-white"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(open ? null : i)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-cream-100"
              >
                <span
                  className={cn(
                    "flex h-9 w-9 flex-none items-center justify-center rounded-xl",
                    s.tone,
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={2.2} />
                </span>
                <div className="flex-1">
                  <div className="text-[13px] font-bold text-ink-900">
                    {s.title}
                  </div>
                  <p className="mt-0.5 text-[11px] leading-[1.6] text-ink-500">
                    {s.body}
                  </p>
                </div>
                {open ? (
                  <ChevronDown className="h-4 w-4 flex-none text-ink-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 flex-none text-ink-400" />
                )}
              </button>
              {open && s.steps ? (
                <ol className="space-y-1 border-t border-ink-100/60 bg-cream-50/50 px-4 py-3 text-[11px] leading-[1.7] text-ink-600">
                  {s.steps.map((step, j) => (
                    <li key={j} className="flex gap-2">
                      <span className="flex h-4 w-4 flex-none items-center justify-center rounded-full bg-ink-900 text-[9px] font-bold text-white">
                        {j + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              ) : null}
            </li>
          );
        })}
      </ul>

      <section className="mt-7 rounded-2xl border border-sky-200 bg-sky-50/60 p-5">
        <h2 className="text-[13px] font-bold text-ink-900">
          困ったときは
        </h2>
        <p className="mt-1 text-[11px] leading-[1.7] text-ink-600">
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
