import Link from "next/link";
import { AppHeader } from "@/components/app/AppHeader";
import {
  Flame,
  Plus,
  Play,
  Sparkles,
  ChevronRight,
  Clock,
  CheckCircle2,
} from "lucide-react";

type Block = {
  time: string;
  title: string;
  source: string;
  goal: string;
  status: "done" | "now" | "next";
};

const TODAY_BLOCKS: Block[] = [
  {
    time: "17:00",
    title: "数学 / 二次関数",
    source: "チャート式 例題 12〜15",
    goal: "4問中3問を答えを見ずに解ける",
    status: "done",
  },
  {
    time: "20:00",
    title: "英語 / 長文読解",
    source: "ポラリス1 Unit 4",
    goal: "本文の主張を3行で要約できる",
    status: "now",
  },
  {
    time: "21:30",
    title: "古文 / 動詞活用",
    source: "ステップアップ古文 p.42〜",
    goal: "四段・上一段の見分けが言える",
    status: "next",
  },
];

const WEEK_DAYS = [
  { d: "月", done: true, today: false },
  { d: "火", done: true, today: false },
  { d: "水", done: false, today: true },
  { d: "木", done: false, today: false },
  { d: "金", done: false, today: false },
  { d: "土", done: false, today: false },
  { d: "日", done: false, today: false },
];

