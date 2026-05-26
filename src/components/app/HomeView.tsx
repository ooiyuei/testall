"use client";

// ホーム — HomeAfterB スタイル (タイムライン主導)
// 主役: 縦タイムラインで done/now/next を一気に把握できる
// 上: コンパクトな pill ヘッダ (アバター + 日付 + ストリーク)
// 中: 「今日のプラン X ブロック残り / あと N 分」 + 縦タイムライン
// 下: 今週 / 今日の気分 2列、その下にプロダクトカード群

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Flame,
  Play,
  Target,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/hooks/useStore";
import { currentDayISO } from "@/lib/store";
import type { Block } from "@/lib/types";
import { MoodCheckCard } from "./MoodCheckCard";
import { GuideTour } from "./GuideTour";
import { LoginBonus } from "./LoginBonus";
import { InstallPrompt } from "./InstallPrompt";
import { DailyTip } from "./DailyTip";
import { HomeSkeleton } from "@/components/ui/Skeleton";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useCountUp } from "@/lib/hooks/useCountUp";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { toast } from "@/components/ui/Toast";
import { fmtMinutes } from "@/lib/format";

const MOOD_LABELS: Record<string, string> = {
  "today-off": "休む",
  less: "少なめ",
  normal: "並",
  more: "大盛",
  max: "特盛",
};

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

  // 「今」は state で持ち、1 分ごとに更新する。
  // こうすると深夜 0 時跨ぎの曜日変化やストリーク更新が画面を閉じなくても反映される。
  // 全 useMemo の依存に正しく入れられる。
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
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
    const endStr = blocks[i]?.endTime;
    if (!endStr || typeof endStr !== "string") return true; // endTime 欠落時は先頭の未完了を now に
    const end = parseHHmm(endStr);
    return end < 0 || end >= nowMin;
  });
  if (nextIdx >= 0) blockStatus[nextIdx] = "now";

  const todayISO = currentDayISO(now);
  const todayCompletedTotal = useMemo(
    () =>
      state.blockLogs.filter(
        (b) => currentDayISO(new Date(b.completedAt)) === todayISO,
      ).length,
    [state.blockLogs, todayISO],
  );

  const todayMoodLog = useMemo(
    () => state.dailyMoodLogs?.find((l) => l.dateISO === todayISO),
    [state.dailyMoodLogs, todayISO],
  );
  const todayTarget = todayMoodLog?.finalBlocks ?? blocks.length;

  const doneCount =
    todayCompletedTotal > 0
      ? todayCompletedTotal
      : blockStatus.filter((s) => s === "done").length;
  const totalCount = Math.max(todayTarget, doneCount);
  const remainingBlocks = Math.max(0, totalCount - doneCount);
  const remainingTimeLabel = fmtMinutes(remainingBlocks * 25);

  // 週間ストリーク
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
  }, [state.blockLogs, todayIdx, now]);

  const weeklyTotal = weeklyCounts.reduce((a, b) => a + b, 0);
  const weeklyMax = Math.max(...weeklyCounts, 1);

  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("ja-JP", {
        month: "numeric",
        day: "numeric",
        weekday: "narrow",
      }).format(now),
    [now],
  );

  const greeting = (() => {
    const h = now.getHours();
    if (h < 5) return "おやすみ前に";
    if (h < 11) return "おはよう";
    if (h < 17) return "こんにちは";
    return "こんばんは";
  })();

  const userInitial = state.profile?.name?.[0] ?? "T";
  const needsOnboarding = hydrated && !state.profile?.onboardedAt;
  const moodLabel = todayMoodLog?.mood ? MOOD_LABELS[todayMoodLog.mood] : "未入力";

  const [showMoodEditor, setShowMoodEditor] = useState(false);
  const animatedRemaining = useCountUp(remainingBlocks);
  const animatedStreak = useCountUp(streakDays);
  const animatedWeekly = useCountUp(weeklyTotal);

  if (!hydrated) return <HomeSkeleton />;

  return (
    <PullToRefresh
      onRefresh={() => {
        toast.success("最新の状態に更新しました");
      }}
    >
    <div className="px-5 pb-8 pt-2 [&>section]:animate-fade-in-up">
      {state.profile?.onboardedAt ? <GuideTour /> : null}
      {state.profile?.onboardedAt ? <LoginBonus /> : null}
      {state.profile?.onboardedAt ? <InstallPrompt /> : null}

      {/* Greeting header — PDF style: avatar + 挨拶 + streak chip */}
      <section className="mt-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-ink-900 text-white text-[15px] font-extrabold">
            {userInitial}
          </div>
          <div>
            <div className="text-[10px] font-medium text-ink-400">{dateLabel}</div>
            <div
              className="text-[18px] font-extrabold leading-tight tracking-[-0.02em] text-ink-900"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {greeting}
            </div>
          </div>
        </div>
        {streakDays > 0 ? (
          <div className="inline-flex items-center gap-1 rounded-full border border-coral-300/40 bg-coral-50 px-2.5 py-1 text-[11px] font-bold text-coral-500">
            <Flame className="h-3 w-3" strokeWidth={2.4} />
            <span className="tabular-nums">{animatedStreak}日</span>
          </div>
        ) : null}
      </section>

      {needsOnboarding ? <OnboardingPrompt /> : null}

      {/* Headline — "今日のプラン" + 残ブロック・残時間 */}
      {totalCount > 0 ? (
        <section className="mt-6">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-medium tracking-wide text-ink-400">
              今日のプラン
            </div>
            <Link
              href="/app/test"
              className="text-[11px] font-bold text-sky-500 transition active:opacity-70"
            >
              テスト一覧
            </Link>
          </div>
          <h1
            className="mt-1 text-[28px] font-extrabold leading-[1.2] tracking-[-0.025em] text-ink-900"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span className="tabular-nums text-sky-500">{animatedRemaining}</span> ブロック残り
            <br />
            <span className="font-bold text-ink-400">
              {remainingBlocks === 0 ? "今日は完了！" : `あと ${remainingTimeLabel}`}
            </span>
          </h1>
        </section>
      ) : null}

      {/* 縦タイムライン (今日のブロック) — PDFの主役 */}
      {totalCount > 0 && latest && blocks.length > 0 ? (
        <section className="mt-5">
          <div className="relative">
            {blocks.map((b, i) => (
              <TimelineRow
                key={i}
                time={b.startTime}
                subject={`${b.subject} / ${b.topic}`}
                source={b.source}
                completion={b.completion}
                status={blockStatus[i]}
                connect={i < blocks.length - 1}
                href={`/app/focus/run?testId=${latest.id}&block=${i}`}
              />
            ))}
          </div>
        </section>
      ) : (
        <EmptyTodayCard />
      )}

      {/* Footer 2-col — 今週 / 今日の気分 */}
      {totalCount > 0 ? (
        <section className="mt-5 grid grid-cols-2 gap-2.5">
          <Link
            href="/app/plan"
            className="rounded-2xl border border-ink-100/80 bg-white p-3.5 transition active:scale-[0.99]"
          >
            <div className="text-[10px] font-semibold text-ink-400">今週</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-[22px] font-extrabold tabular-nums tracking-[-0.02em] text-ink-900">
                {animatedWeekly}
              </span>
              <span className="text-[11px] text-ink-400">ブロック</span>
            </div>
            <div className="mt-2 flex h-[18px] items-end gap-[3px]">
              {weeklyCounts.map((n, i) => {
                const isToday = i === todayIdx;
                const pct = Math.max(8, Math.round((n / weeklyMax) * 100));
                return (
                  <div
                    key={i}
                    className="flex-1 overflow-hidden rounded-[3px] bg-cream-100"
                  >
                    <div
                      className={cn(
                        "ml-0 mt-auto h-full origin-bottom transition-all",
                        isToday ? "bg-ink-900" : "bg-mint-500",
                        n === 0 && "opacity-0",
                      )}
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                );
              })}
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setShowMoodEditor(true)}
            className="rounded-2xl border border-ink-100/80 bg-white p-3.5 text-left w-full transition active:scale-[0.99]"
          >
            <div className="text-[10px] font-semibold text-ink-400">今日の気分</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span
                className="text-[22px] font-extrabold tracking-[-0.02em] text-ink-900"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {moodLabel}
              </span>
            </div>
            <div className="mt-2 inline-flex items-center gap-0.5 text-[11px] font-semibold text-sky-500">
              {todayMoodLog ? "変更する" : "入力する"}
              <ChevronRight className="h-3 w-3" />
            </div>
          </button>
        </section>
      ) : null}

      {/* 未入力時は inline カード、変更時はボトムシート */}
      {hydrated && !todayMoodLog && !showMoodEditor ? (
        <MoodCheckCard />
      ) : null}
      {hydrated && showMoodEditor ? (
        <BottomSheet
          open={showMoodEditor}
          onClose={() => setShowMoodEditor(false)}
          title="今日の気分"
        >
          <MoodCheckCard
            forceEdit
            onCommitted={() => setShowMoodEditor(false)}
          />
        </BottomSheet>
      ) : null}

      {/* 今日のヒント */}
      <DailyTip />

    </div>
    </PullToRefresh>
  );
}

