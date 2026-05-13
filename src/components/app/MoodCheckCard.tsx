"use client";

// 今日の準備カード — クリーン版 (現在時刻起点)
// 帰宅時間は設定で事前登録した値を使い、画面では「気分」のみ選ぶ。
// 現在時刻〜就寝時間で物理上限を算出する。
// 「この設定で進める」後は TodaySchedule を表示する。

import { useMemo, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { logDailyMood, setPlanning } from "@/lib/store";
import { useStore } from "@/lib/hooks/useStore";
import {
  adjustTodayBlocks,
  isWeekend,
  todayBaseBlocks,
} from "@/lib/planning";
import type { Mood } from "@/lib/planning";
import { TodaySchedule } from "./TodaySchedule";

const MOODS: { id: Mood; label: string; delta: string }[] = [
  { id: "less",   label: "少なめ", delta: "-2" },
  { id: "normal", label: "並",     delta: "±0" },
  { id: "more",   label: "大盛",   delta: "+2" },
  { id: "max",    label: "特盛",   delta: "+4" },
];

function nowHHmm(): string {
  const d = new Date();
  return (
    String(d.getHours()).padStart(2, "0") +
    ":" +
    String(d.getMinutes()).padStart(2, "0")
  );
}

export function MoodCheckCard() {
  const { state } = useStore();
  const planning = state.planning;
  const [mood, setMood] = useState<Mood>("normal");
  const [decided, setDecided] = useState(false);

  const profile = useMemo(
    () =>
      planning ?? {
        weekdayBaseBlocks: 3,
        weekendBaseBlocks: 6,
        defaultReturnTime: "18:30",
        defaultBedtime: "23:30",
        bufferMinutes: 60,
      },
    [planning],
  );

  // 起算は「現在時刻」と「事前設定の帰宅時間」のうち、後の方
  const now = new Date();
  const currentTime = nowHHmm();
  const startTime =
    parseTimeToMinutes(currentTime) > parseTimeToMinutes(profile.defaultReturnTime)
      ? currentTime
      : profile.defaultReturnTime;

  const baseBlocks = todayBaseBlocks(
    now,
    profile.weekdayBaseBlocks,
    profile.weekendBaseBlocks,
  );

  const result = adjustTodayBlocks({
    baseBlocks,
    mood,
    returnTime: startTime,
    bedtime: profile.defaultBedtime,
    bufferMinutes: profile.bufferMinutes,
    // ポモドーロ: 25分集中 + 5分休憩 = 30分占有
    blockMinutes: 30,
  });

  // 就寝時間を超えている / 残り時間が物理的に0
  const tooLate = result.availableBlocks <= 0;

  function commit() {
    if (!planning) setPlanning(profile);
    logDailyMood({
      dateISO: now.toISOString().slice(0, 10),
      mood,
      returnTime: startTime,
      finalBlocks: result.finalBlocks,
      reason: result.reason,
      createdAt: new Date().toISOString(),
    });
    setDecided(true);
  }

  if (tooLate && !decided) {
    return (
      <section className="rounded-2xl border border-ink-100/80 bg-cream-50 p-5 text-center">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
          今日はもう
        </div>
        <p className="mt-2 text-[15px] font-bold leading-[1.6] text-ink-900">
          就寝時間まで時間がありません。<br />しっかり休んで、明日にしましょう 🌙
        </p>
        <p className="mt-2 text-[11px] text-ink-500">
          就寝 {profile.defaultBedtime} まで残り{result.availableBlocks <= 0 ? "わずか" : ""}
        </p>
      </section>
    );
  }

  if (decided) {
    return (
      <>
        <section className="rounded-2xl border border-sky-200/70 bg-gradient-to-br from-sky-50/80 to-mint-50/40 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-white text-sky-500">
              <Sparkles className="h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-600">
                今日の目標
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-[40px] font-bold leading-none tabular-nums text-ink-900">
                  {result.finalBlocks}
                </span>
                <span className="text-xs font-medium text-ink-500">
                  ブロック (25分×{result.finalBlocks})
                </span>
              </div>
              <p className="mt-2 text-[12px] leading-[1.6] text-ink-600">
                {result.reason}
              </p>
              <button
                type="button"
                onClick={() => setDecided(false)}
                className="mt-2 text-[11px] font-medium text-sky-500 underline-offset-2 hover:underline"
              >
                気分を変更
              </button>
            </div>
          </div>
        </section>
        <TodaySchedule
          finalBlocks={result.finalBlocks}
          bedtime={profile.defaultBedtime}
          tasks={state.tasks}
          onReset={() => setDecided(false)}
        />
      </>
    );
  }

  return (
    <section className="rounded-2xl border border-ink-100/80 bg-white p-5">
      <div className="flex items-baseline justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
          今日の準備
        </div>
        <span className="text-[10px] font-medium text-ink-400 tabular-nums">
          今 {currentTime} → 就寝 {profile.defaultBedtime}
        </span>
      </div>

      <div className="mt-3">
        <div className="text-[13px] font-bold text-ink-900">気分は？</div>
        <ul className="mt-2 flex gap-1 rounded-xl bg-cream-100/70 p-1">
          {MOODS.map((m) => {
            const active = mood === m.id;
            return (
              <li key={m.id} className="flex-1">
                <button
                  type="button"
                  onClick={() => setMood(m.id)}
                  className={cn(
                    "flex h-10 w-full flex-col items-center justify-center rounded-lg transition",
                    active ? "bg-white shadow-soft" : "bg-transparent",
                  )}
                >
                  <span
                    className={cn(
                      "text-[12px] font-bold",
                      active ? "text-ink-900" : "text-ink-500",
                    )}
                  >
                    {m.label}
                  </span>
                  <span
                    className={cn(
                      "text-[9px] font-medium tabular-nums",
                      active ? "text-ink-400" : "text-ink-300",
                    )}
                  >
                    {m.delta}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-5 flex items-end justify-between rounded-xl bg-cream-50/80 px-4 py-3">
        <div>
          <div className="text-[10px] font-medium text-ink-500">
            今日のブロック
          </div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-3xl font-bold leading-none tabular-nums text-ink-900">
              {result.finalBlocks}
            </span>
            <span className="text-[10px] font-medium text-ink-500">
              ×25分
            </span>
          </div>
        </div>
        <div className="text-right text-[10px] leading-[1.6] text-ink-500">
          基本 {baseBlocks} · 気分 {result.moodDelta >= 0 ? "+" : ""}
          {result.moodDelta}
          <br />
          物理上限 {result.availableBlocks}
        </div>
      </div>

      <button
        type="button"
        onClick={commit}
        className="mt-3 flex h-11 w-full items-center justify-center gap-1 rounded-xl bg-ink-900 text-[13px] font-bold text-white active:scale-[0.98] transition"
      >
        この設定で進める
        <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
      </button>
    </section>
  );
}

function parseTimeToMinutes(hhmm: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return 0;
  return Number(m[1]) * 60 + Number(m[2]);
}
