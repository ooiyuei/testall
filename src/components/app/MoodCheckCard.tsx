"use client";

// 今日の準備カード — クリーン版 (現在時刻起点)
// 帰宅時間は設定で事前登録した値を使い、画面では「気分」のみ選ぶ。
// 現在時刻〜就寝時間で物理上限を算出する。
// 「この設定で進める」後は TodaySchedule を表示する。

import { useMemo, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { currentDayISO, logDailyMood, setPlanning } from "@/lib/store";
import { useStore } from "@/lib/hooks/useStore";
import {
  adjustTodayBlocks,
  isWeekend,
  todayBaseBlocks,
} from "@/lib/planning";
import type { Mood } from "@/lib/planning";
import { TodaySchedule } from "./TodaySchedule";

const MOODS: { id: Mood; label: string; delta: string }[] = [
  { id: "today-off", label: "できない", delta: "—" },
  { id: "less",      label: "少なめ",   delta: "-2" },
  { id: "normal",    label: "並",       delta: "±0" },
  { id: "more",      label: "大盛",     delta: "+2" },
  { id: "max",       label: "特盛",     delta: "+4" },
] as const;

const MOOD_SUBTITLES: Record<string, string> = {
  "today-off": "完全休養",
  less: "ゆるく整える",
  normal: "いつもの量",
  more: "集中できそう",
  max: "今日は走り切る",
};

// PDF mock _ _ _ _ (2).png ラベル: 「できない」→「今日はやめる」
const MOOD_LABELS_OVERRIDE: Record<string, string> = {
  "today-off": "今日はやめる",
};

function nowHHmm(): string {
  const d = new Date();
  return (
    String(d.getHours()).padStart(2, "0") +
    ":" +
    String(d.getMinutes()).padStart(2, "0")
  );
}

interface MoodCheckCardProps {
  /** 変更モードで開く場合は true を渡す（decided を false で初期化） */
  forceEdit?: boolean;
  /** 確定後に呼ばれるコールバック */
  onCommitted?: () => void;
}

export function MoodCheckCard({ forceEdit = false, onCommitted }: MoodCheckCardProps = {}) {
  const { state } = useStore();
  const planning = state.planning;
  const [mood, setMood] = useState<Mood>("normal");
  const [decided, setDecided] = useState(!forceEdit);

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

  // 就寝時間を超えている / 残り時間が物理的に0 (today-off は除く)
  const tooLate = mood !== "today-off" && result.availableBlocks <= 0;

  // 特盛りおすすめ: 物理上限が baseBlocks+4 以上あるとき
  const showMaxBadge = !decided && result.availableBlocks >= baseBlocks + 4;

  function commit() {
    if (!planning) setPlanning(profile);
    logDailyMood({
      dateISO: currentDayISO(now),
      mood,
      returnTime: startTime,
      finalBlocks: result.finalBlocks,
      reason: result.reason,
      createdAt: new Date().toISOString(),
    });
    setDecided(true);
    onCommitted?.();
  }

  if (tooLate && !decided) {
    return (
      <section className="rounded-2xl border border-ink-100/80 bg-cream-50 p-5 text-center">
        <div className="text-[10px] font-bold tracking-wide text-ink-500">
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

  if (decided && mood === "today-off") {
    return (
      <section className="rounded-2xl border border-ink-100/80 bg-cream-50 p-5 text-center">
        <div className="text-[10px] font-bold tracking-wide text-ink-500">
          今日は完全休養
        </div>
        <p className="mt-2 text-[15px] font-bold leading-[1.6] text-ink-900">
          しっかり休んで、また明日。
        </p>
        <p className="mt-2 text-[12px] leading-[1.7] text-ink-500">
          休息も勉強の一部です。
        </p>
        <button
          type="button"
          onClick={() => setDecided(false)}
          className="mt-4 text-[11px] font-medium text-ink-400 underline-offset-2 hover:underline"
        >
          気分を変更
        </button>
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
              <div className="text-[10px] font-bold tracking-wide text-sky-600">
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
          wakeupTime={state.profile?.wakeupTime ?? "07:00"}
          returnTime={profile.defaultReturnTime}
          tasks={state.tasks}
          fixedSlots={state.fixedSlots}
          onReset={() => setDecided(false)}
        />
      </>
    );
  }

  return (
    <section className="rounded-2xl border border-ink-100/80 bg-white p-5">
      {/* 「今日の準備」見出しは削除 (二段重ね回避) — 見出しは「今日の気分は？」のみ */}
      <div className="flex items-baseline justify-between">
        <div className="text-[15px] font-bold text-ink-900">今日の気分は？</div>
        <span className="text-[10px] font-medium text-ink-400 tabular-nums">
          就寝 {profile.defaultBedtime}
        </span>
      </div>

      {/* PDF mock _ _ _ _ (2).png: 縦リスト型 */}
      <ul className="mt-3 space-y-1.5">
          {MOODS.map((m) => {
            const active = mood === m.id;
            const showBadge = m.id === "max" && showMaxBadge;
            const sub = MOOD_SUBTITLES[m.id];
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setMood(m.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition active:scale-[0.99]",
                    active
                      ? "bg-ink-900 text-white"
                      : "border border-ink-100/80 bg-white hover:bg-cream-50",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className={cn("text-[14px] font-bold", active ? "text-white" : "text-ink-900")}>
                      {MOOD_LABELS_OVERRIDE[m.id] ?? m.label}
                    </div>
                    <div className={cn("mt-0.5 text-[11px]", active ? "text-white/65" : "text-ink-500")}>
                      {sub}
                    </div>
                  </div>
                  {showBadge ? (
                    <span className="inline-flex flex-none items-center gap-0.5 rounded-full bg-sun-400 px-1.5 py-0.5 text-[10px] font-bold text-ink-900">
                      <Sparkles className="h-2.5 w-2.5" strokeWidth={2.5} /> おすすめ
                    </span>
                  ) : null}
                  {m.delta && m.delta !== "±0" ? (
                    <span
                      className={cn(
                        "flex-none text-[14px] font-bold tabular-nums",
                        active ? "text-white" : m.delta.startsWith("+") ? "text-mint-600" : "text-coral-500",
                      )}
                    >
                      {m.delta}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>

      {mood === "today-off" ? (
        <div className="mt-5 rounded-xl bg-cream-50/80 px-4 py-3 text-center">
          <p className="text-[13px] font-bold text-ink-600">
            今日は完全休養日にする
          </p>
          <p className="mt-1 text-[11px] text-ink-400">
            ブロックは 0 に設定されます
          </p>
        </div>
      ) : (
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
          {/* 内部計算詳細 (基本/気分/物理上限) はユーザーには非公開 */}
        </div>
      )}

      <button
        type="button"
        onClick={commit}
        className="mt-3 flex h-11 w-full items-center justify-center gap-1 rounded-xl bg-ink-900 text-[13px] font-bold text-white active:scale-[0.98] transition"
      >
        決定
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
