"use client";

// TODO — 期日・優先度自動・タブヘッダ
// タブ: 今日 / 未完了 / 完了 / すべて (検索 + 絞り)
// 完了タスクは7日経過で自動クリーン

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
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
import { LoadingState } from "@/components/ui/LoadingState";
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

  // 7日経過の完了タスクをクリーン
  useEffect(() => {
    if (hydrated) cleanupCompletedTasks();
  }, [hydrated]);

  const tasks = state.tasks ?? [];
  const todayISO = new Date().toISOString().slice(0, 10);

  const visible = useMemo(() => {
    let list = tasks;
    // タブ絞り
    if (tab === "today") {
      list = list.filter(
        (t) =>
          t.status !== "done" &&
          (t.due === "today" ||
            (t.dueDate && t.dueDate <= todayISO) ||
            effectivePriority(t) === 1),
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

  if (!hydrated) {
    return <LoadingState />;
  }

  return (
    <div className="px-5 pb-8 pt-3 space-y-4">
      <header>
        <h1 className="text-[22px] font-bold leading-tight text-ink-900">TODO</h1>
        <p className="mt-1 text-[12px] leading-[1.7] text-ink-500">
          今日やることだけ。1タップで完了。
        </p>
      </header>

      {/* タブ */}
      <ul className="flex gap-1 rounded-xl bg-cream-100/70 p-1">
        {([
          { id: "today", label: "今日" },
          { id: "todo", label: "未完了" },
          { id: "done", label: "完了" },
          { id: "all", label: "すべて" },
        ] as { id: Tab; label: string }[]).map((t) => (
          <li key={t.id} className="flex-1">
            <button
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex h-9 w-full items-center justify-center rounded-lg text-[12px] font-bold transition",
                tab === t.id ? "bg-white text-ink-900 shadow-soft" : "text-ink-500",
              )}
            >
              {t.label}
            </button>
          </li>
        ))}
      </ul>

      {/* 検索 + 絞り */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="タスクを検索"
            className="h-9 w-full rounded-xl border border-ink-100/80 bg-white pl-8 pr-3 text-[12px] text-ink-900 outline-none focus:border-sky-400"
          />
        </div>
        <button
          type="button"
          onClick={() => setFilterOpen((v) => !v)}
          className={cn(
            "flex h-9 flex-none items-center gap-1 rounded-xl border px-3 text-[11px] font-bold transition",
            filterCount > 0
              ? "border-ink-900 bg-ink-900 text-white"
              : "border-ink-100/80 bg-white text-ink-700",
          )}
        >
          <Filter className="h-3 w-3" />
          絞る
          {filterCount > 0 ? (
            <span className="ml-0.5 rounded-full bg-white/15 px-1 tabular-nums">
              {filterCount}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-9 items-center gap-1 rounded-full bg-ink-900 px-3 text-[12px] font-bold text-white"
        >
          <Plus className="h-3 w-3" strokeWidth={2.5} />
          追加
        </button>
      </div>

      {/* フィルタパネル */}
      {filterOpen ? (
        <div className="rounded-xl border border-ink-100/80 bg-white p-3 space-y-3">
          <Chips
            label="優先度"
            value={String(priorityFilter)}
            onChange={(v) =>
              setPriorityFilter(v === "all" ? "all" : (Number(v) as 1 | 2 | 3))
            }
            options={[
              { value: "all", label: "すべて" },
              { value: "1", label: "高" },
              { value: "2", label: "中" },
              { value: "3", label: "低" },
            ]}
          />
          <Chips
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

      {/* リスト */}
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-ink-100/80 bg-white px-5 py-10 text-center">
          <ListTodo className="mx-auto h-8 w-8 text-ink-300" strokeWidth={1.5} />
          <p className="mt-3 text-[13px] font-bold text-ink-700">
            {tab === "today"
              ? "今日のタスクはありません"
              : tab === "done"
              ? "完了タスクはありません"
              : "タスクがありません"}
          </p>
          <p className="mt-1 text-[11px] text-ink-500">
            右の「＋追加」から登録
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-ink-100/70 overflow-hidden rounded-2xl border border-ink-100/80 bg-white">
          {visible.map((t) => (
            <li key={t.id}>
              <TaskRow task={t} />
            </li>
          ))}
        </ul>
      )}

      {open ? <TaskModal onClose={() => setOpen(false)} /> : null}
    </div>
  );
}

function TaskRow({ task }: { task: StoredTask }) {
  const done = task.status === "done";
  const area = SUBJECT_AREAS.find((a) => a.id === task.subjectArea);
  const effective = effectivePriority(task);
  return (
    <article className="flex items-start gap-3 px-4 py-3">
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
        {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
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
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[10px] font-bold",
              PRIORITY_TONE[effective],
            )}
          >
            <Flag className="inline h-2.5 w-2.5 mr-0.5" />
            {PRIORITY_LABEL[effective]}
          </span>
          {task.due ? (
            <span className="rounded-md bg-ink-900 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {DUE_LABEL[task.due]}
            </span>
          ) : null}
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[10px] font-bold",
              TAG_TONE[task.tag],
            )}
          >
            {TAG_LABEL[task.tag]}
          </span>
          {area ? (
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[10px] font-bold",
                area.tone,
              )}
            >
              {area.shortName}
            </span>
          ) : null}
          <span className="rounded-md bg-cream-100 px-1.5 py-0.5 text-[10px] font-bold text-ink-600 tabular-nums">
            25分×{task.blocks}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => deleteTask(task.id)}
        className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full text-ink-400 hover:bg-cream-100"
        aria-label="削除"
      >
        <Trash2 className="h-3.5 w-3.5" />
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
        <div className="mx-auto h-1 w-9 rounded-full bg-ink-200" />
        <div className="mt-3 flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-ink-900">タスクを追加</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-500"
            aria-label="閉じる"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="mt-3 space-y-3">
          <div>
            <label className="text-[10px] font-semibold tracking-[0.05em] text-ink-500">
              タイトル
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              placeholder="例: 数学A 場合の数 例題3まで"
              className="mt-1 h-11 w-full rounded-xl border border-ink-100/80 bg-white px-3 text-[14px] text-ink-900 outline-none focus:border-sky-400"
            />
          </div>

          {/* 期日 */}
          <div>
            <label className="text-[10px] font-semibold tracking-[0.05em] text-ink-500">
              期日 (優先度自動)
            </label>
            <ul className="mt-1 flex gap-1 rounded-xl bg-cream-100/70 p-1">
              {(Object.keys(DUE_LABEL) as DueBucket[]).map((d) => (
                <li key={d} className="flex-1">
                  <button
                    type="button"
                    onClick={() => setDue(d)}
                    className={cn(
                      "flex h-9 w-full flex-col items-center justify-center rounded-lg text-[10px] font-bold transition",
                      due === d ? "bg-white text-ink-900 shadow-soft" : "text-ink-500",
                    )}
                  >
                    <span>{DUE_LABEL[d]}</span>
                    <span className="text-[8px] font-medium text-ink-400">
                      {priorityFromDue(d) === 1 ? "優先度 高" : priorityFromDue(d) === 2 ? "優先度 中" : "優先度 低"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="mt-2 h-9 w-full rounded-xl border border-ink-100/80 bg-white px-3 text-[12px] text-ink-900 outline-none focus:border-sky-400"
            />
          </div>

          {/* ブロック */}
          <div>
            <label className="text-[10px] font-semibold tracking-[0.05em] text-ink-500">
              ブロック数（1ブロック = 25分）
            </label>
            <div className="mt-1 flex items-center rounded-xl border border-ink-100/80 bg-white px-1">
              <button
                type="button"
                onClick={() => setBlocks(Math.max(1, blocks - 1))}
                className="flex h-9 w-9 items-center justify-center text-ink-700"
              >
                −
              </button>
              <span className="flex-1 text-center text-[15px] font-bold tabular-nums text-ink-900">
                {blocks} <span className="text-[10px] text-ink-400">/ {blocks * 25}分</span>
              </span>
              <button
                type="button"
                onClick={() => setBlocks(Math.min(12, blocks + 1))}
                className="flex h-9 w-9 items-center justify-center text-ink-700"
              >
                +
              </button>
            </div>
          </div>

          {/* タグ */}
          <div>
            <label className="text-[10px] font-semibold tracking-[0.05em] text-ink-500">
              タグ
            </label>
            <ul className="mt-1 flex flex-wrap gap-1">
              {(Object.keys(TAG_LABEL) as TaskTag[]).map((t) => (
                <li key={t}>
                  <button
                    type="button"
                    onClick={() => setTag(t)}
                    className={cn(
                      "h-8 rounded-full px-3 text-[11px] font-bold transition",
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
            <label className="text-[10px] font-semibold tracking-[0.05em] text-ink-500">
              教科 (任意)
            </label>
            <ul className="mt-1 flex flex-wrap gap-1">
              <li>
                <button
                  type="button"
                  onClick={() => setSubjectArea("")}
                  className={cn(
                    "h-8 rounded-full px-2.5 text-[11px] font-bold transition",
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
                      "h-8 rounded-full px-2.5 text-[11px] font-bold transition",
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

        <button
          type="submit"
          className="mt-5 h-11 w-full rounded-xl bg-ink-900 text-[13px] font-bold text-white active:scale-[0.98] transition"
        >
          追加する
        </button>
      </form>
    </div>
  );
}

function Chips({
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
      <div className="text-[10px] font-semibold tracking-[0.05em] text-ink-500">
        {label}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "h-7 rounded-full px-2.5 text-[10px] font-bold transition",
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
