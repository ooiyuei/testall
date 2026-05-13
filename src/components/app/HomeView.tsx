"use client";

// ホーム — Apple HIG ベースのクリーンレイアウト
// 主役: 今日の目標 (MoodCheckCard 後の数字)
// 次: 今日のブロック一覧
// 補足: 今週の進捗 / AI からの一言

import Link from "next/link";
import { useMemo } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Play,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/hooks/useStore";
import type { Block } from "@/lib/types";
import { MoodCheckCard } from "./MoodCheckCard";
import { TodaySuggestion } from "./TodaySuggestion";
import { GuideTour } from "./GuideTour";
import { WeeklyReviewCard } from "./WeeklyReviewCard";
import { AiChat } from "./AiChat";

const WEEKDAY_LABEL = ["月", "火", "水", "木", "金", "土", "日"];

function weekdayIndex(d: Date): number {
  // Mon=0 .. Sun=6
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

  const blockStatus = blocks.map((b, i): "done" | "now" | "next" => {
    const done = state.blockLogs.some(
      (l) => l.testId === latest?.id && l.blockIdx === i,
    );
    return done ? "done" : "next";
  });
  const nextIdx = blockStatus.findIndex((s, i) => {
    if (s !== "next") return false;
    const end = parseHHmm(blocks[i].endTime);
    return end < 0 || end >= nowMin;
  });
  if (nextIdx >= 0) blockStatus[nextIdx] = "now";

  const doneCount = blockStatus.filter((s) => s === "done").length;
  const totalCount = blocks.length;

  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("ja-JP", {
        month: "long",
        day: "numeric",
        weekday: "short",
      }).format(now),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const greeting = state.profile?.name
    ? `おかえり、${state.profile.name}`
    : "おかえりなさい";

  const needsOnboarding = hydrated && !state.profile?.onboardedAt;

  return (
    <div className="px-5 pb-8 pt-3">
      {hydrated && state.profile?.onboardedAt ? <GuideTour /> : null}
      {/* Hero greeting */}
      <section className="mb-5">
        <div className="text-[11px] font-medium tracking-wider text-ink-400">
          {dateLabel}
        </div>
        <h1 className="mt-1 text-[22px] font-bold leading-tight text-ink-900">
          {greeting}
        </h1>
      </section>

      {needsOnboarding ? <OnboardingPrompt /> : null}

      {/* 今日のおすすめ */}
      {hydrated ? <WeeklyReviewCard /> : null}
      {hydrated ? <TodaySuggestion state={state} /> : null}

      {/* 今日の準備 (気分 + 帰宅) */}
      {hydrated ? <MoodCheckCard /> : null}

      {/* 今日の進み */}
      {totalCount > 0 ? (
        <section className="mt-5 rounded-2xl border border-ink-100/80 bg-white p-5">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                Today
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-[40px] font-bold leading-none tabular-nums text-ink-900">
                  {doneCount}
                </span>
                <span className="text-base font-bold text-ink-400">/</span>
                <span className="text-base font-bold tabular-nums text-ink-400">
                  {totalCount}
                </span>
                <span className="ml-1 text-xs font-medium text-ink-500">
                  ブロック完了
                </span>
              </div>
            </div>
            <Link
              href="/app/focus"
              className="inline-flex h-9 items-center gap-1 rounded-full bg-ink-900 px-4 text-[12px] font-bold text-white active:scale-[0.97] transition"
            >
              <Play className="h-3 w-3" strokeWidth={2.5} />
              はじめる
            </Link>
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-cream-200/70">
            <div
              className="h-full rounded-full bg-mint-500 transition-all duration-300"
              style={{
                width: `${totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100)}%`,
              }}
            />
          </div>
        </section>
      ) : (
        <EmptyTodayCard />
      )}

      {/* 今週の流れ */}
      <section className="mt-7">
        <SectionLabel
          title="今週の流れ"
          right={
            <Link
              href="/app/plan"
              className="flex items-center gap-0.5 text-[11px] font-medium text-sky-500"
            >
              週間計画
              <ChevronRight className="h-3 w-3" />
            </Link>
          }
        />
        <ul className="mt-3 grid grid-cols-7 gap-1.5">
          {WEEKDAY_LABEL.map((d, i) => {
            const isToday = i === todayIdx;
            const past = i < todayIdx;
            return (
              <li key={i}>
                <div
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl py-2.5 transition",
                    isToday
                      ? "bg-ink-900 text-white"
                      : "bg-white border border-ink-100/70",
                  )}
                >
                  <span
                    className={cn(
                      "text-[10px] font-bold",
                      isToday ? "text-white/70" : "text-ink-400",
                    )}
                  >
                    {d}
                  </span>
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold tabular-nums",
                      past
                        ? "bg-mint-500 text-white"
                        : isToday
                        ? "bg-white/20 text-white"
                        : "bg-cream-100 text-ink-400",
                    )}
                  >
                    {past ? "✓" : isToday ? "•" : ""}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 今日のブロック */}
      {totalCount > 0 && latest ? (
        <section className="mt-7">
          <SectionLabel
            title="今日の25分ブロック"
            right={
              <Link
                href="/app/focus"
                className="flex items-center gap-0.5 text-[11px] font-medium text-sky-500"
              >
                集中モード
                <ChevronRight className="h-3 w-3" />
              </Link>
            }
          />
          <ul className="mt-3 space-y-2">
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

      {/* AI チャット */}
      {hydrated ? <AiChat state={state} /> : null}

      {/* AI からのひとこと — 一旦削除 (TODO v0.7 で復活) */}
      {false && latest ? (
        <section className="mt-7 rounded-2xl border border-ink-100/80 bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-mint-50 text-mint-600">
              <Sparkles className="h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mint-600">
                AI からのひとこと
              </div>
              <p className="mt-1 text-[13px] leading-[1.7] text-ink-700">
                {latest.diagnosis.encouragement}
              </p>
              <Link
                href={`/app/test/${latest.id}`}
                className="mt-2 inline-flex items-center gap-0.5 text-[11px] font-bold text-sky-500"
              >
                診断レポートを見る
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SectionLabel({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-400">
        {title}
      </h2>
      {right}
    </div>
  );
}

function EmptyTodayCard() {
  return (
    <section className="mt-5 rounded-2xl border border-ink-100/80 bg-white p-5 text-center">
      <div className="text-[15px] font-bold text-ink-900">
        テストを追加すると、今日の25分が決まります
      </div>
      <p className="mt-1.5 text-[12px] leading-[1.7] text-ink-500">
        模試・校内テストの結果からAIが弱点と次の手を出します。
      </p>
      <Link
        href="/app/test/new"
        className="mt-4 inline-flex h-10 items-center gap-1 rounded-full bg-ink-900 px-5 text-[12px] font-bold text-white active:scale-[0.97] transition"
      >
        最初のテストを追加
      </Link>
    </section>
  );
}

export function OnboardingPrompt() {
  return (
    <Link
      href="/onboarding"
      className="mb-4 flex items-center justify-between rounded-2xl border border-sky-200 bg-sky-50/60 p-4 active:scale-[0.99] transition"
    >
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-600">
          まずはプロフィール
        </div>
        <div className="mt-1 text-[14px] font-bold text-ink-900">
          学年・志望校・偏差値を入れる
        </div>
        <p className="mt-0.5 text-[11px] leading-[1.6] text-ink-500">
          ここを埋めるとAIが的確な作戦を出せます。
        </p>
      </div>
      <ChevronRight className="h-5 w-5 text-sky-500" />
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
  status: "done" | "now" | "next";
}) {
  const done = status === "done";
  const now = status === "now";

  return (
    <article
      className={cn(
        "flex items-stretch gap-3 rounded-2xl border p-3 transition",
        now
          ? "border-sky-300 bg-white shadow-[0_0_0_3px_rgba(0,113,227,0.08)]"
          : done
          ? "border-ink-100/70 bg-cream-50/70"
          : "border-ink-100/80 bg-white",
      )}
    >
      <div
        className={cn(
          "flex w-14 flex-none flex-col items-center justify-center gap-0.5 rounded-xl",
          done
            ? "bg-mint-50 text-mint-600"
            : now
            ? "bg-sky-50 text-sky-600"
            : "bg-cream-100 text-ink-500",
        )}
      >
        <span className="text-sm font-bold tabular-nums">{block.startTime}</span>
        <span className="text-[9px] font-bold uppercase tracking-wider">
          {done ? "完了" : now ? "次" : "予定"}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "text-[14px] font-bold",
            done ? "text-ink-400 line-through" : "text-ink-900",
          )}
        >
          {block.subject} / {block.topic}
        </div>
        <div className="mt-0.5 text-[11px] text-ink-500">{block.source}</div>
        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-cream-100/70 px-2 py-1.5">
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
            "flex flex-none items-center justify-center self-center rounded-full px-4 py-2 text-[11px] font-bold transition",
            now
              ? "bg-ink-900 text-white"
              : "bg-cream-100 text-ink-700 border border-ink-100/80",
          )}
          aria-label="開始"
        >
          <Play className="h-3 w-3" strokeWidth={2.5} />
        </Link>
      )}
    </article>
  );
}