export default function AppHomePage() {
  const today = new Date();
  const fmt = new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(today);

  return (
    <>
      <AppHeader />
      <div className="px-4 pt-2">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs text-ink-500">{fmt}</div>
            <h1 className="mt-0.5 text-[22px] font-black leading-tight text-ink-900">
              おかえり、ゆうえいさん
            </h1>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-sun-200 px-3 py-1.5 text-xs font-black text-ink-900 shadow-soft">
            <Flame className="h-3.5 w-3.5 text-peach-500" />
            12日連続
          </div>
        </div>

        {/* Today progress */}
        <section className="mt-5 overflow-hidden rounded-3xl bg-gradient-to-br from-sky-50 to-peach-50 p-5 shadow-soft">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-sky-700">
                今日の進み
              </div>
              <div className="mt-1 text-3xl font-black text-ink-900">
                <span className="tabular-nums">1</span>
                <span className="mx-1 text-ink-400">/</span>
                <span className="tabular-nums">3</span>
                <span className="ml-1 text-sm font-bold text-ink-500">ブロック</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-ink-500">残り目安</div>
              <div className="mt-0.5 text-base font-black text-ink-900">
                90<span className="ml-0.5 text-xs font-bold text-ink-500">分</span>
              </div>
            </div>
          </div>

          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/70">
            <div
              className="h-full rounded-full bg-sky-500"
              style={{ width: "33%" }}
            />
          </div>

          <div className="mt-3 text-sm text-ink-700">
            いいペース。次は20:00、英語の長文ですね。
          </div>
        </section>

        {/* Week strip */}
        <section className="mt-5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-widest text-ink-500">
              今週の流れ
            </div>
            <Link
              href="/app/plan"
              className="flex items-center gap-0.5 text-xs font-bold text-sky-600"
            >
              週間計画を見る
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul className="mt-2 grid grid-cols-7 gap-1.5">
            {WEEK_DAYS.map((w) => (
              <li
                key={w.d}
                className={
                  "flex flex-col items-center gap-1.5 rounded-2xl border py-2.5 " +
                  (w.today
                    ? "border-sky-400 bg-sky-50"
                    : "border-cream-200 bg-white")
                }
              >
                <span
                  className={
                    "text-[10px] font-bold " +
                    (w.today ? "text-sky-600" : "text-ink-500")
                  }
                >
                  {w.d}
                </span>
                <span
                  className={
                    "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold " +
                    (w.done
                      ? "bg-mint-500 text-white"
                      : w.today
                      ? "bg-sky-500 text-white"
                      : "bg-cream-100 text-ink-400")
                  }
                >
                  {w.done ? "✓" : w.today ? "•" : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Today blocks */}
        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-ink-900">
              今日の45分ブロック
            </h2>
            <Link
              href="/app/focus"
              className="flex items-center gap-0.5 text-xs font-bold text-sky-600"
            >
              集中モード
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <ul className="mt-3 space-y-2.5">
            {TODAY_BLOCKS.map((b, i) => (
              <li key={i}>
                <BlockCard block={b} />
              </li>
            ))}
          </ul>
        </section>

        {/* AI nudge */}
        <section className="mt-6 rounded-3xl border border-cream-200 bg-white p-4 shadow-soft">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-2xl bg-mint-100 text-mint-600">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold uppercase tracking-widest text-mint-600">
                AIからのひとこと
              </div>
              <p className="mt-1 text-sm text-ink-700">
                月曜のテストから「二次関数の理解不足」が見えています。今日の17:00で土台を作って、明日に活かしましょう。
              </p>
            </div>
          </div>
        </section>

        {/* Quick actions */}
        <section className="mt-6 mb-2 grid grid-cols-2 gap-3">
          <Link
            href="/app/test/new"
            className="flex items-center gap-3 rounded-2xl border border-cream-200 bg-white p-4 shadow-soft active:scale-[0.98] transition"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-peach-100 text-peach-500">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-black text-ink-900">テストを追加</div>
              <div className="text-[11px] text-ink-500">模試・校内テスト</div>
            </div>
          </Link>
          <Link
            href="/app/focus"
            className="flex items-center gap-3 rounded-2xl border border-cream-200 bg-white p-4 shadow-soft active:scale-[0.98] transition"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
              <Play className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-black text-ink-900">45分はじめる</div>
              <div className="text-[11px] text-ink-500">集中モード</div>
            </div>
          </Link>
        </section>
      </div>
    </>
  );
}

function BlockCard({ block }: { block: Block }) {
  const done = block.status === "done";
  const now = block.status === "now";

  return (
    <article
      className={
        "flex items-stretch gap-3 rounded-2xl border p-3 shadow-soft " +
        (now
          ? "border-sky-300 bg-white ring-2 ring-sky-100"
          : done
          ? "border-cream-200 bg-cream-50"
          : "border-cream-200 bg-white")
      }
    >
      <div
        className={
          "flex w-14 flex-none flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-black " +
          (done
            ? "bg-mint-100 text-mint-600"
            : now
            ? "bg-sky-100 text-sky-600"
            : "bg-cream-100 text-ink-500")
        }
      >
        <span className="font-mono text-sm tabular-nums">{block.time}</span>
        <span className="text-[9px] font-bold uppercase tracking-widest">
          {done ? "完了" : now ? "次" : "予定"}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div
          className={
            "flex items-center gap-1 text-sm font-black " +
            (done ? "text-ink-400 line-through" : "text-ink-900")
          }
        >
          {block.title}
        </div>
        <div className="mt-0.5 text-[11px] text-ink-500">{block.source}</div>
        <div className="mt-2 flex items-center gap-1.5 rounded-xl bg-cream-100 px-2.5 py-1.5">
          <Clock className="h-3 w-3 flex-none text-ink-400" />
          <span className="text-[11px] text-ink-700">{block.goal}</span>
        </div>
      </div>
      {done ? (
        <CheckCircle2 className="h-6 w-6 flex-none self-center text-mint-500" />
      ) : (
        <Link
          href="/app/focus"
          className={
            "flex flex-none items-center justify-center self-center rounded-full px-3.5 py-2 text-xs font-black " +
            (now
              ? "bg-sky-500 text-white shadow-soft"
              : "bg-white text-sky-600 border border-sky-200")
          }
          aria-label="開始"
        >
          <Play className="h-3.5 w-3.5" />
        </Link>
      )}
    </article>
  );
}
