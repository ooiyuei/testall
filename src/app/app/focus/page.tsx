import Link from "next/link";
import { AppHeader } from "@/components/app/AppHeader";
import { Play, ChevronRight, Clock } from "lucide-react";

const QUEUE = [
  { time: "20:00", title: "英語 / 長文読解", source: "ポラリス1 Unit 4", goal: "本文の主張を3行で要約できる", status: "now" },
  { time: "21:30", title: "古文 / 動詞活用", source: "ステップアップ古文 p.42〜", goal: "四段・上一段の見分けが言える", status: "next" },
];

export default function FocusListPage() {
  const now = QUEUE.find((q) => q.status === "now")!;

  return (
    <>
      <AppHeader title="集中モード" />
      <div className="px-4 pt-3">
        {/* Hero block */}
        <section className="rounded-3xl border border-sky-200 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-black text-sky-700">
              次のブロック
            </span>
            <span className="font-mono text-xs font-bold text-ink-500">
              {now.time}
            </span>
          </div>
          <h2 className="mt-3 text-xl font-black text-ink-900">{now.title}</h2>
          <div className="mt-0.5 text-xs text-ink-500">{now.source}</div>

          <div className="mt-4 rounded-2xl bg-sky-50 p-3.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-sky-700">
              <Clock className="h-3.5 w-3.5" />
              完了条件
            </div>
            <div className="mt-1 text-sm font-bold text-ink-900">{now.goal}</div>
          </div>

          <Link
            href="/app/focus/run"
            className="mt-4 flex h-14 items-center justify-center gap-2 rounded-full bg-sky-500 text-base font-black text-white shadow-[0_8px_20px_-8px_var(--color-sky-500)] active:scale-[0.98] transition"
          >
            <Play className="h-5 w-5" />
            45分はじめる
          </Link>
        </section>

        <h3 className="mt-6 text-xs font-bold uppercase tracking-widest text-ink-500">
          このあと
        </h3>
        <ul className="mt-2 space-y-2.5">
          {QUEUE.filter((q) => q.status !== "now").map((q, i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-2xl border border-cream-200 bg-white p-3 shadow-soft"
            >
              <div className="flex w-14 flex-none flex-col items-center justify-center rounded-xl bg-cream-100 py-1.5 text-xs font-mono font-bold text-ink-700">
                {q.time}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-black text-ink-900">{q.title}</div>
                <div className="mt-0.5 text-[11px] text-ink-500">{q.source}</div>
              </div>
              <ChevronRight className="h-4 w-4 flex-none text-ink-400" />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
