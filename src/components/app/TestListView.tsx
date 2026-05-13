"use client";

import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { useStore } from "@/lib/hooks/useStore";

export function TestListView() {
  const { state, hydrated } = useStore();

  if (!hydrated) {
    return (
      <div className="px-4 pt-10 text-sm text-ink-500">読み込み中…</div>
    );
  }

  const tests = state.tests;

  return (
    <div className="px-4 pt-3 pb-10">
      {tests.length > 0 ? (
        <div className="rounded-3xl border border-cream-200 bg-white shadow-soft">
          <ul className="divide-y divide-cream-200">
            {tests.map((t) => {
              const pct = Math.round((t.input.score / t.input.fullScore) * 100);
              const done = state.blockLogs.filter(
                (l) => l.testId === t.id,
              ).length;
              const total = t.diagnosis.todayBlocks.length;
              const badge =
                total === 0
                  ? "診断のみ"
                  : done === 0
                  ? `${t.diagnosis.weaknesses.length}件の弱点`
                  : done >= total
                  ? "今日完了"
                  : `進行中 ${done}/${total}`;
              return (
                <li key={t.id}>
                  <Link
                    href={`/app/test/${t.id}`}
                    className="flex items-center gap-3 px-4 py-3.5 active:bg-cream-100"
                  >
                    <div className="flex h-12 w-12 flex-none flex-col items-center justify-center rounded-2xl bg-cream-100 text-[10px] font-bold text-ink-500">
                      <span className="font-black text-ink-900">{pct}</span>
                      <span>%</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-black text-ink-900">
                        {t.input.testName}
                      </div>
                      <div className="mt-0.5 text-[11px] text-ink-500">
                        {t.input.subject} ·{" "}
                        {new Date(t.createdAt).toLocaleDateString("ja-JP", {
                          month: "numeric",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                    <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[10px] font-bold text-sky-700">
                      {badge}
                    </span>
                    <ChevronRight className="h-4 w-4 flex-none text-ink-400" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 rounded-3xl border border-dashed border-cream-300 bg-white/60 p-6 text-center">
        <div className="text-sm font-bold text-ink-700">
          {tests.length === 0
            ? "テストを追加して、AIに分析してもらおう"
            : "新しいテストを追加すると、計画が更新されます"}
        </div>
        <div className="mt-1 text-xs text-ink-500">
          単元ごとの正答数と原因を入れるだけ。
        </div>
        <Link
          href="/app/test/new"
          className="mt-4 inline-flex h-11 items-center gap-1.5 rounded-full bg-sky-500 px-5 text-sm font-black text-white shadow-soft"
        >
          <Plus className="h-4 w-4" />
          テストを追加する
        </Link>
      </div>
    </div>
  );
}
