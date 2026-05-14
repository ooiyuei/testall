"use client";

// タブ: 今日 / 未完了 / 完了 / すべて (検索 + 絞り)
// 完了タスクは7日経過で自動クリーン

import { useEffect, useMemo, useState } from "react";
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

const TAG_LABEL: Record<TaskTag, string> = {
  homework: "課題",
  elective: "選択",
  qualification: "資格",
  added: "追加",
  other: "その他",
};
const TAG_TONE: Record<TaskTag, string> = {
  homework: "bg-peach-50 text-peach-500",
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
    let today = 0, todo = 0, done = 0;
    for (const t of tasks) {
      if (t.status === "done") done += 1;
      else todo += 1;
      if (
        t.status !== "done" &&
        (t.due === "today" || (t.dueDate && t.dueDate <= todayISO) || effectivePriority(t) === 1)
      ) {
        today += 1;
      }
    }
    return { today, todo, done, all: tasks.length };
  }, [tasks, todayISO]);

  if (!hydrated) return <ListSkeleton rows={5} />;

  return (
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
            <span className="tabular-nums text-sky-500">
              {counts.today - tasks.filter((t) => t.status === "done" && (t.due === "today" || (t.dueDate && t.dueDate <= todayISO))).length}
            </span>
            <span className="text-[14px] font-semibold text-ink-400"> / {counts.today}</span>
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

      {/* 検索バー */}
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

      {/* フィルタ + 追加 */}
      <div className="flex items-center gap-2">
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
        <div className="flex-1" />
        <Button
          variant="action"
          size="sm"
          onClick={() => setOpen(true)}
          iconBefore={<Plus className="h-3.5 w-3.5" strokeWidth={2} />}
        >
          タスク追加
        </Button>
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

      {/* タスクリスト */}
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-ink-100/80 bg-white px-5 py-12 text-center">
          <ListTodo className="mx-auto h-8 w-8 text-ink-300" strokeWidth={1.5} />
          <p className="mt-3 text-[13px] font-medium text-ink-600">
            {tab === "today"
              ? "今日のタスクはありません"
              : tab === "done"
              ? "完了タスクはありません"
              : "タスクがありません"}
          </p>
          <p className="mt-1 text-[11px] text-ink-400">「タスク追加」から登録してみよう</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {visible.map((t) => (
            <li key={t.id}>
              <TaskRow task={t} todayISO={todayISO} />
            </li>
          ))}
        </ul>
      )}

      {open ? <TaskModal onClose={() => setOpen(false)} /> : null}
    </div>
  );
}

function TaskRow({ task, todayISO }: { task: StoredTask; todayISO: string }) {
  const done = task.status === "done";
  const area = SUBJECT_AREAS.find((a) => a.id === task.subjectArea);
  const effective = effectivePriority(task);
  const isDueToday = !done && (task.due === "today" || (task.dueDate && task.dueDate <= todayISO));

  return (
    <article
      className={cn(
        "flex items-start gap-3 rounded-2xl border bg-white p-3 shadow-soft transition",
        isDueToday ? "border-sky-300 ring-1 ring-sky-100" : "border-cream-200",
        done && "opacity-50",
      )}
    >
      <button
        type="button"
        onClick={() => toggleTaskStatus(task.id)}
        aria-label={done ? "未完了に戻す" : "完了にする"}
        className={cn(
          "mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 transition",
          done
            ? "border-mint-500 bg-mint-500 text-white"
            : "border-ink-200 bg-white hover:border-sky-400",
        )}
      >
        {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : null}
      </button>

      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "text-[14px] font-medium leading-snug",
            done ? "text-ink-400 line-through" : "text-ink-900",
          )}
        >
          {task.title}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", PRIORITY_TONE[effective])}>
            <Flag className="inline h-2.5 w-2.5 mr-0.5" strokeWidth={1.75} />
            {PRIORITY_LABEL[effective]}
          </span>
          {task.due ? (
            <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-medium text-ink-700">
              {DUE_LABEL[task.due]}
            </span>
          ) : null}
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", TAG_TONE[task.tag])}>
            {TAG_LABEL[task.tag]}
          </span>
          {area ? (
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", area.tone)}>
              {area.shortName}
            </span>
          ) : null}
          <span className="rounded-full bg-cream-100 px-2 py-0.5 text-[10px] font-medium text-ink-500 tabular-nums">
            {task.blocks * 25}分
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => deleteTask(task.id)}
        className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full text-ink-300 hover:bg-cream-100 hover:text-ink-500 transition"
        aria-label="削除"
      >
        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
      </button>
    </article>
  );
}

function TaskModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState(1);
  const [tag, setTag] = useState<TaskTag>("homework");
  const [subjectArea, setSubjectArea] = useState<string>("");
  const [due, setDue] = useState<DueBucket>("today");
  const [customDate, setCustomDate] = useState("");

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
        onSubmit={handle}
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
