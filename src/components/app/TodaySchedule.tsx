"use client";

// 今日のタイムスケジュール表示
// MoodCheckCard で「この設定で進める」を押した後に表示される。
// 縦方向 15分刻みタイムライン。

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";
import { buildTodaySchedule } from "@/lib/planning/today-schedule";
import type { ScheduleInput, ScheduleResult, ScheduleSlot } from "@/lib/planning/today-schedule";
import type { StoredTask } from "@/lib/store";

// ── 色マッピング ────────────────────────────
const KIND_BG: Record<ScheduleSlot["kind"], string> = {
  study: "bg-sky-100 border-sky-200",
  break: "bg-cream-100 border-cream-200",
  buffer: "bg-white border-ink-100/60",
  meal: "bg-orange-50 border-orange-200",
  "sleep-soon": "bg-ink-50 border-ink-100/80",
};

const KIND_DOT: Record<ScheduleSlot["kind"], string> = {
  study: "bg-sky-400",
  break: "bg-cream-400",
  buffer: "bg-ink-200",
  meal: "bg-orange-400",
  "sleep-soon": "bg-ink-300",
};

const KIND_LABEL: Record<ScheduleSlot["kind"], string> = {
  study: "学習",
  break: "休憩",
  buffer: "自由",
  meal: "食事",
  "sleep-soon": "就寝準備",
};

// ── 現在時刻を "HH:MM" で ────────────────────
function nowHHmm(): string {
  const d = new Date();
  return (
    String(d.getHours()).padStart(2, "0") +
    ":" +
    String(d.getMinutes()).padStart(2, "0")
  );
}

function timeToMin(hhmm: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return 0;
  return Number(m[1]) * 60 + Number(m[2]);
}

// ── Props ──────────────────────────────────
type TodayScheduleProps = {
  finalBlocks: number;
  bedtime: string;
  tasks?: StoredTask[];
  onReset?: () => void;
};

function buildInput(
  finalBlocks: number,
  bedtime: string,
  tasks: StoredTask[] | undefined,
): ScheduleInput {
  // 優先度順に未完了タスクを取り出し、finalBlocks まで割り当て
  const activeTasks = (tasks ?? [])
    .filter((t) => t.status !== "done")
    .sort((a, b) => a.priority - b.priority);

  // ブロック数の累計が finalBlocks を超えないようにトリム
  let remaining = finalBlocks;
  const scheduleTasks: ScheduleInput["tasks"] = [];
  for (const t of activeTasks) {
    if (remaining <= 0) break;
    const take = Math.min(t.blocks, remaining);
    scheduleTasks.push({
      title: t.title,
      blocks: take,
      subject: t.subjectArea,
      taskId: t.id,
    });
    remaining -= take;
  }

  return {
    startTime: nowHHmm(),
    bedtime,
    finalBlocks,
    tasks: scheduleTasks,
  };
}

// ── スロット1行 ────────────────────────────
function SlotRow({
  slot,
  isCurrent,
}: {
  slot: ScheduleSlot;
  isCurrent: boolean;
}) {
  const isStudy = slot.kind === "study";
  const heightClass = slot.durationMin >= 30 ? "min-h-[60px]" : "min-h-[36px]";

  return (
    <div className="flex gap-2">
      {/* 時刻軸 */}
      <div className="w-12 shrink-0 pt-1 text-right">
        <span className="text-[10px] font-medium tabular-nums text-ink-400">
          {slot.startTime}
        </span>
      </div>

      {/* インジケーター */}
      <div className="flex shrink-0 flex-col items-center">
        <div
          className={cn(
            "mt-1.5 h-2 w-2 rounded-full",
            isCurrent ? "bg-sky-500 ring-2 ring-sky-200" : KIND_DOT[slot.kind],
          )}
        />
        <div className="flex-1 border-l border-dashed border-ink-100" />
      </div>

      {/* カード */}
      <div
        className={cn(
          "mb-1.5 flex-1 rounded-xl border px-3 py-2",
          heightClass,
          KIND_BG[slot.kind],
          isCurrent && "ring-2 ring-sky-300/60",
        )}
      >
        <div className="flex items-baseline justify-between gap-1">
          <span
            className={cn(
              "text-[12px] font-bold leading-[1.4]",
              slot.kind === "study" ? "text-sky-900" : "text-ink-700",
            )}
          >
            {slot.label}
          </span>
          <span className="shrink-0 text-[10px] font-medium text-ink-400">
            {slot.durationMin}分
          </span>
        </div>
        {slot.kind !== "study" && (
          <span className="text-[10px] text-ink-400">{KIND_LABEL[slot.kind]}</span>
        )}
        {isStudy && slot.blockIdx !== undefined && (
          <span className="text-[10px] text-sky-600">
            ブロック {slot.blockIdx + 1}
          </span>
        )}
      </div>
    </div>
  );
}

// ── メインコンポーネント ────────────────────
export function TodaySchedule({ finalBlocks, bedtime, tasks, onReset }: TodayScheduleProps) {
  const [result, setResult] = useState<ScheduleResult | null>(null);
  const [currentNow, setCurrentNow] = useState(nowHHmm());
  const currentRowRef = useRef<HTMLDivElement>(null);

  // 初回 + 「途中復帰」で再計算
  const recalculate = () => {
    const nowStr = nowHHmm();
    setCurrentNow(nowStr);
    setResult(buildTodaySchedule(buildInput(finalBlocks, bedtime, tasks)));
  };

  useEffect(() => {
    recalculate();
    // 5分ごとに現在位置を更新
    const timer = setInterval(() => {
      setCurrentNow(nowHHmm());
    }, 60_000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalBlocks, bedtime]);

  // 現在スロットへスクロール
  useEffect(() => {
    if (currentRowRef.current) {
      currentRowRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [result]);

  if (!result) return null;

  const nowMin = timeToMin(currentNow);

  // 現在時刻が含まれるスロットを検出
  const currentSlotIdx = result.slots.findIndex((s, i) => {
    const start = timeToMin(s.startTime);
    const next = result.slots[i + 1]
      ? timeToMin(result.slots[i + 1].startTime)
      : start + s.durationMin;
    return nowMin >= start && nowMin < next;
  });

  const studyCount = result.slots.filter((s) => s.kind === "study").length;

  return (
    <section className="mt-5 rounded-2xl border border-ink-100/80 bg-white overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100/60">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
            今日のスケジュール
          </div>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-[22px] font-bold tabular-nums text-ink-900">
              {studyCount}
            </span>
            <span className="text-xs font-medium text-ink-500">
              ブロック / 就寝 {bedtime}
            </span>
            {!result.fitsInTime && (
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                時間不足
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={recalculate}
            className="flex h-8 items-center gap-1 rounded-full border border-ink-100/80 bg-white px-3 text-[11px] font-medium text-ink-600 transition active:scale-[0.97]"
          >
            <RefreshCw className="h-3 w-3" />
            途中復帰
          </button>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="flex h-8 items-center gap-1 rounded-full border border-ink-100/80 bg-white px-3 text-[11px] font-medium text-ink-600 transition active:scale-[0.97]"
            >
              やり直す
            </button>
          )}
        </div>
      </div>

      {/* タイムライン */}
      <div className="max-h-[480px] overflow-y-auto px-4 py-3">
        {result.slots.map((slot, i) => {
          const isCurrent = i === currentSlotIdx;
          return (
            <div key={`${slot.startTime}-${i}`} ref={isCurrent ? currentRowRef : undefined}>
              <SlotRow slot={slot} isCurrent={isCurrent} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
