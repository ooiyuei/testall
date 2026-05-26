"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { nanoid } from "nanoid";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Pencil,
  Plus,
  Target,
  Trash2,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/hooks/useStore";
import { deleteEvent, saveEvent } from "@/lib/store";
import type { CalendarEvent, CalendarEventKind } from "@/lib/store";
import { CalendarSkeleton } from "@/components/ui/Skeleton";
import { IconBadge } from "@/components/ui/IconBadge";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { confirm } from "@/components/ui/ConfirmDialog";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { haptic } from "@/lib/haptic";
import { useRef } from "react";

const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"];

const KIND_META: Record<
  CalendarEventKind,
  { label: string; tone: string; dot: string; badge: string }
> = {
  "regular-test": {
    label: "定期テスト",
    tone: "bg-coral-100 text-coral-500",
    dot: "bg-coral-500",
    badge: "info",
  },
  "mock-exam": {
    label: "模試",
    tone: "bg-sky-100 text-sky-700",
    dot: "bg-sky-500",
    badge: "primary",
  },
  deadline: {
    label: "出願・期限",
    tone: "bg-coral-300/40 text-coral-500",
    dot: "bg-coral-500",
    badge: "danger",
  },
  study: {
    label: "学習予定",
    tone: "bg-mint-100 text-mint-600",
    dot: "bg-mint-500",
    badge: "success",
  },
  other: {
    label: "その他",
    tone: "bg-cream-100 text-ink-700",
    dot: "bg-ink-300",
    badge: "neutral",
  },
};

function weekdayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function isSameYM(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function PlanView() {
  const { state, hydrated } = useStore();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ open: boolean; event?: CalendarEvent; isNew?: boolean }>({
    open: false,
  });

  const today = new Date();
  const todayYmd = ymd(today);

  const cells = useMemo(() => buildGrid(cursor), [cursor]);
  const events = state.events ?? [];

  // 今週の進捗 (実データ): blockLogs から今週 (月〜日) 完了数 / 週次目標
  const weeklyProgress = useMemo(() => {
    const now = new Date();
    const dayIdx = (now.getDay() + 6) % 7; // 月=0..日=6
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayIdx);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    let done = 0;
    for (const log of state.blockLogs ?? []) {
      const v = log?.completedAt;
      const ts = typeof v === "string" ? new Date(v).getTime()
        : typeof v === "number" ? v
        : 0;
      if (ts >= startOfWeek.getTime() && ts < endOfWeek.getTime()) done += 1;
    }
    // 週次目標 = profile の availableMinutesPerDay × 7 / 25
    const dailyBlocks = Math.round((state.profile?.availableMinutesPerDay ?? 60) / 25);
    const target = Math.max(dailyBlocks * 7, 1);
    return { done, target, pct: Math.min(100, Math.round((done / target) * 100)) };
  }, [state.blockLogs, state.profile?.availableMinutesPerDay]);

  function eventsForDate(date: string): CalendarEvent[] {
    return events.filter(
      (e) => e.date === date || (e.endDate && e.date <= date && date <= e.endDate),
    );
  }

  function navigate(delta: number) {
    haptic.light();
    const d = new Date(cursor);
    d.setMonth(d.getMonth() + delta);
    setCursor(d);
  }

  // 横スワイプで前月/次月へ
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  function onCalendarTouchStart(e: React.TouchEvent) {
    swipeStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  function onCalendarTouchEnd(e: React.TouchEvent) {
    if (!swipeStart.current) return;
    const dx = e.changedTouches[0].clientX - swipeStart.current.x;
    const dy = e.changedTouches[0].clientY - swipeStart.current.y;
    swipeStart.current = null;
    if (Math.abs(dx) < 50 || Math.abs(dy) > 50) return;
    if (dx < 0) navigate(1); // 左スワイプで次月
    else navigate(-1); // 右スワイプで前月
  }

  function openNewEvent() {
    setEditor({
      open: true,
      isNew: true,
      event: {
        id: nanoid(8),
        kind: "regular-test",
        title: "",
        date: selectedDate ?? todayYmd,
      },
    });
  }

  if (!hydrated) return <CalendarSkeleton />;

  const latest = state.tests[0];
  const upcoming = events
    .filter((e) => (e.endDate ?? e.date) >= todayYmd)
    .slice(0, 5);
  const selectedEvents = selectedDate ? eventsForDate(selectedDate) : [];

  return (
    <PullToRefresh
      onRefresh={() => {
        toast.success("最新の状態に更新しました");
      }}
    >
    <div className="px-5 pb-8 pt-2 space-y-5">
      {/* 大タイトル — PDF mock _ _ _ _ _ _.png */}
      <header>
        <div className="text-[11px] font-medium text-ink-400">計画</div>
        <h1
          className="mt-1 text-[28px] font-extrabold leading-[1.1] tracking-[-0.025em] text-ink-900"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {cursor.getFullYear()}年 <span className="text-sky-500">{cursor.getMonth() + 1}月</span>
        </h1>
      </header>

      {/* 今週の目標 — ⑤ design (dark hero) */}
      {latest ? (
        <section className="rounded-[18px] bg-ink-900 p-4 text-white shadow-[0_8px_28px_-10px_rgba(20,19,15,0.35)]">
          <div className="flex items-center gap-1.5">
            <Target className="h-3 w-3 text-sky-500" strokeWidth={2.2} />
            <span className="text-[10px] font-bold tracking-[0.04em] text-white/60">
              今週の目標
            </span>
          </div>
          <p className="mt-1.5 text-[14px] font-bold leading-snug tracking-tight text-white">
            {latest.diagnosis.weaknesses.slice(0, 2).map((w) => w.unit).join(" / ")}
            {" "}を中心に、{latest.input.subject}の底を上げる
          </p>
          <div className="mt-2.5 flex items-center gap-2.5">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-mint-500 transition-[width]"
                style={{ width: `${weeklyProgress.pct}%` }}
              />
            </div>
            <span className="text-[11px] font-bold tabular-nums text-white">
              {weeklyProgress.done} / {weeklyProgress.target}
            </span>
          </div>
        </section>
      ) : null}

      {/* カレンダー */}
      <section
        className="rounded-2xl border border-cream-200 bg-white shadow-soft overflow-hidden"
        onTouchStart={onCalendarTouchStart}
        onTouchEnd={onCalendarTouchEnd}
      >
        <header className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-cream-100 transition"
            aria-label="前月"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <span className="text-[15px] font-bold text-ink-900 tabular-nums">
            {cursor.getFullYear()}年 {cursor.getMonth() + 1}月
          </span>
          <button
            type="button"
            onClick={() => navigate(1)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-cream-100 transition"
            aria-label="次月"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </header>

        {/* 曜日ヘッダ */}
        <ul className="grid grid-cols-7 gap-0 border-t border-cream-100 px-2">
          {WEEKDAYS.map((w, i) => (
            <li
              key={w}
              className={cn(
                "py-1.5 text-center text-[10px] font-medium",
                i === 5 ? "text-sky-500" : i === 6 ? "text-coral-500" : "text-ink-400",
              )}
            >
              {w}
            </li>
          ))}
        </ul>

        {/* 日グリッド */}
        <ul className="grid grid-cols-7 gap-0 px-2 pb-3">
          {cells.map((cell, i) => {
            const inMonth = isSameYM(cell, cursor);
            const cellYmd = ymd(cell);
            const isToday = cellYmd === todayYmd;
            const isSelected = cellYmd === selectedDate;
            const cellEvents = eventsForDate(cellYmd);
            const hasLog = (state.blockLogs ?? []).some((l) => {
              const v = l?.completedAt;
              const ymd = typeof v === "string" ? v.slice(0, 10)
                : typeof v === "number" ? new Date(v).toISOString().slice(0, 10)
                : null;
              return ymd === cellYmd;
            });
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setSelectedDate(isSelected ? null : cellYmd)}
                  className={cn(
                    "flex h-11 w-full flex-col items-center justify-center gap-0.5 rounded-2xl transition",
                    !inMonth && "opacity-25",
                    isToday && "bg-ink-900",
                    isSelected && !isToday && "bg-sky-50 ring-1 ring-sky-300",
                  )}
                >
                  <span
                    className={cn(
                      "text-[13px] tabular-nums font-medium",
                      isToday ? "text-white font-bold" : "text-ink-800",
                    )}
                  >
                    {cell.getDate()}
                  </span>
                  {cellEvents.length > 0 || hasLog ? (
                    <span className="flex gap-0.5">
                      {hasLog ? <span className="h-1 w-1 rounded-full bg-mint-500" /> : null}
                      {cellEvents.slice(0, 3).map((ev) => (
                        <span
                          key={ev.id}
                          className={cn("h-1 w-1 rounded-full", KIND_META[ev.kind].dot)}
                        />
                      ))}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>

        <footer className="flex flex-wrap gap-3 border-t border-cream-100 px-4 py-2.5">
          <Legend tone="bg-mint-500" label="学習記録" />
          <Legend tone="bg-coral-500" label="定期テスト" />
          <Legend tone="bg-sky-500" label="模試" />
          <Legend tone="bg-coral-500" label="期限" />
        </footer>
      </section>

      {/* 選択日の予定 */}
      {selectedDate ? (
        <section className="rounded-2xl border border-ink-100/80 bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <SectionLabel
              title={`${selectedDate} の予定`}
              right={
                <Button variant="action" size="sm" onClick={openNewEvent}
                  iconBefore={<Plus className="h-3.5 w-3.5" strokeWidth={1.75} />}>
                  追加
                </Button>
              }
            />
          </div>
          {selectedEvents.length === 0 ? (
            <p className="mt-3 text-[12px] text-ink-400">予定なし</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {selectedEvents.map((ev) => (
                <EventRow key={ev.id} ev={ev} onEdit={() => setEditor({ open: true, event: ev, isNew: false })} />
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {/* これからの予定 */}
      <section>
        <SectionLabel
          title="これからの予定"
          right={
            !selectedDate ? (
              <Button variant="action" size="sm" onClick={openNewEvent}
                iconBefore={<Plus className="h-3.5 w-3.5" strokeWidth={1.75} />}>
                予定を追加
              </Button>
            ) : undefined
          }
        />
        {upcoming.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-cream-300 bg-white/60 p-6 text-center">
            <p className="text-sm font-bold text-ink-700">定期テスト・模試を登録しましょう</p>
            <p className="mt-1 text-[12px] text-ink-500">本番から逆算して、計画が自動で組まれます</p>
            <div className="mt-4 flex justify-center gap-2">
              <QuickEventChip
                icon={Pencil}
                label="定期テスト"
                onClick={() => setEditor({ open: true, event: { id: nanoid(8), kind: "regular-test", title: "", date: ymd(today) }, isNew: true })}
              />
              <QuickEventChip
                icon={FlaskConical}
                label="模試"
                onClick={() => setEditor({ open: true, event: { id: nanoid(8), kind: "mock-exam", title: "", date: ymd(today) }, isNew: true })}
              />
            </div>
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {upcoming.map((ev) => (
              <EventRow key={ev.id} ev={ev} onEdit={() => setEditor({ open: true, event: ev, isNew: false })} />
            ))}
          </ul>
        )}
      </section>

      {/* AIの週間プラン — 今日明日のみデフォルト表示、残り「もっと見る」で展開 */}
      {latest && latest.diagnosis.weekPlan.length > 0 ? (
        <details className="group">
          <summary className="flex cursor-pointer items-center justify-between list-none">
            <SectionLabel title="AIの週間プラン" />
            <span className="text-[11px] font-medium text-sky-500 group-open:hidden">
              週全体を見る ∨
            </span>
            <span className="hidden text-[11px] font-medium text-ink-400 group-open:inline">
              閉じる ∧
            </span>
          </summary>
          <ul className="mt-3 space-y-2">
            {latest.diagnosis.weekPlan.map((w, i) => {
              const todayWdayIdx = weekdayIndex(today);
              const isToday = i === todayWdayIdx;
              const isTomorrow = i === (todayWdayIdx + 1) % 7;
              // デフォルトでは今日と明日のみ表示 (open 時のみ全曜日)
              const alwaysShow = isToday || isTomorrow;
              return (
                <li
                  key={i}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-3 shadow-soft",
                    isToday ? "border-sky-300 bg-white ring-2 ring-sky-100" : "border-cream-200 bg-white",
                    !alwaysShow && "hidden group-open:flex",
                  )}
                >
                  <div
                    className={cn(
                      "flex w-9 flex-none items-center justify-center rounded-xl py-1.5 text-xs font-bold",
                      isToday ? "bg-sky-500 text-white" : "bg-cream-100 text-ink-700",
                    )}
                  >
                    {WEEKDAYS[i] ?? w.day}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold text-ink-900">{w.focus}</div>
                    <div className="text-[11px] text-ink-500">{w.subjects.join(" · ")}</div>
                  </div>
                  <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700 tabular-nums">
                    {w.blocks}本
                  </span>
                </li>
              );
            })}
          </ul>
        </details>
      ) : !latest ? (
        <section className="rounded-2xl border border-dashed border-cream-300 bg-white/60 p-6 text-center">
          <p className="text-sm font-bold text-ink-700">テストを追加するとAIが週間プランを出します</p>
          <div className="mt-3 flex justify-center">
            <Button href="/app/test/new" variant="action" size="sm"
              iconBefore={<Plus className="h-4 w-4" strokeWidth={1.75} />}>
              テストを追加
            </Button>
          </div>
        </section>
      ) : null}

      {/* イベントエディタ */}
      {editor.open && editor.event ? (
        <EventEditor
          event={editor.event}
          isNew={editor.isNew ?? false}
          onClose={() => setEditor({ open: false })}
          onSave={(ev) => { saveEvent(ev); setEditor({ open: false }); }}
          onDelete={(id) => { deleteEvent(id); setEditor({ open: false }); }}
        />
      ) : null}
    </div>
    </PullToRefresh>
  );
}

function buildGrid(cursor: Date): Date[] {
  const first = new Date(cursor);
  first.setDate(1);
  const startOffset = weekdayIndex(first);
  const start = new Date(first);
  start.setDate(first.getDate() - startOffset);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push(d);
  }
  return cells;
}

function Legend({ tone, label }: { tone: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[10px] text-ink-500">
      <span className={cn("h-1.5 w-1.5 rounded-full", tone)} />
      {label}
    </span>
  );
}

function QuickEventChip({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Pencil;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 items-center gap-1.5 rounded-full border border-cream-200 bg-white px-3 text-[12px] font-medium text-ink-700 shadow-soft transition hover:bg-cream-50"
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      {label}
    </button>
  );
}

function EventRow({ ev, onEdit }: { ev: CalendarEvent; onEdit: () => void }) {
  const meta = KIND_META[ev.kind];
  const d = new Date(ev.date);
  return (
    <li>
      <button
        type="button"
        onClick={onEdit}
        className="flex w-full items-center gap-3 rounded-2xl border border-cream-200 bg-white p-3 text-left shadow-soft hover:bg-cream-50 transition"
      >
        <IconBadge tone={meta.badge as "primary" | "success" | "warning" | "danger" | "info" | "neutral"} size="md">
          <CalendarDays strokeWidth={1.75} />
        </IconBadge>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", meta.tone)}>
              {meta.label}
            </span>
            {ev.subject ? (
              <span className="text-[11px] text-ink-400">{ev.subject}</span>
            ) : null}
          </div>
          <div className="mt-0.5 text-[13px] font-bold text-ink-900">
            {ev.title || "（無題）"}
          </div>
          {ev.note ? (
            <div className="mt-0.5 text-[11px] text-ink-400 line-clamp-1">{ev.note}</div>
          ) : null}
        </div>
        <div className="flex flex-none flex-col items-end gap-0.5">
          <span className="text-[11px] font-medium text-ink-500 tabular-nums">
            {d.getMonth() + 1}/{d.getDate()}
          </span>
          <ChevronRight className="h-4 w-4 text-ink-300" strokeWidth={1.75} />
        </div>
      </button>
    </li>
  );
}

function EventEditor({
  event,
  isNew,
  onClose,
  onSave,
  onDelete,
}: {
  event: CalendarEvent;
  isNew: boolean;
  onClose: () => void;
  onSave: (ev: CalendarEvent) => void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState<CalendarEvent>(event);
  const trapRef = useFocusTrap<HTMLDivElement>(true);

  // Esc 閉じ + body scroll lock
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  function handleSave() {
    if (!draft.title.trim()) {
      toast.error("タイトルを入れてください");
      return;
    }
    onSave({
      ...draft,
      title: draft.title.trim(),
      note: draft.note?.trim() || undefined,
      subject: draft.subject?.trim() || undefined,
    });
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-ink-900/40 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={isNew ? "予定を追加" : "予定を編集"}
    >
      <div
        ref={trapRef}
        className="w-full max-w-[480px] rounded-t-3xl bg-cream-50 p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] shadow-[0_-12px_30px_-12px_rgba(0,0,0,0.25)] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink-200" />
        <h3 className="text-[15px] font-bold text-ink-900">
          {isNew ? "予定を追加" : "予定を編集"}
        </h3>

        <div className="mt-4 space-y-3">
          {/* 種類 */}
          <div>
            <FieldLabel>種類</FieldLabel>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5">
              {(Object.keys(KIND_META) as CalendarEventKind[]).map((k) => {
                const m = KIND_META[k];
                const active = draft.kind === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, kind: k }))}
                    className={cn(
                      "rounded-2xl px-2 py-2 text-[11px] font-medium transition",
                      active ? m.tone + " ring-2 ring-sky-300" : "bg-white text-ink-700 border border-cream-200",
                    )}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* タイトル */}
          <div>
            <FieldLabel>タイトル</FieldLabel>
            <input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="例：前期中間テスト / 全統第2回"
              className="mt-1.5 h-12 w-full rounded-2xl border border-ink-100/80 bg-white px-3 text-[13px] text-ink-900 outline-none focus:border-sky-400"
            />
          </div>

          {/* 日付 */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel>開始日</FieldLabel>
              <input
                type="date"
                value={draft.date}
                onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
                className="mt-1.5 h-12 w-full rounded-2xl border border-ink-100/80 bg-white px-3 text-[13px] text-ink-900 outline-none focus:border-sky-400"
              />
            </div>
            <div>
              <FieldLabel>終了日（任意）</FieldLabel>
              <input
                type="date"
                value={draft.endDate ?? ""}
                min={draft.date}
                onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value || undefined }))}
                className="mt-1.5 h-12 w-full rounded-2xl border border-ink-100/80 bg-white px-3 text-[13px] text-ink-900 outline-none focus:border-sky-400"
              />
            </div>
          </div>

          {/* 科目 */}
          <div>
            <FieldLabel>科目（任意）</FieldLabel>
            <input
              value={draft.subject ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}
              placeholder="例：数学・英語"
              className="mt-1.5 h-12 w-full rounded-2xl border border-ink-100/80 bg-white px-3 text-[13px] text-ink-900 outline-none focus:border-sky-400"
            />
          </div>

          {/* メモ */}
          <div>
            <FieldLabel>メモ（任意）</FieldLabel>
            <textarea
              value={draft.note ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
              placeholder="範囲・準備物など"
              rows={2}
              className="mt-1.5 w-full rounded-2xl border border-ink-100/80 bg-white px-3 py-2.5 text-[13px] text-ink-900 outline-none focus:border-sky-400"
            />
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          {!isNew ? (
            <button
              type="button"
              onClick={async () => {
                const ok = await confirm({
                  title: "予定を削除しますか?",
                  body: `「${event.title || "この予定"}」を完全に削除します。`,
                  confirmLabel: "削除",
                  danger: true,
                });
                if (ok) {
                  onDelete(event.id);
                  toast.success("予定を削除しました");
                }
              }}
              className="flex h-12 flex-none items-center justify-center rounded-2xl border border-coral-300/60 px-4 text-coral-500 transition hover:bg-coral-50"
              aria-label="削除"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.75} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 flex-1 items-center justify-center rounded-2xl border border-cream-200 text-[13px] font-medium text-ink-700 transition hover:bg-cream-100"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-sky-500 text-[13px] font-bold text-white shadow-soft transition hover:bg-sky-600"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-medium text-ink-500">{children}</div>
  );
}
