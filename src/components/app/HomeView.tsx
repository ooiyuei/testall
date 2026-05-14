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
  Flame,
  Play,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/hooks/useStore";
import { currentDayISO } from "@/lib/store";
import type { Block } from "@/lib/types";
import { MoodCheckCard } from "./MoodCheckCard";
import { TodaySuggestion } from "./TodaySuggestion";
import { GuideTour } from "./GuideTour";
import { WeeklyReviewCard } from "./WeeklyReviewCard";
import { AiChat } from "./AiChat";
import { StreakHeatmap } from "./StreakHeatmap";
import { LoginBonus } from "./LoginBonus";
import { InstallPrompt } from "./InstallPrompt";
import { HomeSkeleton } from "@/components/ui/Skeleton";

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

  // 今日の実完了数 (6時リセット起点・全ソース)
  const todayISO = currentDayISO(now);
  const todayCompletedTotal = useMemo(
    () =>
      state.blockLogs.filter(
        (b) => currentDayISO(new Date(b.completedAt)) === todayISO,
      ).length,
    [state.blockLogs, todayISO],
  );

  // 今日の目標 (mood log があればそれ、なければ latest test の blocks 数)
  const todayMoodLog = useMemo(
    () => state.dailyMoodLogs?.find((l) => l.dateISO === todayISO),
    [state.dailyMoodLogs, todayISO],
  );
  const todayTarget = todayMoodLog?.finalBlocks ?? blocks.length;

  // 今日の進み: 完了数を todayCompletedTotal / target (mood log 優先) で出す
  const doneCount = todayCompletedTotal > 0 ? todayCompletedTotal : blockStatus.filter((s) => s === "done").length;
  const totalCount = Math.max(todayTarget, doneCount);

  // 週間ストリーク (連続日数)
  const streakDays = useMemo(() => {
    const dateSet = new Set(
      state.blockLogs.map((b) => currentDayISO(new Date(b.completedAt))),
    );
    if (dateSet.size === 0) return 0;
    const [ty, tm, td] = todayISO.split("-").map(Number);
    const todayDate = new Date(ty, tm - 1, td);
    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayISO = yesterdayDate.toISOString().slice(0, 10);
    let cursorISO = dateSet.has(todayISO)
      ? todayISO
      : dateSet.has(yesterdayISO)
        ? yesterdayISO
        : null;
    if (!cursorISO) return 0;
    let count = 0;
    const [cy, cm, cd] = cursorISO.split("-").map(Number);
    const cursor = new Date(cy, cm - 1, cd);
    while (dateSet.has(cursor.toISOString().slice(0, 10))) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [state.blockLogs, todayISO]);

  // 今週各曜日の完了ブロック数 (月=0..日=6)
  const weeklyCounts = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    const startOfWeekDate = new Date(now);
    startOfWeekDate.setDate(now.getDate() - todayIdx);
    startOfWeekDate.setHours(0, 0, 0, 0);
    const endOfWeekDate = new Date(startOfWeekDate);
    endOfWeekDate.setDate(startOfWeekDate.getDate() + 7);
    for (const b of state.blockLogs) {
      const d = new Date(b.completedAt);
      if (d >= startOfWeekDate && d < endOfWeekDate) {
        const idx = weekdayIndex(d);
        counts[idx] += 1;
      }
    }
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.blockLogs, todayIdx]);

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

  // ハイドレート中はスケルトンで形を見せる (FOUC 防止)
  if (!hydrated) return <HomeSkeleton />;

  return (
    <div className="px-5 pb-8 pt-3 [&>section]:animate-fade-in-up">
      {state.profile?.onboardedAt ? <GuideTour /> : null}
      {state.profile?.onboardedAt ? <LoginBonus /> : null}
      {state.profile?.onboardedAt ? <InstallPrompt /> : null}
      {/* Hero greeting — Apple HIG 風に大胆なタイポグラフィ */}
      <section className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-medium tracking-wide text-ink-400">
            {dateLabel}
          </div>
          <h1 className="mt-1.5 text-[26px] font-bold leading-[1.15] tracking-[-0.02em] text-ink-900">
            {greeting}
          </h1>
        </div>
        {streakDays > 0 ? (
          <div className="flex flex-none items-center gap-1 rounded-full border border-coral-300/30 bg-coral-300/8 px-3 py-1.5 text-coral-500 shadow-soft">
            <Flame className="h-3.5 w-3.5" strokeWidth={2.4} />
            <span className="text-[12px] font-bold tabular-nums leading-none">
              {streakDays}
              <span className="ml-0.5 text-[10px] font-medium">日</span>
            </span>
          </div>
        ) : null}
      </section>

      {needsOnboarding ? <OnboardingPrompt /> : null}

      {/* 今日のおすすめ */}
      {hydrated ? <WeeklyReviewCard /> : null}
      {hydrated ? <TodaySuggestion state={state} /> : null}

      {/* 今日の準備 (気分 + 帰宅) */}
      {hydrated ? <MoodCheckCard /> : null}

      {/* 今日の進み — Hero カード化 */}
      {totalCount > 0 ? (
        <section className="mt-5 rounded-2xl border border-ink-100/80 bg-white p-5 shadow-soft">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                Today
              </div>
              <div className="mt-1.5 flex items-baseline gap-1.5">
                <span className="text-[44px] font-bold leading-none tabular-nums tracking-[-0.03em] text-ink-900">
                  {doneCount}
                </span>
                <span className="text-lg font-bold text-ink-300">/</span>
                <span className="text-lg font-bold tabular-nums text-ink-400">
                  {totalCount}
                </span>
                <span className="ml-1.5 text-[11px] font-medium text-ink-500">
                  ブロック完了
                </span>
              </div>
            </div>
            <Link
              href="/app/focus"
              className="inline-flex h-10 flex-none items-center gap-1 rounded-full bg-ink-900 px-4 text-[12px] font-bold text-white shadow-soft transition active:scale-[0.96] hover:bg-ink-800"
            >
              <Play className="h-3 w-3" strokeWidth={2.5} fill="currentColor" />
              はじめる
            </Link>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-cream-200/60">
            <div
              className="h-full rounded-full bg-mint-500 transition-all duration-500"
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
            const count = weeklyCounts[i] ?? 0;
            const hasBlocks = count > 0;
            return (
              <li key={d}>
                <div
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl py-2.5 transition",
                    isToday
                      ? "bg-ink-900 text-white"
                      : hasBlocks
                        ? "bg-mint-50 border border-mint-200"
                        : "bg-white border border-ink-100/70",
                  )}
                >
                  <span
                    className={cn(
                      "text-[10px] font-bold",
                      isToday ? "text-white/70" : hasBlocks ? "text-mint-600" : "text-ink-400",
                    )}
                  >
                    {d}
                  </span>
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold tabular-nums",
                      hasBlocks
                        ? isToday
                          ? "bg-white/20 text-white"
                          : "bg-mint-500 text-white"
                        : isToday
                          ? "bg-white/20 text-white"
                          : past
                            ? "bg-cream-100 text-ink-400"
                            : "bg-cream-100 text-ink-300",
                    )}
                  >
                    {hasBlocks ? count : isToday ? "•" : past ? "—" : ""}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 学習ヒートマップ */}
      {hydrated ? (
        <section className="mt-7">
          <StreakHeatmap />
        </section>
      ) : null}

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
  // 日本語タイトルは uppercase / wide tracking を適用しない (英字専用効果のため)
  const isAscii = /^[\x00-\x7F]+$/.test(title);
  return (
    <div className="flex items-baseline justify-between">
      <h2
        className={
          isAscii
            ? "text-[11px] font-bold uppercase tracking-[0.18em] text-ink-400"
            : "text-[11px] font-medium text-ink-500"
        }
      >
        {title}
      </h2>
      {right}
    </div>
  );
}

