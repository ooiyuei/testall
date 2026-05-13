"use client";

import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Flame,
  Play,
  Plus,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/hooks/useStore";
import { getStreak } from "@/lib/store";
import type { Block } from "@/lib/types";
import { MoodCheckCard } from "./MoodCheckCard";

const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"];

function weekdayIndex(d: Date): number {
  // JS: Sun=0, Mon=1, ... Sat=6 → 月始まり 0..6
  return (d.getDay() + 6) % 7;
}

function parseHHmm(s: string): number {
  const [h, m] = s.split(":").map((n) => Number(n));
  if (Number.isNaN(h) || Number.isNaN(m)) return -1;
  return h * 60 + m;
}

export function HomeView() {
  const { state, hydrated } = useStore();
  const latest = state.tests[0];
  const blocks: Block[] = latest?.diagnosis.todayBlocks ?? [];

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const todayIdx = weekdayIndex(now);
  const streak = hydrated ? getStreak() : 0;

  const blockStatus = blocks.map((b, i): "done" | "now" | "next" | "past" => {
    const done = state.blockLogs.some(
      (l) => l.testId === latest?.id && l.blockIdx === i,
    );
    if (done) return "done";
    return "next";
  });
  // Pick "now" = first non-done whose endTime >= current time
  const nextIdx = blockStatus.findIndex((s, i) => {
    if (s !== "next") return false;
    const end = parseHHmm(blocks[i].endTime);
    return end < 0 || end >= nowMin;
  });
  if (nextIdx >= 0) blockStatus[nextIdx] = "now";

  const doneCount = blockStatus.filter((s) => s === "done").length;
  const remainingMin = blocks
    .filter((_, i) => blockStatus[i] !== "done")
    .reduce((acc, b) => {
      const start = parseHHmm(b.startTime);
      const end = parseHHmm(b.endTime);
      if (start < 0 || end < 0) return acc + 45;
      return acc + Math.max(0, end - start);
    }, 0);

  const fmt = new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(now);

  const weekDays = WEEKDAYS.map((d, i) => ({
    d,
    today: i === todayIdx,
    done: i < todayIdx,
  }));

  const greeting = state.profile?.name
    ? `おかえり、${state.profile.name}さん`
    : "おかえりなさい";

  const needsOnboarding = hydrated && !state.profile?.onboardedAt;

  return (
    <div className="px-4 pt-2">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs text-ink-500">{fmt}</div>
          <h1 className="mt-0.5 text-[22px] font-black leading-tight text-ink-900">
            {greeting}
          </h1>
        </div>
        {streak > 0 ? (
          <div className="flex items-center gap-1.5 rounded-full bg-sun-200 px-3 py-1.5 text-xs font-black text-ink-900 shadow-soft">
            <Flame className="h-3.5 w-3.5 text-peach-500" />
            {streak}日連続
          </div>
        ) : null}
      </div>

      {needsOnboarding ? <OnboardingPrompt /> : null}

      {/* 今日の気分 + 帰宅時間 */}
      {hydrated ? <MoodCheckCard /> : null}

      {/* Today progress */}
      <section className="mt-5 overflow-hidden rounded-3xl bg-gradient-to-br from-sky-50 to-peach-50 p-5 shadow-soft">
        {blocks.length > 0 ? (
          <>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-sky-700">
                  今日の進み
                </div>
                <div className="mt-1 text-3xl font-black text-ink-900">
                  <span className="tabular-nums">{doneCount}</span>
                  <span className="mx-1 text-ink-400">/</span>
                  <span className="tabular-nums">{blocks.length}</span>
                  <span className="ml-1 text-sm font-bold text-ink-500">
                    ブロック
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-ink-500">残り目安</div>
                <div className="mt-0.5 text-base font-black text-ink-900">
                  {remainingMin}
                  <span className="ml-0.5 text-xs font-bold text-ink-500">
                    分
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/70">
              <div
                className="h-full rounded-full bg-sky-500"
                style={{
                  width: `${blocks.length === 0 ? 0 : Math.round((doneCount / blocks.length) * 100)}%`,
                }}
              />
            </div>

            <div className="mt-3 text-sm text-ink-700">
              {doneCount === blocks.length
                ? "今日のブロック完了。お疲れさま。"
                : nextIdx >= 0
                ? `次は ${blocks[nextIdx].startTime}、${blocks[nextIdx].subject}。`
                : "次の45分をスタートしましょう。"}
            </div>
          </>
        ) : (
          <EmptyState hydrated={hydrated} />
        )}
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
          {weekDays.map((w, i) => (
            <li
              key={i}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-2xl border py-2.5",
                w.today
                  ? "border-sky-400 bg-sky-50"
                  : "border-cream-200 bg-white",
              )}
            >
              <span
                className={cn(
                  "text-[10px] font-bold",
                  w.today ? "text-sky-600" : "text-ink-500",
                )}
              >
                {w.d}
              </span>
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold",
                  w.done
                    ? "bg-mint-500 text-white"
                    : w.today
                    ? "bg-sky-500 text-white"
                    : "bg-cream-100 text-ink-400",
                )}
              >
                {w.done ? "✓" : w.today ? "•" : ""}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Today blocks */}
      {blocks.length > 0 && latest ? (
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
            {blocks.map((b, i) => (
              <li key={i}>
                <BlockCard
                  testId={latest.id}
                  blockIdx={i}
                  block={b}
                  status={blockStatus[i]}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* AI nudge */}
      {latest ? (
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
                {latest.diagnosis.encouragement}
              </p>
              <Link
                href={`/app/test/${latest.id}`}
                className="mt-2 inline-flex items-center gap-0.5 text-xs font-bold text-sky-600"
              >
                診断レポートを見る
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

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
  );
}

function EmptyState({ hydrated }: { hydrated: boolean }) {
  if (!hydrated) {
    return (
      <div className="py-6 text-center text-sm text-ink-500">読み込み中…</div>
    );
  }
  return (
    <div className="py-4 text-center">
      <div className="text-sm font-bold text-ink-900">
        テストを追加すると、今日の45分が決まります
      </div>
      <p className="mt-1 text-xs text-ink-500">
        模試や校内テストの結果から、AIが弱点と次の手を出します。
      </p>
      <Link
        href="/app/test/new"
        className="mt-3 inline-flex h-10 items-center gap-1 rounded-full bg-sky-500 px-4 text-xs font-black text-white shadow-soft"
      >
        <Plus className="h-4 w-4" />
        最初のテストを追加
      </Link>
    </div>
  );
}

export function OnboardingPrompt() {
  return (
    <Link
      href="/onboarding"
      className="mt-4 flex items-center justify-between rounded-2xl border border-sky-200 bg-sky-50 p-3"
    >
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-sky-700">
          まずはプロフィールから
        </div>
        <div className="mt-0.5 text-sm font-black text-ink-900">
          学年・志望校・勉強時間を入れる
        </div>
        <p className="mt-0.5 text-[11px] text-ink-500">
          ここを埋めるとAIが的確な作戦を出せます。
        </p>
      </div>
      <ChevronRight className="h-5 w-5 text-sky-600" />
    </Link>
  );
}

function BlockCard({
  testId,
  blockIdx,
  block,
  status,
}: {
  testId: string;
  blockIdx: number;
  block: Block;
  status: "done" | "now" | "next" | "past";
}) {
  const done = status === "done";
  const now = status === "now";

  return (
    <article
      className={cn(
        "flex items-stretch gap-3 rounded-2xl border p-3 shadow-soft",
        now
          ? "border-sky-300 bg-white ring-2 ring-sky-100"
          : done
          ? "border-cream-200 bg-cream-50"
          : "border-cream-200 bg-white",
      )}
    >
      <div
        className={cn(
          "flex w-14 flex-none flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-black",
          done
            ? "bg-mint-100 text-mint-600"
            : now
            ? "bg-sky-100 text-sky-600"
            : "bg-cream-100 text-ink-500",
        )}
      >
        <span className="font-mono text-sm tabular-nums">{block.startTime}</span>
        <span className="text-[9px] font-bold uppercase tracking-widest">
          {done ? "完了" : now ? "次" : "予定"}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "flex items-center gap-1 text-sm font-black",
            done ? "text-ink-400 line-through" : "text-ink-900",
          )}
        >
          {block.subject} / {block.topic}
        </div>
        <div className="mt-0.5 text-[11px] text-ink-500">{block.source}</div>
        <div className="mt-2 flex items-center gap-1.5 rounded-xl bg-cream-100 px-2.5 py-1.5">
          <Clock className="h-3 w-3 flex-none text-ink-400" />
          <span className="text-[11px] text-ink-700">{block.completion}</span>
        </div>
      </div>
      {done ? (
        <CheckCircle2 className="h-6 w-6 flex-none self-center text-mint-500" />
      ) : (
        <Link
          href={`/app/focus/run?testId=${testId}&block=${blockIdx}`}
          className={cn(
            "flex flex-none items-center justify-center self-center rounded-full px-3.5 py-2 text-xs font-black",
            now
              ? "bg-sky-500 text-white shadow-soft"
              : "bg-white text-sky-600 border border-sky-200",
          )}
          aria-label="開始"
        >
          <Play className="h-3.5 w-3.5" />
        </Link>
      )}
    </article>
  );
}
