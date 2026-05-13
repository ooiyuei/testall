"use client";

// 今日の気分 + 帰宅時間 ピッカー
// 計画AI v0.1 の §3〜§5 を実装
// 結果は dailyMoodLogs に保存され、HomeView に「今日の最終ブロック数」を返す

import { useMemo, useState } from "react";
import { Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  logDailyMood,
  setPlanning,
} from "@/lib/store";
import { useStore } from "@/lib/hooks/useStore";
import {
  adjustTodayBlocks,
  isWeekend,
  todayBaseBlocks,
} from "@/lib/planning";
import type { Mood } from "@/lib/planning";

const MOOD_OPTIONS: { id: Mood; label: string; sub: string; tone: string }[] = [
  { id: "less", label: "少なめ", sub: "−2", tone: "bg-cream-100 text-ink-700" },
  { id: "normal", label: "並盛り", sub: "通常", tone: "bg-sky-500 text-white" },
  { id: "more", label: "大盛り", sub: "+2", tone: "bg-peach-200 text-peach-500" },
  { id: "max", label: "特盛り", sub: "+4", tone: "bg-sun-300 text-ink-900" },
];

const RETURN_OPTIONS: { id: string; label: string; offset: number }[] = [
  { id: "usual", label: "いつも通り", offset: 0 },
  { id: "earlier", label: "予定より早い", offset: -60 },
  { id: "later", label: "予定より遅い", offset: +60 },
];

function shiftTime(time: string, offsetMin: number): string {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  let total = h * 60 + m + offsetMin;
  total = Math.max(0, Math.min(24 * 60, total));
  const hh = Math.floor(total / 60).toString().padStart(2, "0");
  const mm = (total % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

export function MoodCheckCard() {
  const { state } = useStore();
  const planning = state.planning;
  const [mood, setMood] = useState<Mood>("normal");
  const [returnChoice, setReturnChoice] = useState("usual");
  const [customTime, setCustomTime] = useState("");
  const [decided, setDecided] = useState(false);

  // 初期値（プランニング未設定なら平日3 / 休日6, 帰宅18:30 / 就寝24:00）
  const profile = useMemo(
    () =>
      planning ?? {
        weekdayBaseBlocks: 3,
        weekendBaseBlocks: 6,
        defaultReturnTime: "18:30",
        defaultBedtime: "24:00",
        bufferMinutes: 90,
      },
    [planning],
  );

  const now = new Date();
  const baseBlocks = todayBaseBlocks(
    now,
    profile.weekdayBaseBlocks,
    profile.weekendBaseBlocks,
  );

  const returnTime =
    returnChoice === "custom"
      ? customTime || profile.defaultReturnTime
      : shiftTime(
          profile.defaultReturnTime,
          RETURN_OPTIONS.find((r) => r.id === returnChoice)?.offset ?? 0,
        );

  const result = adjustTodayBlocks({
    baseBlocks,
    mood,
    returnTime,
    bedtime: profile.defaultBedtime,
    bufferMinutes: profile.bufferMinutes,
  });

  function commit() {
    // プランニング初期値を保存しておく（onboardingの後付け）
    if (!planning) setPlanning(profile);
    logDailyMood({
      dateISO: now.toISOString().slice(0, 10),
      mood,
      returnTime,
      finalBlocks: result.finalBlocks,
      reason: result.reason,
      createdAt: new Date().toISOString(),
    });
    setDecided(true);
  }

  if (decided) {
    return (
      <section className="mt-5 rounded-3xl border border-sky-200 bg-sky-50 p-4 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-2xl bg-white text-sky-600">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-sky-700">
              今日の目標
            </div>
            <div className="mt-0.5 text-2xl font-black text-ink-900">
              {result.finalBlocks}
              <span className="ml-1 text-sm font-bold text-ink-500">ブロック</span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-700">
              {result.reason}
            </p>
            <button
              type="button"
              onClick={() => setDecided(false)}
              className="mt-2 text-[10px] font-bold text-sky-600 underline"
            >
              気分を変更
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-5 rounded-3xl border border-cream-200 bg-white p-4 shadow-soft">
      <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
        今日の準備
      </div>

      <div className="mt-2">
        <div className="text-sm font-bold text-ink-900">気分は？</div>
        <ul className="mt-2 grid grid-cols-4 gap-1.5">
          {MOOD_OPTIONS.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => setMood(o.id)}
                className={cn(
                  "flex h-14 w-full flex-col items-center justify-center rounded-xl text-[10px] font-bold transition",
                  mood === o.id
                    ? o.tone + " shadow-soft"
                    : "bg-cream-50 text-ink-500",
                )}
              >
                <span className="text-xs font-black">{o.label}</span>
                <span className="text-[9px]">{o.sub}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-ink-900">今日の帰宅</div>
          <div className="flex items-center gap-1 text-[10px] text-ink-500">
            <Clock className="h-3 w-3" />
            <span>{returnTime}</span>
          </div>
        </div>
        <ul className="mt-2 grid grid-cols-4 gap-1.5">
          {RETURN_OPTIONS.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => setReturnChoice(o.id)}
                className={cn(
                  "flex h-10 w-full items-center justify-center rounded-xl text-[10px] font-bold transition",
                  returnChoice === o.id
                    ? "bg-ink-900 text-white"
                    : "bg-cream-50 text-ink-700",
                )}
              >
                {o.label}
              </button>
            </li>
          ))}
          <li>
            <input
              type="time"
              value={customTime}
              onChange={(e) => {
                setCustomTime(e.target.value);
                setReturnChoice("custom");
              }}
              className={cn(
                "h-10 w-full rounded-xl text-center text-[10px] font-bold outline-none transition",
                returnChoice === "custom"
                  ? "bg-ink-900 text-white"
                  : "bg-cream-50 text-ink-700",
              )}
            />
          </li>
        </ul>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-2xl bg-cream-50 p-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
            今日のブロック
          </div>
          <div className="mt-0.5 text-xl font-black text-ink-900 tabular-nums">
            {result.finalBlocks}
          </div>
        </div>
        <div className="text-right text-[10px] text-ink-500 leading-snug">
          基本 {baseBlocks}・気分 {result.moodDelta >= 0 ? "+" : ""}
          {result.moodDelta}
          <br />
          上限 {result.availableBlocks} （帰宅 {returnTime} → 就寝 {profile.defaultBedtime}）
        </div>
      </div>

      <button
        type="button"
        onClick={commit}
        className="mt-3 flex h-12 w-full items-center justify-center rounded-2xl bg-sky-500 text-sm font-black text-white shadow-soft active:scale-[0.98] transition"
      >
        この設定で進める
      </button>
    </section>
  );
}