function EmptyTodayCard() {
  return (
    <section className="mt-5 space-y-2.5">
      {/* 即・25分タイマー */}
      <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50/80 to-mint-50/40 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-white text-sky-500">
            <Play className="h-5 w-5" strokeWidth={2.3} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-bold text-ink-900">
              まず25分、集中してみる
            </div>
            <p className="mt-0.5 text-[11px] leading-[1.7] text-ink-500">
              テストがなくても、タイマーはすぐ使えます。
            </p>
            <Link
              href="/app/focus/run"
              className="mt-3 inline-flex h-10 items-center gap-1 rounded-full bg-sky-500 px-4 text-[12px] font-bold text-white active:scale-[0.97] transition"
            >
              <Play className="h-3.5 w-3.5" strokeWidth={2.4} />
              25分はじめる
            </Link>
          </div>
        </div>
      </div>

      {/* テスト追加で AI 診断 */}
      <div className="rounded-2xl border border-ink-100/80 bg-white p-5 text-center">
        <div className="text-[13px] font-bold text-ink-900">
          テストを追加すると、今日の25分をAIが整えてくれます
        </div>
        <p className="mt-1.5 text-[11px] leading-[1.7] text-ink-500">
          模試・校内テストの結果から弱点と次の手を出します。
        </p>
        <Link
          href="/app/test/new"
          className="mt-3 inline-flex h-9 items-center gap-1 rounded-full bg-ink-900 px-4 text-[11px] font-bold text-white active:scale-[0.97] transition"
        >
          最初のテストを追加
        </Link>
      </div>
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
        <div className="text-[10px] font-bold tracking-[0.04em] text-sky-600">
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
