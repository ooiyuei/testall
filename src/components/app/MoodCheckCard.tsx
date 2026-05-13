"use client";

// 今日の準備カード — クリーン版
// 気分セグメント + 帰宅セグメント → 今日のブロック計算結果

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

const MOODS: { id: Mood; label: string; delta: string }[] = [
  { id: "less",   label: "少なめ", delta: "-2" },
  { id: "normal", label: "並",     delta: "±0" },
  { id: "more",   label: "大盛",   delta: "+2" },
  { id: "max",    label: "特盛",   delta: "+4" },
];

const RETURNS: { id: string; label: string; offset: number }[] = [
  { id: "earlier", label: "早め",     offset: -60 },
  { id: "usual",   label: "いつも",   offset: 0 },
  { id: "later",   label: "遅め",     offset: +60 },
];

function shiftTime(time: string, offsetMin: number): string {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  let total = Math.max(0, Math.min(24 * 60, h * 60 + m + offsetMin));
  return (
    String(Math.floor(total / 60)).padStart(2, "0") +
    ":" +
    String(total % 60).padStart(2, "0")
  );
}

export function MoodCheckCard() {
  const { state } = useStore();
  const planning = state.planning;
  const [mood, setMood] = useState<Mood>("normal");
  const [returnChoice, setReturnChoice] = useState("usual");
  const [customTime, setCustomTime] = useState("");
  const [decided, setDecided] = useState(false);

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
          RETURNS.find((r) => r.id === returnChoice)?.offset ?? 0,
        );

  const result = adjustTodayBlocks({
    baseBlocks,
    mood,
    returnTime,
    bedtime: profile.defaultBedtime,
    bufferMinutes: profile.bufferMinutes,
  });

  function commit() {
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

  // 確定後カード
  if (decided) {
    return (
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
              <span className="text-xs font-medium text-ink-500">ブロック</span>
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
    );
  }

  // 入力カード
  return (
    <section className="rounded-2xl border border-ink-100/80 bg-white p-5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
        今日の準備
      </div>

      <div className="mt-3">
        <div className="text-[13px] font-bold text-ink-900">気分は？</div>
        <SegmentRow
          value={mood}
          options={MOODS.map((m) => ({ id: m.id, label: m.label, sub: m.delta }))}
          onChange={(v) => setMood(v as Mood)}
        />
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <div className="text-[13px] font-bold text-ink-900">今日の帰宅</div>
          <span className="text-[11px] font-medium text-ink-400 tabular-nums">
            {returnTime}
          </span>
        </div>
        <SegmentRow
          value={returnChoice}
          options={RETURNS.map((r) => ({ id: r.id, label: r.label }))}
          onChange={setReturnChoice}
        />
        <div className="mt-2 flex items-center gap-2">
          <input
            type="time"
            value={customTime}
            onChange={(e) => {
              setCustomTime(e.target.value);
              setReturnChoice("custom");
            }}
            className={cn(
              "h-9 flex-1 rounded-xl border bg-cream-50 px-3 text-[13px] text-ink-900 outline-none transition",
              returnChoice === "custom"
                ? "border-sky-300 bg-white"
                : "border-ink-100/80",
            )}
            placeholder="時刻を指定"
          />
        </div>
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
            <span className="text-[10px] font-medium text-ink-500">blk</span>
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

function SegmentRow({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { id: string; label: string; sub?: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <ul className="mt-2 flex gap-1 rounded-xl bg-cream-100/70 p-1">
      {options.map((o) => {
        const active = value === o.id;
        return (
          <li key={o.id} className="flex-1">
            <button
              type="button"
              onClick={() => onChange(o.id)}
              className={cn(
                "flex h-10 w-full flex-col items-center justify-center rounded-lg transition",
                active
                  ? "bg-white shadow-soft"
                  : "bg-transparent active:bg-white/40",
              )}
            >
              <span
                className={cn(
                  "text-[12px] font-bold",
                  active ? "text-ink-900" : "text-ink-500",
                )}
              >
                {o.label}
              </span>
              {o.sub ? (
                <span
                  className={cn(
                    "text-[9px] font-medium tabular-nums",
                    active ? "text-ink-400" : "text-ink-300",
                  )}
                >
                  {o.sub}
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
