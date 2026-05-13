"use client";

// TODO — 今日のタスクだけを表示
// クエリ ?new=1 で追加モーダルを自動オープン
// タスク = タイトル / かかる時間 (ブロック) / タグ / 教科 / 優先度

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  ChevronDown,
  CircleSlash,
  Flag,
  ListTodo,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/hooks/useStore";
import {
  deleteTask,
  saveTask,
  toggleTaskStatus,
} from "@/lib/store";
import type { StoredTask, TaskTag } from "@/lib/store";
import { SUBJECT_AREAS } from "@/lib/master/subjects/hierarchy";

const TAG_LABEL: Record<TaskTag, string> = {
  homework: "課題",
  elective: "選択",
  qualification: "資格",
  added: "追加",
  other: "その他",
};

const TAG_TONE: Record<TaskTag, string> = {
  homework: "bg-peach-100 text-peach-500",
  elective: "bg-sky-100 text-sky-700",
  qualification: "bg-mint-100 text-mint-600",
  added: "bg-sun-200 text-ink-900",
  other: "bg-cream-100 text-ink-700",
};

const PRIORITY_LABEL: Record<1 | 2 | 3, string> = {
  1: "高",
  2: "中",
  3: "低",
};

export function TodoView() {
  const sp = useSearchParams();
  const { state, hydrated } = useStore();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "todo" | "done">("todo");

  useEffect(() => {
    if (sp.get("new") === "1") setOpen(true);
  }, [sp]);

  if (!hydrated) {
    return <div className="px-4 pt-10 text-sm text-ink-500">読み込み中…</div>;
  }

  const tasks = (state.tasks ?? []).filter((t) => {
    if (filter === "all") return true;
    if (filter === "todo") return t.status !== "done";
    return t.status === "done";
  });

  return (
    <div className="px-4 pt-3 pb-32 space-y-4">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-black text-ink-900">TODO</h1>
          <p className="text-[11px] text-ink-500">
            今日やることだけ。1タップで完了。
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-10 items-center gap-1 rounded-full bg-sky-500 px-3 text-xs font-black text-white shadow-soft"
        >
          <Plus className="h-4 w-4" />
          追加
        </button>
      </header>

      {/* フィルタ */}
      <ul className="flex gap-1.5">
        {(["todo", "all", "done"] as const).map((f) => (
          <li key={f}>
            <button
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "h-8 rounded-full px-3 text-[10px] font-bold",
                filter === f
                  ? "bg-ink-900 text-white"
                  : "bg-white text-ink-700 border border-cream-200",
              )}
            >
              {f === "todo" ? "未完了" : f === "all" ? "すべて" : "完了"}
            </button>
          </li>
        ))}
      </ul>

      {/* タスク一覧 */}
      {tasks.length === 0 ? (
        <div className="rounded-2xl bg-white border border-cream-200 p-8 text-center">
          <ListTodo className="mx-auto h-8 w-8 text-ink-300" />
          <p className="mt-2 text-sm font-bold text-ink-700">
            {filter === "done" ? "完了タスクはありません" : "タスクがありません"}
          </p>
          <p className="mt-1 text-[11px] text-ink-500">
            右上の「追加」から登録できます
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {tasks
            .sort((a, b) => {
              if (a.status !== b.status) return a.status === "done" ? 1 : -1;
              return a.priority - b.priority;
            })
            .map((t) => (
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
  return (
    <article
      className={cn(
        "flex items-start gap-3 rounded-2xl border bg-white p-3 shadow-soft",
        done ? "border-cream-200 bg-cream-50" : "border-cream-200",
      )}
    >
      <button
        type="button"
        onClick={() => toggleTaskStatus(task.id)}
        aria-label={done ? "未完了に戻す" : "完了にする"}
        className={cn(
          "flex h-7 w-7 flex-none items-center justify-center rounded-full border-2 transition",
          done
            ? "border-mint-500 bg-mint-500 text-white"
            : "border-cream-300 bg-white text-cream-300 hover:border-sky-400",
        )}
      >
        {done ? <Check className="h-4 w-4" /> : null}
      </button>
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "text-sm font-black",
            done ? "text-ink-400 line-through" : "text-ink-900",
          )}
        >
          {task.title}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
              TAG_TONE[task.tag],
            )}
          >
            {TAG_LABEL[task.tag]}
          </span>
          {area ? (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                area.tone,
              )}
            >
              {area.shortName}
            </span>
          ) : null}
          <span className="rounded-full bg-cream-100 px-1.5 py-0.5 text-[9px] font-bold text-ink-700">
            {task.blocks} blk
          </span>
          <span className="flex items-center gap-0.5 text-[9px] font-bold text-ink-500">
            <Flag className="h-2.5 w-2.5" />
            {PRIORITY_LABEL[task.priority]}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => deleteTask(task.id)}
        className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-ink-400 hover:bg-cream-100"
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
  const [priority, setPriority] = useState<1 | 2 | 3>(2);

  function handle(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    saveTask({
      id: `tk-${Date.now().toString(36)}`,
      title: title.trim(),
      blocks,
      tag,
      subjectArea: subjectArea || undefined,
      priority,
      status: "todo",
      createdAt: new Date().toISOString(),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="閉じる"
        onClick={onClose}
      />
      <form
        onSubmit={handle}
        className="relative z-10 w-full max-w-[480px] mx-auto rounded-t-3xl bg-white p-4 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-ink-900">タスクを追加</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-500"
            aria-label="閉じる"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 space-y-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
              タイトル
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              placeholder="例: 数学A 場合の数 例題3まで"
              className="mt-1 h-11 w-full rounded-xl border border-cream-200 bg-cream-50 px-3 text-sm text-ink-900 outline-none focus:border-sky-400 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
                かかるブロック
              </div>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-cream-200 bg-cream-50 px-2 py-1">
                <button
                  type="button"
                  onClick={() => setBlocks(Math.max(1, blocks - 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-ink-700"
                >
                  −
                </button>
                <span className="flex-1 text-center text-base font-black text-ink-900 tabular-nums">
                  {blocks}
                </span>
                <button
                  type="button"
                  onClick={() => setBlocks(Math.min(8, blocks + 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-ink-700"
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
                優先度
              </div>
              <ul className="mt-1 flex gap-1">
                {([1, 2, 3] as const).map((p) => (
                  <li key={p} className="flex-1">
                    <button
                      type="button"
                      onClick={() => setPriority(p)}
                      className={cn(
                        "h-9 w-full rounded-xl text-[10px] font-bold",
                        priority === p
                          ? "bg-coral-300 text-white"
                          : "bg-cream-50 text-ink-700",
                      )}
                    >
                      {PRIORITY_LABEL[p]}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
              タグ
            </div>
            <ul className="mt-1 flex flex-wrap gap-1">
              {(Object.keys(TAG_LABEL) as TaskTag[]).map((t) => (
                <li key={t}>
                  <button
                    type="button"
                    onClick={() => setTag(t)}
                    className={cn(
                      "h-8 rounded-full px-3 text-[10px] font-bold",
                      tag === t
                        ? TAG_TONE[t]
                        : "bg-cream-50 text-ink-700",
                    )}
                  >
                    {TAG_LABEL[t]}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
              教科（任意）
            </div>
            <ul className="mt-1 flex flex-wrap gap-1">
              <li>
                <button
                  type="button"
                  onClick={() => setSubjectArea("")}
                  className={cn(
                    "h-8 rounded-full px-2.5 text-[10px] font-bold",
                    subjectArea === ""
                      ? "bg-ink-900 text-white"
                      : "bg-cream-50 text-ink-500",
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
                      "h-8 rounded-full px-2.5 text-[10px] font-bold",
                      subjectArea === a.id ? a.tone : "bg-cream-50 text-ink-700",
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
          className="mt-4 h-12 w-full rounded-2xl bg-sky-500 text-sm font-black text-white"
        >
          追加する
        </button>
      </form>
    </div>
  );
}
