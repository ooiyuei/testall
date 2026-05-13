"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
import { WeeklyGoalCard } from "./WeeklyGoalCard";

const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"];

const KIND_META: Record<
  CalendarEventKind,
  { label: string; tone: string; dot: string }
> = {
  "regular-test": {
    label: "定期テスト",
    tone: "bg-peach-100 text-peach-500",
    dot: "bg-peach-500",
  },
  "mock-exam": {
    label: "模試",
    tone: "bg-sky-100 text-sky-700",
    dot: "bg-sky-500",
  },
  deadline: {
    label: "出願・期限",
    tone: "bg-coral-300/40 text-coral-500",
    dot: "bg-coral-500",
  },
  study: {
    label: "学習予定",
    tone: "bg-mint-100 text-mint-600",
    dot: "bg-mint-500",
  },
  other: {
    label: "その他",
    tone: "bg-cream-100 text-ink-700",
    dot: "bg-ink-300",
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
  const [editor, setEditor] = useState<{ open: boolean; event?: CalendarEvent }>({
    open: false,
  });

  const today = new Date();
  const todayYmd = ymd(today);

  // Build calendar grid cells
  const cells = useMemo(() => buildGrid(cursor), [cursor]);

  const events = state.events ?? [];

  function eventsForDate(date: string): CalendarEvent[] {
    return events.filter(
      (e) =>
        e.date === date ||
        (e.endDate && e.date <= date && date <= e.endDate),
    );
  }

  function navigate(delta: number) {
    const d = new Date(cursor);
    d.setMonth(d.getMonth() + delta);
    setCursor(d);
  }

  function pickDate(date: string) {
    setSelectedDate(date);
  }

  function openNewEvent() {
    setEditor({
      open: true,
      event: {
        id: nanoid(8),
        kind: "regular-test",
        title: "",
        date: selectedDate ?? todayYmd,
      },
    });
  }

  if (!hydrated) {
    return <div className="px-4 pt-10 text-sm text-ink-500">読み込み中…</div>;
  }

  const latest = state.tests[0];
  const upcoming = events
    .filter((e) => (e.endDate ?? e.date) >= todayYmd)
    .slice(0, 5);

  const selectedEvents = selectedDate ? eventsForDate(selectedDate) : [];

  return (
    <div className="px-5 pb-8 pt-3 space-y-5">
      {/* 計画AI v0.1 — 週間目標カード */}
      <WeeklyGoalCard />

      {/* Today goal card */}
      {latest ? (
        <section className="rounded-3xl border border-cream-200 bg-gradient-to-br from-mint-50 to-sky-50 p-4 shadow-soft">
          <div className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-mint-600" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-mint-600">
              今週の目標
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-700">
            {latest.diagnosis.weaknesses
              .slice(0, 2)
              .map((w) => w.unit)
              .join(" / ")}
            {" "}
            を中心に、{latest.input.subject}の底を上げる
          </p>
        </section>
      ) : null}

      {/* Calendar */}
      <section className="rounded-3xl border border-cream-200 bg-white p-3 shadow-soft">
        <header className="flex items-center justify-between px-2 pb-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-cream-100"
            aria-label="前月"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-base font-black text-ink-900 tabular-nums">
            {cursor.getFullYear()}年 {cursor.getMonth() + 1}月
          </div>
          <button
            type="button"
            onClick={() => navigate(1)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-cream-100"
            aria-label="次月"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </header>

        {/* Weekday header */}
        <ul className="grid grid-cols-7 gap-0.5 px-1 pb-1">
          {WEEKDAYS.map((w, i) => (
            <li
              key={w}
              className={cn(
                "text-center text-[10px] font-bold",
                i === 5
                  ? "text-sky-600"
                  : i === 6
                  ? "text-coral-500"
                  : "text-ink-500",
              )}
            >
              {w}
            </li>
          ))}
        </ul>

        <ul className="grid grid-cols-7 gap-0.5 px-1">
          {cells.map((cell, i) => {
            const inMonth = isSameYM(cell, cursor);
            const cellYmd = ymd(cell);
            const isToday = cellYmd === todayYmd;
            const isSelected = cellYmd === selectedDate;
            const cellEvents = eventsForDate(cellYmd);
            const hasLog = state.blockLogs.some(
              (l) => l.completedAt.slice(0, 10) === cellYmd,
            );
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => pickDate(cellYmd)}
                  className={cn(
                    "flex h-12 w-full flex-col items-center justify-center gap-0.5 rounded-xl transition",
                    !inMonth && "text-ink-300",
                    inMonth && "text-ink-700",
                    isToday && "bg-sky-50 ring-1 ring-sky-400",
                    isSelected && !isToday && "bg-cream-100",
                  )}
                >
                  <span
                    className={cn(
                      "text-sm tabular-nums",
                      isToday && "font-black text-sky-700",
                    )}
                  >
                    {cell.getDate()}
                  </span>
                  {cellEvents.length > 0 || hasLog ? (
                    <span className="flex gap-0.5">
                      {hasLog ? (
                        <span className="h-1 w-1 rounded-full bg-mint-500" />
                      ) : null}
                      {cellEvents.slice(0, 3).map((ev) => (
                        <span
                          key={ev.id}
                          className={cn(
                            "h-1 w-1 rounded-full",
                            KIND_META[ev.kind].dot,
                          )}
                        />
                      ))}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>

        <footer className="mt-2 flex flex-wrap gap-2 border-t border-cream-200 px-2 pt-2 text-[10px]">
          <Legend tone="bg-mint-500" label="学習記録" />
          <Legend tone="bg-peach-500" label="定期テスト" />
          <Legend tone="bg-sky-500" label="模試" />
          <Legend tone="bg-coral-500" label="期限" />
        </footer>
      </section>

      {/* Selected day's events */}
      {selectedDate ? (
        <section className="rounded-2xl border border-ink-100/80 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-ink-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
                {selectedDate} の予定
              </span>
            </div>
            <button
              type="button"
              onClick={openNewEvent}
              className="flex h-8 items-center gap-1 rounded-full bg-sky-500 px-3 text-[11px] font-black text-white shadow-soft"
            >
              <Plus className="h-3.5 w-3.5" />
              追加
            </button>
          </div>
          {selectedEvents.length === 0 ? (
            <p className="mt-2 text-[11px] text-ink-500">予定なし</p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {selectedEvents.map((ev) => (
                <EventRow
                  key={ev.id}
                  ev={ev}
                  onEdit={() => setEditor({ open: true, event: ev })}
                />
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {/* Upcoming */}
      <section>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-ink-500" />
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
              これからの予定
            </h2>
          </div>
          {!selectedDate ? (
            <button
              type="button"
              onClick={openNewEvent}
              className="flex h-8 items-center gap-1 rounded-full bg-sky-500 px-3 text-[11px] font-black text-white shadow-soft"
            >
              <Plus className="h-3.5 w-3.5" />
              予定を追加
            </button>
          ) : null}
        </div>
        {upcoming.length === 0 ? (
          <div className="mt-3 rounded-3xl border border-dashed border-cream-300 bg-white/60 p-5 text-center">
            <p className="text-sm font-bold text-ink-700">
              定期テスト・模試を登録しましょう
            </p>
            <p className="mt-1 text-[11px] text-ink-500">
              本番から逆算して、計画が自動で組まれます
            </p>
            <div className="mt-3 flex justify-center gap-2">
              <QuickEventChip
                icon={Pencil}
                label="定期テスト"
                onClick={() =>
                  setEditor({
                    open: true,
                    event: {
                      id: nanoid(8),
                      kind: "regular-test",
                      title: "",
                      date: ymd(today),
                    },
                  })
                }
              />
              <QuickEventChip
                icon={FlaskConical}
                label="模試"
                onClick={() =>
                  setEditor({
                    open: true,
                    event: {
                      id: nanoid(8),
                      kind: "mock-exam",
                      title: "",
                      date: ymd(today),
                    },
                  })
                }
              />
            </div>
          </div>
        ) : (
          <ul className="mt-3 space-y-1.5">
            {upcoming.map((ev) => (
              <EventRow
                key={ev.id}
                ev={ev}
                onEdit={() => setEditor({ open: true, event: ev })}
              />
            ))}
          </ul>
        )}
      </section>

      {/* This week's plan from latest test */}
      {latest ? (
        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
            AIの週間プラン
          </h2>
          <ul className="mt-3 space-y-1.5">
            {latest.diagnosis.weekPlan.map((w, i) => {
              const isToday = i === weekdayIndex(today);
              return (
                <li
                  key={i}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-3 shadow-soft",
                    isToday
                      ? "border-sky-300 bg-white ring-2 ring-sky-100"
                      : "border-cream-200 bg-white",
                  )}
                >
                  <div
                    className={cn(
                      "flex w-10 flex-none items-center justify-center rounded-xl py-1 text-xs font-black",
                      isToday
                        ? "bg-sky-500 text-white"
                        : "bg-cream-100 text-ink-700",
                    )}
                  >
                    {WEEKDAYS[i] ?? w.day}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-ink-900">
                      {w.focus}
                    </div>
                    <div className="text-[10px] text-ink-500">
                      {w.subjects.join(" · ")}
                    </div>
                  </div>
                  <div className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 tabular-nums">
                    {w.blocks}本
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <section className="rounded-3xl border border-dashed border-cream-300 bg-white/60 p-5 text-center">
          <p className="text-sm font-bold text-ink-700">
            テストを追加するとAIが週間プランを出します
          </p>
          <Link
            href="/app/test/new"
            className="mt-3 inline-flex h-10 items-center gap-1 rounded-full bg-sky-500 px-4 text-xs font-black text-white shadow-soft"
          >
            <Plus className="h-4 w-4" />
            テストを追加
          </Link>
        </section>
      )}

      {/* Event editor */}
      {editor.open && editor.event ? (
        <EventEditor
          event={editor.event}
          onClose={() => setEditor({ open: false })}
          onSave={(ev) => {
            saveEvent(ev);
            setEditor({ open: false });
          }}
          onDelete={(id) => {
            deleteEvent(id);
            setEditor({ open: false });
          }}
        />
      ) : null}
    </div>
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
    <span className="flex items-center gap-1 text-ink-500">
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
      className="flex h-9 items-center gap-1 rounded-full border border-cream-200 bg-white px-3 text-[11px] font-bold text-ink-700 shadow-soft"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function EventRow({
  ev,
  onEdit,
}: {
  ev: CalendarEvent;
  onEdit: () => void;
}) {
  const meta = KIND_META[ev.kind];
  const d = new Date(ev.date);
  return (
    <li>
      <button
        type="button"
        onClick={onEdit}
        className="flex w-full items-center gap-2.5 rounded-2xl border border-cream-200 bg-white p-3 text-left shadow-soft hover:bg-cream-50"
      >
        <div className="flex w-10 flex-none flex-col items-center justify-center rounded-xl bg-cream-100 py-1 text-[10px] font-bold text-ink-500">
          <span>{d.getMonth() + 1}/</span>
          <span className="text-sm font-black text-ink-900">{d.getDate()}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                meta.tone,
              )}
            >
              {meta.label}
            </span>
            {ev.subject ? (
              <span className="text-[10px] text-ink-500">{ev.subject}</span>
            ) : null}
          </div>
          <div className="mt-0.5 text-sm font-bold text-ink-900">
            {ev.title || "（無題）"}
          </div>
          {ev.note ? (
            <div className="mt-0.5 text-[10px] text-ink-500 line-clamp-1">
              {ev.note}
            </div>
          ) : null}
        </div>
        <ChevronRight className="h-4 w-4 flex-none text-ink-400" />
      </button>
    </li>
  );
}

function EventEditor({
  event,
  onClose,
  onSave,
  onDelete,
}: {
  event: CalendarEvent;
  onClose: () => void;
  onSave: (ev: CalendarEvent) => void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState<CalendarEvent>(event);
  const isNew = !event.title; // titleが空なら新規

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-ink-900/40 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] rounded-t-3xl bg-cream-50 p-5 shadow-[0_-12px_30px_-12px_rgba(0,0,0,0.3)] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-black text-ink-900">
          {isNew ? "予定を追加" : "予定を編集"}
        </h3>

        <div className="mt-4 space-y-3">
          {/* Kind */}
          <div>
            <Label>種類</Label>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5">
              {(Object.keys(KIND_META) as CalendarEventKind[]).map((k) => {
                const meta = KIND_META[k];
                const active = draft.kind === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, kind: k }))}
                    className={cn(
                      "rounded-xl px-2 py-2 text-[11px] font-bold transition",
                      active
                        ? meta.tone + " ring-2 ring-sky-300"
                        : "bg-white text-ink-700 border border-cream-200",
                    )}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <Label>タイトル</Label>
            <input
              value={draft.title}
              onChange={(e) =>
                setDraft((d) => ({ ...d, title: e.target.value }))
              }
              placeholder="例：前期中間テスト / 全統第2回"
              className="mt-1.5 h-11 w-full rounded-xl border border-cream-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-sky-400"
            />
          </div>

          {/* Date */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>開始日</Label>
              <input
                type="date"
                value={draft.date}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, date: e.target.value }))
                }
                className="mt-1.5 h-11 w-full rounded-xl border border-cream-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-sky-400"
              />
            </div>
            <div>
              <Label>終了日（任意）</Label>
              <input
                type="date"
                value={draft.endDate ?? ""}
                min={draft.date}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    endDate: e.target.value || undefined,
                  }))
                }
                className="mt-1.5 h-11 w-full rounded-xl border border-cream-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-sky-400"
              />
            </div>
          </div>

          {/* Subject */}
          <div>
            <Label>科目（任意）</Label>
            <input
              value={draft.subject ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, subject: e.target.value }))
              }
              placeholder="例：数学・英語"
              className="mt-1.5 h-11 w-full rounded-xl border border-cream-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-sky-400"
            />
          </div>

          {/* Note */}
          <div>
            <Label>メモ（任意）</Label>
            <textarea
              value={draft.note ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, note: e.target.value }))
              }
              placeholder="範囲・準備物など"
              rows={2}
              className="mt-1.5 w-full rounded-xl border border-cream-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-sky-400"
            />
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          {!isNew ? (
            <button
              type="button"
              onClick={() => onDelete(event.id)}
              className="flex h-12 flex-none items-center justify-center rounded-xl border border-coral-300/60 px-4 text-sm font-bold text-coral-500"
              aria-label="削除"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 flex-1 items-center justify-center rounded-xl border border-cream-200 text-sm font-bold text-ink-700"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={() => {
              if (!draft.title.trim()) {
                alert("タイトルを入れてください");
                return;
              }
              onSave({
                ...draft,
                title: draft.title.trim(),
                note: draft.note?.trim() || undefined,
                subject: draft.subject?.trim() || undefined,
              });
            }}
            className="flex h-12 flex-1 items-center justify-center rounded-xl bg-sky-500 text-sm font-black text-white shadow-soft"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
      {children}
    </div>
  );
}
