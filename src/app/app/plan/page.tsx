import { AppHeader } from "@/components/app/AppHeader";

const WEEK = [
  { d: "月", date: "5/11", focus: "数学：二次関数", blocks: 3, done: 3 },
  { d: "火", date: "5/12", focus: "英語：長文読解の型", blocks: 3, done: 3 },
  { d: "水", date: "5/13", focus: "数学：三角比 + 英語復習", blocks: 3, done: 1, today: true },
  { d: "木", date: "5/14", focus: "古文：動詞活用", blocks: 3, done: 0 },
  { d: "金", date: "5/15", focus: "数学：演習日", blocks: 3, done: 0 },
  { d: "土", date: "5/16", focus: "週末まとめ：英数", blocks: 5, done: 0 },
  { d: "日", date: "5/17", focus: "復習デー", blocks: 4, done: 0 },
];

export default function PlanPage() {
  return (
    <>
      <AppHeader title="今週の計画" />
      <div className="px-4 pt-3">
        <div className="rounded-3xl border border-cream-200 bg-gradient-to-br from-mint-50 to-sky-50 p-5 shadow-soft">
          <div className="text-xs font-bold uppercase tracking-widest text-mint-600">
            今週の目標
          </div>
          <p className="mt-1 text-sm text-ink-700">
            数学「二次関数 / 三角比」の基本例題3周と、英語長文の型を体に入れる。
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tabular-nums text-ink-900">7</span>
            <span className="text-xs font-bold text-ink-500">/ 24 ブロック</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/70">
            <div
              className="h-full rounded-full bg-mint-500"
              style={{ width: `${Math.round((7 / 24) * 100)}%` }}
            />
          </div>
        </div>

        <ul className="mt-5 space-y-2.5">
          {WEEK.map((w) => (
            <li
              key={w.d}
              className={
                "flex items-center gap-3 rounded-2xl border p-3 shadow-soft " +
                (w.today
                  ? "border-sky-300 bg-white ring-2 ring-sky-100"
                  : "border-cream-200 bg-white")
              }
            >
              <div
                className={
                  "flex w-12 flex-none flex-col items-center justify-center rounded-xl py-1.5 text-[10px] font-bold " +
                  (w.today
                    ? "bg-sky-500 text-white"
                    : "bg-cream-100 text-ink-500")
                }
              >
                <span className="text-xs font-black">{w.d}</span>
                <span>{w.date}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-ink-900">{w.focus}</div>
                <div className="mt-0.5 text-[11px] text-ink-500">
                  {w.done} / {w.blocks} ブロック完了
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