function TimelineRow({
  time,
  subject,
  source,
  completion,
  status,
  connect,
  href,
}: {
  time: string;
  subject: string;
  source: string;
  completion?: string;
  status: "done" | "now" | "next";
  connect: boolean;
  href: string;
}) {
  const done = status === "done";
  const now = status === "now";

  return (
    <div className="flex gap-3">
      {/* time col */}
      <div className="w-12 flex-none pt-1.5">
        <div
          className={cn(
            "text-[12px] font-bold tabular-nums tracking-tight",
            now ? "text-ink-900" : "text-ink-400",
          )}
        >
          {time}
        </div>
      </div>
      {/* dot + connector */}
      <div className="relative w-4 flex-none">
        <div
          className={cn(
            "absolute top-2 left-1 h-2 w-2 rounded-full",
            done && "bg-mint-500",
            now && "bg-sky-500 ring-[5px] ring-sky-500/20",
            !done && !now && "border-2 border-ink-200 bg-white",
          )}
        />
        {connect ? (
          <div className="absolute top-[18px] -bottom-2 left-[7.5px] w-px bg-ink-100" />
        ) : null}
      </div>
      {/* content */}
      <div className="flex-1 pb-4">
        {!now ? (
          <div className="py-1">
            <div
              className={cn(
                "text-[14px] font-bold tracking-tight",
                done ? "text-ink-400 line-through" : "text-ink-900",
              )}
            >
              {subject}
            </div>
            <div className="mt-0.5 text-[11px] text-ink-500">{source}</div>
          </div>
        ) : (
          <div className="rounded-2xl border-[1.5px] border-sky-500 bg-white p-4 shadow-[0_0_0_4px_rgba(0,113,227,0.08),0_8px_24px_-10px_rgba(0,113,227,0.18)]">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-sky-600">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              NEXT UP
            </div>
            <div className="mt-1.5 text-[16px] font-extrabold tracking-tight text-ink-900">
              {subject}
            </div>
            <div className="mt-0.5 text-[11px] text-ink-500">{source}</div>
            {completion ? (
              <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-cream-100/70 px-2.5 py-2 text-[11px] text-ink-700">
                <Target className="h-3 w-3 flex-none text-sky-500" />
                {completion}
              </div>
            ) : null}
            <Link
              href={href}
              className="mt-3 flex h-11 items-center justify-center gap-1.5 rounded-full bg-ink-900 text-[13px] font-bold text-white transition active:scale-[0.98]"
            >
              <Play className="h-3 w-3" strokeWidth={2.5} fill="currentColor" />
              25分はじめる
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyTodayCard() {
  return (
    <section className="mt-5 space-y-2.5">
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
              className="mt-3 inline-flex h-10 items-center gap-1 rounded-full bg-sky-500 px-4 text-[12px] font-bold text-white transition active:scale-[0.97]"
            >
              <Play className="h-3.5 w-3.5" strokeWidth={2.4} />
              25分はじめる
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-ink-100/80 bg-white p-5 text-center">
        <div className="text-[14px] font-bold text-ink-900">
          テスト結果を登録する
        </div>
        <Link
          href="/app/test/new"
          className="mt-3 inline-flex h-9 items-center gap-1 rounded-full bg-ink-900 px-4 text-[11px] font-bold text-white transition active:scale-[0.97]"
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
      className="mt-4 flex items-center justify-between rounded-2xl border border-sky-200 bg-sky-50/60 p-4 transition active:scale-[0.99]"
    >
      <div>
        <div className="text-[10px] font-bold tracking-[0.04em] text-sky-600">
          プロフィール
        </div>
        <div className="mt-1 text-[14px] font-bold text-ink-900">
          学年・志望校・偏差値を入れる
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-sky-500" />
    </Link>
  );
}
