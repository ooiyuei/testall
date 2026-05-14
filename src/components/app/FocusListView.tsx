"use client";

import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Play,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/hooks/useStore";
import type { Block } from "@/lib/types";
import { LoadingState } from "@/components/ui/LoadingState";

function parseHHmm(s: string): number {
  const [h, m] = s.split(":").map((n) => Number(n));
  if (Number.isNaN(h) || Number.isNaN(m)) return -1;
  return h * 60 + m;
}

export function FocusListView() {
  const { state, hydrated } = useStore();

  if (!hydrated) {
    return <LoadingState />;
  }

  const latest = state.tests[0];

  if (!latest || latest.diagnosis.todayBlocks.length === 0) {
    return (
      <div className="px-4 pt-6">
        <div className="rounded-2xl border border-ink-100/80 bg-white p-5">
          <div className="text-sm font-bold text-ink-900">
            25分タイマーをすぐ使う
          </div>
          <p className="mt-1 text-[11px] text-ink-500">
            テストなしでもタイマーは使えます。
          </p>
          <Link
            href="/app/focus/run"
            className="mt-3 inline-flex h-12 items-center gap-2 rounded-full bg-sky-500 px-5 text-sm font-black text-white shadow-soft"
          >
            <Play className="h-4 w-4" />
            25分はじめる
          </Link>
        </div>

        <div className="mt-5 rounded-2xl border border-dashed border-cream-300 bg-white/60 p-5 text-center">
          <div className="text-sm font-bold text-ink-700">
            ブロックを使うにはテスト診断が必要
          </div>
          <p className="mt-1 text-xs text-ink-500">
            テスト結果からAIが今日の25分を整えます。
          </p>
          <Link
            href="/app/test/new"
            className="mt-3 inline-flex h-10 items-center gap-1 rounded-full bg-cream-100 px-4 text-xs font-black text-ink-700"
          >
            <Plus className="h-4 w-4" />
            テストを追加
          </Link>
        </div>
      </div>
    );
  }

  const blocks = latest.diagnosis.todayBlocks;
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const status = blocks.map((b, i) => {
    const done = state.blockLogs.some(
      (l) => l.testId === latest.id && l.blockIdx === i,
    );
    if (done) return "done" as const;
    const end = parseHHmm(b.endTime);
    if (end < 0 || end >= nowMin) return "next" as const;
    return "past" as const;
  });

  let activeIdx = status.findIndex((s) => s === "next");
  if (activeIdx < 0) activeIdx = status.findIndex((s) => s !== "done");
  if (activeIdx < 0) activeIdx = 0;

  const active = blocks[activeIdx];

  return (
    <div className="px-5 pb-8 pt-3">
      {/* Hero */}
      <section className="rounded-2xl border border-sky-200 bg-white p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-black text-sky-700">
            {status[activeIdx] === "done" ? "完了済み" : "次のブロック"}
          </span>
          <span className="font-mono text-xs font-bold text-ink-500">
            {active.startTime}〜{active.endTime}
          </span>
        </div>
        <h2 className="mt-3 text-xl font-black text-ink-900">
          {active.subject} / {active.topic}
        </h2>
        <div className="mt-0.5 text-xs text-ink-500">{active.source}</div>

        <div className="mt-4 rounded-2xl bg-sky-50 p-3.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-700">
            <Clock className="h-3.5 w-3.5" strokeWidth={2.2} />
            完了条件
          </div>
          <div className="mt-1 text-sm font-bold text-ink-900">
            {active.completion}
          </div>
        </div>

        <Link
          href={`/app/focus/run?testId=${latest.id}&block=${activeIdx}`}
          className="mt-4 flex h-14 items-center justify-center gap-2 rounded-full bg-sky-500 text-base font-black text-white shadow-[0_8px_20px_-8px_var(--color-sky-500)] active:scale-[0.98] transition"
        >
          <Play className="h-5 w-5" />
          25分はじめる
        </Link>
      </section>

      <h3 className="mt-6 text-[11px] font-medium text-ink-500">
        今日の全ブロック
      </h3>
      <ul className="mt-2 space-y-2.5">
        {blocks.map((b: Block, i) => (
          <li
            key={i}
            className={cn(
              "flex items-center gap-3 rounded-2xl border p-3 shadow-soft",
              status[i] === "done"
                ? "border-cream-200 bg-cream-50"
                : i === activeIdx
                ? "border-sky-300 bg-white"
                : "border-cream-200 bg-white",
            )}
          >
            <div className="flex w-14 flex-none flex-col items-center justify-center rounded-xl bg-cream-100 py-1.5 text-xs font-mono font-bold text-ink-700">
              {b.startTime}
            </div>
            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  "text-sm font-black",
                  status[i] === "done"
                    ? "text-ink-400 line-through"
                    : "text-ink-900",
                )}
              >
                {b.subject} / {b.topic}
              </div>
              <div className="mt-0.5 text-[11px] text-ink-500">{b.source}</div>
            </div>
            {status[i] === "done" ? (
              <CheckCircle2 className="h-5 w-5 flex-none text-mint-500" />
            ) : (
              <Link
                href={`/app/focus/run?testId=${latest.id}&block=${i}`}
                className="flex flex-none items-center"
                aria-label="このブロックを始める"
              >
                <ChevronRight className="h-4 w-4 text-ink-400" />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
