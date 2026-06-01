"use client";

// タブ: 今日 / 未完了 / 完了 / すべて (検索 + 絞り)
// 完了タスクは7日経過で自動クリーン

import { useEffect, useMemo, useState } from "react";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { useSearchParams } from "next/navigation";
import {
  Check,
  ChevronRight,
  Filter,
  Flag,
  ListTodo,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/hooks/useStore";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";
import { toast } from "@/components/ui/Toast";
import { SwipeableRow } from "@/components/ui/SwipeableRow";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { haptic } from "@/lib/haptic";
import { reorderTasks } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { IconBadge } from "@/components/ui/IconBadge";
import {
  cleanupCompletedTasks,
  deleteTask,
  effectivePriority,
  priorityFromDue,
  saveTask,
  toggleTaskStatus,
  DUE_LABEL,
} from "@/lib/store";
import type { DueBucket, StoredTask, TaskTag } from "@/lib/store";
import { SUBJECT_AREAS } from "@/lib/master/subjects/hierarchy";
import { TodaySuggestion } from "./TodaySuggestion";
import { TaskDetailModal } from "./TaskDetailModal";

const TAG_LABEL: Record<TaskTag, string> = {
  homework: "課題",
  elective: "選択",
  qualification: "資格",
  added: "追加",
  other: "その他",
};
const TAG_TONE: Record<TaskTag, string> = {
  homework: "bg-coral-50 text-coral-500",
  elective: "bg-sky-50 text-sky-600",
  qualification: "bg-mint-50 text-mint-600",
  added: "bg-sun-100 text-ink-700",
  other: "bg-cream-100 text-ink-600",
};
const PRIORITY_LABEL: Record<1 | 2 | 3, string> = { 1: "高", 2: "中", 3: "低" };
const PRIORITY_TONE: Record<1 | 2 | 3, string> = {
  1: "bg-coral-300 text-white",
  2: "bg-sun-200 text-ink-900",
  3: "bg-cream-100 text-ink-600",
};

type Tab = "today" | "todo" | "done" | "all";

const TABS: { id: Tab; label: string }[] = [
  { id: "today", label: "今日" },
  { id: "todo", label: "未完了" },
  { id: "done", label: "完了" },
  { id: "all", label: "すべて" },
];

export function TodoView() {
  const sp = useSearchParams();
  const { state, hydrated } = useStore();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("today");
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<"all" | 1 | 2 | 3>("all");
  const [tagFilter, setTagFilter] = useState<"all" | TaskTag>("all");

  useEffect(() => {
    if (sp.get("new") === "1") setOpen(true);
  }, [sp]);

  useEffect(() => {
    if (hydrated) cleanupCompletedTasks();
  }, [hydrated]);

  const tasks = state.tasks ?? [];
  const todayISO = new Date().toISOString().slice(0, 10);

  const visible = useMemo(() => {
    let list = tasks;
    if (tab === "today") {
      list = list.filter(
        (t) =>
          t.status !== "done" &&
          (t.due === "today" || (t.dueDate && t.dueDate <= todayISO) || effectivePriority(t) === 1),
      );
    } else if (tab === "todo") {
      list = list.filter((t) => t.status !== "done");
    } else if (tab === "done") {
      list = list.filter((t) => t.status === "done");
    }
    if (priorityFilter !== "all") {
      list = list.filter((t) => effectivePriority(t) === priorityFilter);
    }
    if (tagFilter !== "all") {
      list = list.filter((t) => t.tag === tagFilter);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (a.status !== b.status) return a.status === "done" ? 1 : -1;
      return effectivePriority(a) - effectivePriority(b);
    });
  }, [tasks, tab, priorityFilter, tagFilter, query, todayISO]);

  const filterCount = (priorityFilter !== "all" ? 1 : 0) + (tagFilter !== "all" ? 1 : 0);

  // Compute counts per tab for header label
  const counts = useMemo(() => {
    let today = 0, todo = 0, done = 0, todayDone = 0, todayTotal = 0;
    for (const t of tasks) {
      if (t.status === "done") done += 1;
      else todo += 1;
      const isToday =
        t.due === "today" || (t.dueDate && t.dueDate <= todayISO) || effectivePriority(t) === 1;
      if (isToday) {
        todayTotal += 1;
        if (t.status === "done") todayDone += 1;
        else today += 1;
      }
    }
    return { today, todo, done, all: tasks.length, todayDone, todayTotal };
  }, [tasks, todayISO]);

  if (!hydrated) return <ListSkeleton rows={5} />;

  return (
    <PullToRefresh
      onRefresh={() => {
        cleanupCompletedTasks();
        toast.success("最新の状態に更新しました");
      }}
    >
    <div className="px-5 pb-8 pt-2 space-y-4">
      {/* Header */}
      <header className="flex items-end justify-between">
        <div>
          <div className="text-[11px] font-medium text-ink-400">やること</div>
          <h1
            className="mt-1 text-[28px] font-extrabold leading-[1.1] tracking-[-0.025em] text-ink-900"
            style={{ fontFamily: "var(--font-display)" }}
          >
            今日{" "}
            <span className="tabular-nums text-sky-500">{counts.todayDone}</span>
            <span className="text-[14px] font-semibold text-ink-400"> / {counts.todayTotal}</span>
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="タスクを追加"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-900 text-white transition active:scale-[0.92]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.4} />
        </button>
      </header>

      {/* タブ — underline style */}
      <div className="-mx-1 flex gap-5 overflow-x-auto border-b border-ink-100 no-scrollbar">
        {TABS.map((t) => {
          const active = tab === t.id;
          const n = counts[t.id] ?? 0;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "relative flex flex-none items-center gap-1 pb-2.5 pt-1 text-[13px] transition",
                active ? "font-bold text-ink-900" : "font-medium text-ink-400",
              )}
            >
              <span>{t.label}</span>
              <span
                className={cn(
                  "tabular-nums text-[11px]",
                  active ? "text-ink-400" : "text-ink-300",
                )}
              >
                {n}
              </span>
              {active ? (
                <span className="absolute -bottom-px left-0 right-0 h-0.5 rounded-full bg-ink-900" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* 検索バー — タスクが少ない時は表示しない (Progressive Disclosure) */}
      {tasks.length >= 10 ? (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" strokeWidth={1.75} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="タスクを検索"
            className="h-12 w-full rounded-2xl border border-ink-100/80 bg-white pl-10 pr-10 text-[13px] text-ink-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-ink-200 text-ink-600"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          ) : null}
        </div>
      ) : null}

      {/* フィルタ (タスク追加ボタンは右上の + 黒丸に一元化) */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setFilterOpen((v) => !v)}
          className={cn(
            "flex h-9 flex-none items-center gap-1.5 rounded-full px-3 text-[12px] font-medium transition",
            filterCount > 0
              ? "bg-ink-900 text-white"
              : "border border-ink-100/80 bg-white text-ink-700",
          )}
        >
          <Filter className="h-3.5 w-3.5" strokeWidth={1.75} />
          絞る
          {filterCount > 0 ? (
            <span className="ml-0.5 rounded-full bg-white/20 px-1.5 tabular-nums text-[10px]">
              {filterCount}
            </span>
          ) : null}
        </button>
      </div>

      {/* フィルタパネル */}
      {filterOpen ? (
        <div className="rounded-2xl border border-ink-100/80 bg-white p-4 space-y-3 shadow-soft">
          <FilterChips
            label="優先度"
            value={String(priorityFilter)}
            onChange={(v) => setPriorityFilter(v === "all" ? "all" : (Number(v) as 1 | 2 | 3))}
            options={[
              { value: "all", label: "すべて" },
              { value: "1", label: "高" },
              { value: "2", label: "中" },
              { value: "3", label: "低" },
            ]}
          />
          <FilterChips
            label="タグ"
            value={tagFilter}
            onChange={(v) => setTagFilter(v as typeof tagFilter)}
            options={[
              { value: "all", label: "すべて" },
              ...(Object.keys(TAG_LABEL) as TaskTag[]).map((t) => ({
                value: t,
                label: TAG_LABEL[t],
              })),
            ]}
          />
        </div>
      ) : null}

      {/* AI おすすめタスク — 今日タブかつフィルタ未使用時のみ */}
      {tab === "today" && !query.trim() && priorityFilter === "all" && tagFilter === "all" ? (
        <TodaySuggestion state={state} />
      ) : null}

      {/* タスクリスト — PDF mock 通り日付グルーピング */}
      {visible.length === 0 ? (
        <EmptyState
          icon={<ListTodo className="h-8 w-8" strokeWidth={1.6} />}
          title={
            tab === "today"
              ? "今日のタスクはありません"
              : tab === "done"
                ? "完了タスクはありません"
                : "タスクがありません"
          }
          body="「タスク追加」から登録してみよう"
          primary={{ label: "タスク追加", onClick: () => setOpen(true) }}
        />
      ) : (
        <TaskGroupedList tasks={visible} todayISO={todayISO} />
      )}

      {open ? <TaskModal onClose={() => setOpen(false)} /> : null}
    </div>
    </PullToRefresh>
  );
}

