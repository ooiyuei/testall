"use client";

// 初回ガイドツアー
// オンボ完了直後にホームで自動表示。
// 「最初のテストを追加 → 集中モードで25分」の流れを3ステップで紹介。
// sessionStorage に "guide-tour-done" を保存して2回目以降は出さない。

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, ClipboardList, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/cn";

const STORAGE_KEY = "testall:guide-tour-done";

type Step = {
  icon: typeof Sparkles;
  tone: string;
  title: string;
  body: string;
  cta?: { href: string; label: string };
};

const STEPS: Step[] = [
  {
    icon: Sparkles,
    tone: "bg-sky-100 text-sky-600",
    title: "Testall へようこそ",
    body: "テストを入れるだけで、AIがあなたの苦手を見つけて、今日やる25分ブロックを作ります。",
  },
  {
    icon: ClipboardList,
    tone: "bg-peach-100 text-peach-500",
    title: "まずはテストを追加",
    body: "校内テストや模試の結果を入れると、弱点と次の手が出ます。写真でも入力できます。",
    cta: { href: "/app/test/new", label: "テストを追加" },
  },
  {
    icon: BookOpen,
    tone: "bg-mint-100 text-mint-600",
    title: "毎日25分から",
    body: "「気分は？」を選ぶだけで今日のブロックが決まります。集中モードで一緒に走りましょう。",
  },
];

export function GuideTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const done = sessionStorage.getItem(STORAGE_KEY);
      if (!done) setOpen(true);
    } catch {
      /* noop */
    }
  }, []);

  function dismiss() {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* noop */
    }
    setOpen(false);
  }

  if (!open) return null;
  const s = STEPS[step];
  const Icon = s.icon;
  const last = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-5 backdrop-blur-[2px]">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="閉じる"
        onClick={dismiss}
      />
      <div className="sheet-in relative z-10 w-full max-w-[400px] rounded-3xl bg-white p-6 shadow-pop">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-ink-400 hover:bg-cream-100"
          aria-label="閉じる"
        >
          <X className="h-[16px] w-[16px]" />
        </button>

        <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl", s.tone)}>
          <Icon className="h-7 w-7" strokeWidth={2} />
        </div>

        <h2 className="mt-4 text-[20px] font-bold leading-tight tracking-tight text-ink-900">
          {s.title}
        </h2>
        <p className="mt-2 text-[14px] leading-[1.7] text-ink-600">{s.body}</p>

        {/* progress dots */}
        <div className="mt-5 flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i === step ? "bg-ink-900" : "bg-ink-100",
              )}
            />
          ))}
        </div>

        <div className="mt-5 flex items-center gap-2">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="h-11 rounded-xl bg-cream-100 px-4 text-[13px] font-bold text-ink-700"
            >
              戻る
            </button>
          ) : null}
          {s.cta && last ? (
            <Link
              href={s.cta.href}
              onClick={dismiss}
              className="flex h-11 flex-1 items-center justify-center gap-1 rounded-xl bg-ink-900 text-[13px] font-bold text-white"
            >
              {s.cta.label}
              <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
            </Link>
          ) : last ? (
            <button
              type="button"
              onClick={dismiss}
              className="flex h-11 flex-1 items-center justify-center rounded-xl bg-ink-900 text-[13px] font-bold text-white"
            >
              はじめる
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex h-11 flex-1 items-center justify-center gap-1 rounded-xl bg-ink-900 text-[13px] font-bold text-white"
            >
              次へ
              <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
