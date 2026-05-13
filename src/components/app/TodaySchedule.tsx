"use client";

// 今日のタイムスケジュール表示 v2.0
// 朝0時〜翌0時の全日タイムライン
// 4ゾーン（深夜・学校・夕方・深夜後）アコーディオン表示
// 日付ナビ付き（今日/翌日/翌々日）

import { useEffect, useRef, useState } from "react";
import { RefreshCw, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/cn";
import { buildTodaySchedule } from "@/lib/planning/today-schedule";
import type { ScheduleInput, ScheduleResult, ScheduleSlot } from "@/lib/planning/today-schedule";
import { effectivePriority } from "@/lib/store";
import type { FixedSlot, StoredTask } from "@/lib/store";

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

// ── 時刻ユーティリティ ─────────────────────
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

function minToHHmm(totalMin: number): string {
  const h = Math.floor(totalMin / 60) % 24;
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatDateLabel(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  if (offsetDays === 0) return "今日";
  if (offsetDays === 1) return "明日";
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return `${mm}/${dd}(${days[d.getDay()]})`;
}

// ── ゾーン定義 ─────────────────────────────
type ZoneId = "midnight" | "school" | "evening" | "latenight";

type Zone = {
  id: ZoneId;
  label: string;
  startMin: number;
  endMin: number;
};

// ゾーンを動的に生成（起床/帰宅/就寝に応じて）
function buildZones(wakeupMin: number, returnMin: number, bedMin: number): Zone[] {
  return [
    { id: "midnight", label: "深夜・早朝", startMin: 0, endMin: wakeupMin },
    { id: "school",   label: "学校",       startMin: wakeupMin, endMin: returnMin },
    { id: "evening",  label: "夕方〜夜",   startMin: returnMin, endMin: bedMin },
    { id: "latenight", label: "就寝後",    startMin: bedMin, endMin: 24 * 60 },
  ];
}

// ── タイムラインアイテム ───────────────────
type CompressedBlock = {
  type: "compressed";
  startTime: string;
  endTime: string;
  label: string;
};

// 圧縮ゾーン用: 60分単位で1行にまとめる
function buildMidnightItems(
  wakeupMin: number,
  isToday: boolean,
): CompressedBlock[] {
  if (wakeupMin <= 0) return [];
  const items: CompressedBlock[] = [];
  // 60分単位で1行に圧縮
  for (let min = 0; min < wakeupMin; min += 60) {
    const end = Math.min(min + 60, wakeupMin);
    items.push({
      type: "compressed",
      startTime: minToHHmm(min),
      endTime: minToHHmm(end),
      label: isToday && min < timeToMin(nowHHmm()) ? "睡眠中（過去）" : "睡眠中",
    });
  }
  return items;
}

function buildLatenightItems(bedMin: number, _isToday: boolean): CompressedBlock[] {
  if (bedMin >= 24 * 60) return [];
  const items: CompressedBlock[] = [];
  for (let min = bedMin; min < 24 * 60; min += 60) {
    const end = Math.min(min + 60, 24 * 60);
    items.push({
      type: "compressed",
      startTime: minToHHmm(min),
      endTime: minToHHmm(end),
      label: "就寝中",
    });
  }
  return items;
}

// ── Props ──────────────────────────────────
type TodayScheduleProps = {
  finalBlocks: number;
  bedtime: string;
  wakeupTime?: string;       // "07:00"
  returnTime?: string;       // "18:00"
  tasks?: StoredTask[];
  fixedSlots?: FixedSlot[];
  onReset?: () => void;
};

function buildScheduleInput(
  finalBlocks: number,
  bedtime: string,
  startTime: string,
  tasks: StoredTask[] | undefined,
  fixedSlots: FixedSlot[] | undefined,
  today: Date,
): ScheduleInput {
  // 期日迫りで優先度が自動UPする effectivePriority を使う
  const activeTasks = (tasks ?? [])
    .filter((t) => t.status !== "done")
    .sort((a, b) => effectivePriority(a) - effectivePriority(b));

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

  // 今日の曜日に該当する固定スロットを抽出
  const weekday = (today.getDay() + 6) % 7; // 0=月..6=日
  const todayFixedSlots = (fixedSlots ?? [])
    .filter((s) => !s.weekdays || s.weekdays.length === 0 || s.weekdays.includes(weekday))
    .map((s) => ({
      startTime: s.startTime,
      durationMin: s.durationMin,
      label: s.label,
    }));

  return {
    startTime,
    bedtime,
    finalBlocks,
    tasks: scheduleTasks,
    fixedSlots: todayFixedSlots,
  };
}

// ── スロット1行 ────────────────────────────
function SlotRow({
  slot,
  isCurrent,
  isPast,
}: {
  slot: ScheduleSlot;
  isCurrent: boolean;
  isPast: boolean;
}) {
  const heightClass = slot.durationMin >= 30 ? "min-h-[60px]" : "min-h-[36px]";

  return (
    <div className={cn("flex gap-2", isPast && "opacity-40")}>
      <div className="w-12 shrink-0 pt-1 text-right">
        <span className="text-[10px] font-medium tabular-nums text-ink-400">
          {slot.startTime}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-center">
        <div
          className={cn(
            "mt-1.5 h-2 w-2 rounded-full",
            isCurrent ? "bg-sky-500 ring-2 ring-sky-200" : KIND_DOT[slot.kind],
          )}
        />
        <div className="flex-1 border-l border-dashed border-ink-100" />
      </div>
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
        {slot.kind === "study" && slot.blockIdx !== undefined && (
          <span className="text-[10px] text-sky-600">ブロック {slot.blockIdx + 1}</span>
        )}
      </div>
    </div>
  );
}

// ── 圧縮行 ────────────────────────────────
function CompressedRow({ item, isPast }: { item: CompressedBlock; isPast: boolean }) {
  return (
    <div className={cn("flex gap-2", isPast && "opacity-30")}>
      <div className="w-12 shrink-0 pt-1 text-right">
        <span className="text-[10px] font-medium tabular-nums text-ink-300">
          {item.startTime}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-center">
        <div className="mt-1.5 h-2 w-2 rounded-full bg-ink-100" />
        <div className="flex-1 border-l border-dashed border-ink-100/60" />
      </div>
      <div className="mb-1 flex-1 rounded-xl border border-ink-100/40 bg-ink-50/30 px-3 py-1.5 min-h-[32px]">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11px] font-medium text-ink-300">{item.label}</span>
          <span className="text-[10px] text-ink-200">{item.startTime}〜{item.endTime}</span>
        </div>
      </div>
    </div>
  );
}

// ── 学校バンド ────────────────────────────
function SchoolBand({ wakeupTime, returnTime, isPast }: {
  wakeupTime: string;
  returnTime: string;
  isPast: boolean;
}) {
  return (
    <div className={cn("flex gap-2", isPast && "opacity-40")}>
      <div className="w-12 shrink-0 pt-1 text-right">
        <span className="text-[10px] font-medium tabular-nums text-ink-400">
          {wakeupTime}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-center">
        <div className="mt-1.5 h-2 w-2 rounded-full bg-amber-300" />
        <div className="flex-1 border-l border-dashed border-ink-100" />
      </div>
      <div className="mb-1.5 flex-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 min-h-[48px]">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[12px] font-bold text-amber-900">在学校</span>
          <span className="text-[10px] font-medium text-amber-600">
            {wakeupTime}〜{returnTime}
          </span>
        </div>
        <span className="text-[10px] text-amber-600">学校・授業</span>
      </div>
    </div>
  );
}

// ── ゾーンアコーディオン ──────────────────
function ZoneSection({
  zone,
  children,
  isOpen,
  onToggle,
  itemCount,
}: {
  zone: Zone;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  itemCount: number;
}) {
  const zoneColor: Record<ZoneId, string> = {
    midnight: "text-ink-400",
    school: "text-amber-600",
    evening: "text-sky-600",
    latenight: "text-ink-300",
  };

  return (
    <div className="border-b border-ink-100/60 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-2.5 transition hover:bg-ink-50/40 active:scale-[0.99]"
      >
        <span className={cn("text-[11px] font-semibold", zoneColor[zone.id])}>
          {zone.label}
          <span className="ml-1.5 font-normal text-ink-300">
            {zone.id === "school" ? "" : `${minToHHmm(zone.startMin)}〜${minToHHmm(Math.min(zone.endMin, 24 * 60))}`}
          </span>
        </span>
        <div className="flex items-center gap-1.5">
          {itemCount > 0 && (
            <span className="rounded-full bg-ink-100 px-1.5 py-0.5 text-[9px] font-bold text-ink-500">
              {itemCount}
            </span>
          )}
          {isOpen
            ? <ChevronUp className="h-3.5 w-3.5 text-ink-300" />
            : <ChevronDown className="h-3.5 w-3.5 text-ink-300" />
          }
        </div>
      </button>
      {isOpen && (
        <div className="px-4 pb-3 pt-1">
          {children}
        </div>
      )}
    </div>
  );
}

// ── メインコンポーネント ────────────────────
export function TodaySchedule({
  finalBlocks,
  bedtime,
  wakeupTime = "07:00",
  returnTime,
  tasks,
  fixedSlots,
  onReset,
}: TodayScheduleProps) {
  const [result, setResult] = useState<ScheduleResult | null>(null);
  const [currentNow, setCurrentNow] = useState(nowHHmm());
  const [dayOffset, setDayOffset] = useState(0); // 0=今日, 1=明日, ...
  const [openZones, setOpenZones] = useState<Set<ZoneId>>(new Set(["evening"]));
  const currentRowRef = useRef<HTMLDivElement>(null);

  // 表示日付 (今日 / 明日 / ...)
  const displayDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return d;
  })();

  // 帰宅時間: prop優先、なければwakeupTimeの2時間後または18:30
  const effectiveReturnTime = returnTime ?? "18:30";

  const wakeupMin = timeToMin(wakeupTime);
  const returnMin = timeToMin(effectiveReturnTime);
  const bedMin = timeToMin(bedtime);

  // 学校帯が有効かどうか（平日のみ）
  const isWeekday = (() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    const dow = d.getDay();
    return dow >= 1 && dow <= 5;
  })();

  const hasSchool = isWeekday && wakeupMin < returnMin;

  const zones = buildZones(wakeupMin, returnMin, bedMin);

  // 翌日以降: ブロック生成しない
  const isToday = dayOffset === 0;

  const recalculate = () => {
    const nowStr = nowHHmm();
    setCurrentNow(nowStr);
    if (!isToday) {
      setResult({ slots: [], finalBlocks: 0, fitsInTime: true });
      return;
    }
    // 今日: 帰宅時間か現在時刻の遅い方から開始
    const startMin = Math.max(timeToMin(nowStr), returnMin);
    const startTime = minToHHmm(startMin);
    setResult(
      buildTodaySchedule(
        buildScheduleInput(finalBlocks, bedtime, startTime, tasks, fixedSlots, displayDate),
      ),
    );
  };

  useEffect(() => {
    recalculate();
    const timer = setInterval(() => setCurrentNow(nowHHmm()), 60_000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalBlocks, bedtime, dayOffset, wakeupTime, returnTime]);

  useEffect(() => {
    if (currentRowRef.current) {
      currentRowRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [result]);

  function toggleZone(zoneId: ZoneId) {
    setOpenZones((prev) => {
      const next = new Set(prev);
      if (next.has(zoneId)) {
        next.delete(zoneId);
      } else {
        next.add(zoneId);
      }
      return next;
    });
  }

  const nowMin = timeToMin(currentNow);
  const slots = result?.slots ?? [];

  const currentSlotIdx = isToday
    ? slots.findIndex((s, i) => {
        const start = timeToMin(s.startTime);
        const next = slots[i + 1]
          ? timeToMin(slots[i + 1].startTime)
          : start + s.durationMin;
        return nowMin >= start && nowMin < next;
      })
    : -1;

  const studyCount = slots.filter((s) => s.kind === "study").length;

  // 各ゾーンのアイテム数（バッジ用）
  function getZoneItemCount(zone: Zone): number {
    if (zone.id === "midnight") return buildMidnightItems(wakeupMin, isToday).length;
    if (zone.id === "school") return hasSchool ? 1 : 0;
    if (zone.id === "latenight") return buildLatenightItems(bedMin, isToday).length;
    // evening: スロット数
    return slots.filter((s) => {
      const sMin = timeToMin(s.startTime);
      return sMin >= zone.startMin && sMin < zone.endMin;
    }).length;
  }

  return (
    <section className="mt-5 rounded-2xl border border-ink-100/80 bg-white overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100/60">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
            タイムライン
          </div>
          <div className="mt-0.5 flex items-center gap-3">
            {/* 日付ナビ */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setDayOffset((d) => Math.max(0, d - 1))}
                disabled={dayOffset === 0}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-ink-100 bg-white text-ink-400 disabled:opacity-30 transition active:scale-95"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-[56px] text-center text-[13px] font-bold text-ink-900">
                {formatDateLabel(dayOffset)}
              </span>
              <button
                type="button"
                onClick={() => setDayOffset((d) => Math.min(6, d + 1))}
                disabled={dayOffset >= 6}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-ink-100 bg-white text-ink-400 disabled:opacity-30 transition active:scale-95"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            {isToday && (
              <div className="flex items-baseline gap-1.5">
                <span className="text-[22px] font-bold tabular-nums text-ink-900">
                  {studyCount}
                </span>
                <span className="text-xs font-medium text-ink-500">ブロック</span>
                {result && !result.fitsInTime && (
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                    時間不足
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {isToday && (
            <button
              type="button"
              onClick={recalculate}
              className="flex h-8 items-center gap-1 rounded-full border border-ink-100/80 bg-white px-3 text-[11px] font-medium text-ink-600 transition active:scale-[0.97]"
            >
              <RefreshCw className="h-3 w-3" />
              途中復帰
            </button>
          )}
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

      {/* 翌日以降: プレースホルダー */}
      {!isToday && (
        <div className="px-5 py-3 bg-ink-50/30">
          <p className="text-[11px] text-ink-400 text-center">
            {formatDateLabel(dayOffset)} の予定構造（ブロック未生成）
          </p>
        </div>
      )}

      {/* ゾーン表示 */}
      <div className="overflow-y-auto" style={{ maxHeight: "520px" }}>

        {/* ゾーン1: 深夜・早朝（起床前） */}
        {wakeupMin > 0 && (
          <ZoneSection
            zone={zones[0]}
            isOpen={openZones.has("midnight")}
            onToggle={() => toggleZone("midnight")}
            itemCount={getZoneItemCount(zones[0])}
          >
            {buildMidnightItems(wakeupMin, isToday).map((item, i) => (
              <CompressedRow
                key={`midnight-${i}`}
                item={item}
                isPast={isToday && timeToMin(item.endTime) <= nowMin}
              />
            ))}
          </ZoneSection>
        )}

        {/* ゾーン2: 学校（起床〜帰宅） */}
        <ZoneSection
          zone={zones[1]}
          isOpen={openZones.has("school")}
          onToggle={() => toggleZone("school")}
          itemCount={getZoneItemCount(zones[1])}
        >
          {hasSchool ? (
            <SchoolBand
              wakeupTime={wakeupTime}
              returnTime={effectiveReturnTime}
              isPast={isToday && returnMin <= nowMin}
            />
          ) : (
            <div className="py-2 text-center text-[11px] text-ink-300">
              本日は学校なし（週末）
            </div>
          )}
        </ZoneSection>

        {/* ゾーン3: 夕方〜夜（帰宅〜就寝） — メインゾーン */}
        <ZoneSection
          zone={zones[2]}
          isOpen={openZones.has("evening")}
          onToggle={() => toggleZone("evening")}
          itemCount={getZoneItemCount(zones[2])}
        >
          {isToday && slots.length > 0 ? (
            slots.map((slot, i) => {
              const sMin = timeToMin(slot.startTime);
              if (sMin < zones[2].startMin || sMin >= zones[2].endMin) return null;
              const isCurrent = i === currentSlotIdx;
              const isPast = sMin + slot.durationMin <= nowMin;
              return (
                <div
                  key={`${slot.startTime}-${i}`}
                  ref={isCurrent ? currentRowRef : undefined}
                >
                  <SlotRow slot={slot} isCurrent={isCurrent} isPast={isPast} />
                </div>
              );
            })
          ) : isToday && slots.length === 0 ? (
            <div className="py-3 text-center text-[11px] text-ink-300">
              時間内にブロックを収められませんでした
            </div>
          ) : (
            <div className="py-3 text-center text-[11px] text-ink-300">
              翌日のブロックは当日に生成されます
            </div>
          )}
        </ZoneSection>

        {/* ゾーン4: 就寝後〜翌0時 */}
        {bedMin < 24 * 60 && (
          <ZoneSection
            zone={zones[3]}
            isOpen={openZones.has("latenight")}
            onToggle={() => toggleZone("latenight")}
            itemCount={getZoneItemCount(zones[3])}
          >
            {buildLatenightItems(bedMin, isToday).map((item, i) => (
              <CompressedRow
                key={`latenight-${i}`}
                item={item}
                isPast={isToday && timeToMin(item.endTime) <= nowMin}
              />
            ))}
          </ZoneSection>
        )}

      </div>
    </section>
  );
}