// 日付バケット定義 — PDF mock の "今日 5/14 (1/3)" 形式
type Bucket = { id: string; label: string; date?: string; tasks: StoredTask[] };
function bucketize(tasks: StoredTask[], todayISO: string): Bucket[] {
  const tomorrow = new Date(todayISO);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowISO = tomorrow.toISOString().slice(0, 10);
  const buckets: Bucket[] = [
    { id: "today", label: "今日", date: todayISO, tasks: [] },
    { id: "tomorrow", label: "明日", date: tomorrowISO, tasks: [] },
    { id: "this-week", label: "今週中", tasks: [] },
    { id: "someday", label: "後で", tasks: [] },
  ];
  for (const t of tasks) {
    const dd = t.dueDate;
    if (dd && dd <= todayISO) buckets[0].tasks.push(t);
    else if (dd === tomorrowISO || t.due === "tomorrow") buckets[1].tasks.push(t);
    else if (t.due === "today") buckets[0].tasks.push(t);
    else if (t.due === "this-week") buckets[2].tasks.push(t);
    else buckets[3].tasks.push(t);
  }
  return buckets.filter((b) => b.tasks.length > 0);
}
function fmtMonthDay(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}`;
}
function TaskGroupedList({ tasks, todayISO }: { tasks: StoredTask[]; todayISO: string }) {
  const buckets = bucketize(tasks, todayISO);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  function handleDrop(targetId: string) {
    if (!draggingId || draggingId === targetId) return;
    // 全タスクの ID 並び (バケツ順) を作り、draggingId を targetId の位置に移動
    const allIds = buckets.flatMap((b) => b.tasks.map((t) => t.id));
    const from = allIds.indexOf(draggingId);
    const to = allIds.indexOf(targetId);
    if (from < 0 || to < 0) return;
    const next = [...allIds];
    next.splice(from, 1);
    next.splice(to, 0, draggingId);
    reorderTasks(next);
    setDraggingId(null);
    setOverId(null);
  }

  return (
    <div className="space-y-5">
      {buckets.map((b) => {
        const done = b.tasks.filter((t) => t.status === "done").length;
        const total = b.tasks.length;
        return (
          <section key={b.id}>
            <header className="mb-2 flex items-baseline justify-between text-[11px] font-medium text-ink-500">
              <span>
                {b.label}
                {b.date ? ` · ${fmtMonthDay(b.date)}` : ""}
              </span>
              <span className="tabular-nums text-ink-400">
                {done} / {total}
              </span>
            </header>
            <ul className="space-y-2">
              {b.tasks.map((t) => (
                <li
                  key={t.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    setDraggingId(t.id);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (overId !== t.id) setOverId(t.id);
                  }}
                  onDragLeave={() => setOverId(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(t.id);
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setOverId(null);
                  }}
                  className={cn(
                    "transition",
                    draggingId === t.id && "opacity-30",
                    overId === t.id && draggingId !== t.id && "translate-y-1",
                  )}
                >
                  <SwipeableRow
                    onDelete={() => {
                      const snapshot = { ...t };
                      deleteTask(t.id);
                      toast.success("削除しました", {
                        action: {
                          label: "取り消し",
                          onClick: () => saveTask(snapshot),
                        },
                      });
                    }}
                  >
                    <TaskRow task={t} todayISO={todayISO} />
                  </SwipeableRow>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

// PDF mock: シンプルな1行 + ミドット連結のメタ情報
// ○ タイトル
//   ●教科 · 25分 · 課題 (遅延赤バッジ)
function TaskRow({ task, todayISO }: { task: StoredTask; todayISO: string }) {
  const done = task.status === "done";
  const area = SUBJECT_AREAS.find((a) => a.id === task.subjectArea);
  const overdue = !done && task.dueDate ? task.dueDate < todayISO : false;
  const [editOpen, setEditOpen] = useState(false);
  return (
    <>
      <article
        className="flex items-start gap-3 rounded-2xl border border-ink-100/80 bg-white px-4 py-3 transition active:bg-cream-50"
        onClick={() => setEditOpen(true)}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleTaskStatus(task.id);
            if (!done) {
              haptic.success();
              toast.success("完了！", {
                action: {
                  label: "取り消し",
                  onClick: () => toggleTaskStatus(task.id),
                },
              });
            } else {
              haptic.light();
            }
          }}
          aria-label={done ? "未完了に戻す" : "完了にする"}
          className={cn(
            "mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full transition",
            done
              ? "bg-mint-500 text-white"
              : "border-2 border-ink-200 bg-white hover:border-sky-400",
          )}
        >
          {done ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
        </button>
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "text-[14px] font-bold leading-snug",
              done ? "text-ink-400 line-through" : "text-ink-900",
            )}
          >
            {task.title}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-ink-500">
            {area ? (
              <span className="inline-flex items-center gap-1">
                <span className={cn("h-1.5 w-1.5 rounded-full", area.tone || "bg-ink-300")} />
                {area.shortName}
              </span>
            ) : null}
            <span className="text-ink-300">·</span>
            <span className="tabular-nums">{task.blocks * 25}分</span>
            <span className="text-ink-300">·</span>
            <span>{TAG_LABEL[task.tag]}</span>
            {overdue ? (
              <span className="ml-1 rounded-full bg-coral-500/10 px-1.5 py-0.5 text-[10px] font-bold text-coral-500">
                遅延
              </span>
            ) : null}
          </div>
        </div>
        <ChevronRight className="mt-1 h-4 w-4 flex-none text-ink-300" />
      </article>
      {editOpen ? (
        <TaskDetailModal task={task} onClose={() => setEditOpen(false)} />
      ) : null}
    </>
  );
}

function TaskModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState(1);
  const [tag, setTag] = useState<TaskTag>("homework");
  const [subjectArea, setSubjectArea] = useState<string>("");
  const [due, setDue] = useState<DueBucket>("today");
  const [customDate, setCustomDate] = useState("");
  const trapRef = useFocusTrap<HTMLFormElement>(true);

  // Esc で閉じる + body スクロールロック
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  function handle(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    saveTask({
      id: `tk-${Date.now().toString(36)}`,
      title: title.trim(),
      blocks,
      tag,
      subjectArea: subjectArea || undefined,
      priority: priorityFromDue(due),
      due,
      dueDate: customDate || undefined,
      status: "todo",
      createdAt: new Date().toISOString(),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-ink-900/40 backdrop-blur-[2px]">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="閉じる"
        onClick={onClose}
      />
      <form
        ref={trapRef}
        onSubmit={handle}
        role="dialog"
        aria-modal="true"
        aria-label="タスクを追加"
        className="sheet-in relative z-10 mx-auto w-full max-w-[480px] rounded-t-3xl bg-cream-50 px-5 pt-3 pb-[max(env(safe-area-inset-bottom),1.25rem)] shadow-pop"
      >
        <div className="mx-auto h-1 w-10 rounded-full bg-ink-200" />
        <div className="mt-3 flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-ink-900">タスクを追加</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-400 hover:bg-cream-100"
            aria-label="閉じる"
          >
            <X className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {/* タイトル */}
          <div>
            <ModalLabel>タイトル</ModalLabel>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              placeholder="例: 数学A 場合の数 例題3まで"
              className="mt-1.5 h-12 w-full rounded-2xl border border-ink-100/80 bg-white px-3 text-[14px] text-ink-900 outline-none focus:border-sky-400"
            />
          </div>

          {/* 期日 */}
          <div>
            <ModalLabel>期日（優先度自動）</ModalLabel>
            <ul className="mt-1.5 flex gap-1 rounded-2xl bg-cream-100/70 p-1">
              {(Object.keys(DUE_LABEL) as DueBucket[]).map((d) => (
                <li key={d} className="flex-1">
                  <button
                    type="button"
                    onClick={() => setDue(d)}
                    className={cn(
                      "flex h-10 w-full flex-col items-center justify-center rounded-xl text-[10px] font-medium transition",
                      due === d ? "bg-white text-ink-900 shadow-soft" : "text-ink-500",
                    )}
                  >
                    <span className="text-[11px] font-bold">{DUE_LABEL[d]}</span>
                    <span className="text-[9px] text-ink-400">
                      優先度{priorityFromDue(d) === 1 ? "高" : priorityFromDue(d) === 2 ? "中" : "低"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="mt-2 h-10 w-full rounded-2xl border border-ink-100/80 bg-white px-3 text-[12px] text-ink-900 outline-none focus:border-sky-400"
            />
          </div>

          {/* ブロック数 */}
          <div>
            <ModalLabel>ブロック数（1ブロック = 25分）</ModalLabel>
            <div className="mt-1.5 flex items-center rounded-2xl border border-ink-100/80 bg-white px-1">
              <button
                type="button"
                onClick={() => setBlocks(Math.max(1, blocks - 1))}
                className="flex h-10 w-10 items-center justify-center text-ink-500 hover:text-ink-900 transition"
              >
                −
              </button>
              <span className="flex-1 text-center text-[15px] font-bold tabular-nums text-ink-900">
                {blocks}
                <span className="ml-1 text-[11px] font-normal text-ink-400">{blocks * 25}分</span>
              </span>
              <button
                type="button"
                onClick={() => setBlocks(Math.min(12, blocks + 1))}
                className="flex h-10 w-10 items-center justify-center text-ink-500 hover:text-ink-900 transition"
              >
                +
              </button>
            </div>
          </div>

          {/* タグ */}
          <div>
            <ModalLabel>タグ</ModalLabel>
            <ul className="mt-1.5 flex flex-wrap gap-1">
              {(Object.keys(TAG_LABEL) as TaskTag[]).map((t) => (
                <li key={t}>
                  <button
                    type="button"
                    onClick={() => setTag(t)}
                    className={cn(
                      "h-8 rounded-full px-3 text-[11px] font-medium transition",
                      tag === t ? TAG_TONE[t] : "bg-white border border-ink-100/80 text-ink-600",
                    )}
                  >
                    {TAG_LABEL[t]}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* 教科 */}
          <div>
            <ModalLabel>教科（任意）</ModalLabel>
            <ul className="mt-1.5 flex flex-wrap gap-1">
              <li>
                <button
                  type="button"
                  onClick={() => setSubjectArea("")}
                  className={cn(
                    "h-8 rounded-full px-2.5 text-[11px] font-medium transition",
                    subjectArea === ""
                      ? "bg-ink-900 text-white"
                      : "bg-white border border-ink-100/80 text-ink-500",
                  )}
                >
                  なし
                </button>
              </li>
              {SUBJECT_AREAS.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setSubjectArea(a.id)}
                    className={cn(
                      "h-8 rounded-full px-2.5 text-[11px] font-medium transition",
                      subjectArea === a.id
                        ? a.tone
                        : "bg-white border border-ink-100/80 text-ink-600",
                    )}
                  >
                    {a.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Button
          type="submit"
          variant="action"
          size="md"
          fullWidth
          className="mt-5"
        >
          追加する
        </Button>
      </form>
    </div>
  );
}

function FilterChips({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <div className="text-[11px] font-medium text-ink-500">{label}</div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "h-7 rounded-full px-2.5 text-[11px] font-medium transition",
              value === o.value ? "bg-ink-900 text-white" : "bg-cream-100 text-ink-700",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ModalLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-medium text-ink-500">{children}</div>
  );
}
