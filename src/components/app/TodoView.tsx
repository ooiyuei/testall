"use client";

// TODO リスト — Apple Reminders ライクなクリーンUI
// グループ: 未完了 / すべて / 完了
// タスク: タイトル / ブロック / タグ / 教科 / 優先度

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  Flag,
  ListTodo,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/hooks/useStore";
import { deleteTask, saveTask, toggleTaskStatus } from "@/lib/store";
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
  homework: "bg-peach-50 text-peach-500",
  elective: "bg-sky-50 text-sky-600",
  qualification: "bg-mint-50 text-mint-600",
  added: "bg-sun-100 text-ink-700",
  other: "bg-cream-100 text-ink-600",
};
const PRIORITY_LABEL: Record<1 | 2 | 3, string> = { 1: "高", 2: "中", 3: "低" };

export function TodoView() {
  const sp = useSearchParams();
  const { state, hydrated } = useStore();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"todo" | "all" | "done">("todo");

  useEffect(() => {
    if (sp.get("new") === "1") setOpen(true);
  }, [sp]);

  if (!hydrated) {
    return <div className="px-5 pt-8 text-sm text-ink-500">読み込み中…</div>;
  }

  const tasks = (state.tasks ?? []).filter((t) => {
    if (filter === "all") return true;
    if (filter === "todo") return t.status !== "done";
    return t.status === "done";
  });

  return (
    <div className="px-5 pb-8 pt-3 space-y-5">
      <section>
        <h1 className="text-[22px] font-bold leading-tight text-ink-900">
          TODO
        </h1>
        <p className="mt-1 text-[12px] leading-[1.7] text-ink-500">
          今日やることだけ。1タップで完了。
        </p>
      </section>

      {/* セグメント */}
      <ul className="flex gap-1 rounded-xl bg-cream-100/70 p-1">
        {(["todo", "all", "done"] as const).map((f) => (
          <li key={f} className="flex-1">
            <button
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "flex h-9 w-full items-center justify-center rounded-lg text-[12px] font-bold transition",
                filter === f
                  ? "bg-white text-ink-900 shadow-soft"
                  : "text-ink-500",
              )}
            >
              {f === "todo" ? "未完了" : f === "all" ? "すべて" : "完了"}
            </button>
          </li>
        ))}
      </ul>

      {/* リスト */}
      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-ink-100/80 bg-white px-5 py-10 text-center">
          <ListTodo className="mx-auto h-8 w-8 text-ink-300" strokeWidth={1.5} />
          <p className="mt-3 text-[13px] font-bold text-ink-700">
            {filter === "done" ? "完了タスクはありません" : "タスクがありません"}
          </p>
          <p className="mt-1 text-[11px] text-ink-500">
            右上の「＋」または下のボタンから追加できます
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-4 inline-flex h-10 items-center gap-1 rounded-full bg-ink-900 px-4 text-[12px] font-bold text-white"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
            追加
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-ink-100/70 overflow-hidden rounded-2xl border border-ink-100/80 bg-white">
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
            {task.blocks} blk
          </span>
          <span className="flex items-center gap-0.5 text-[10px] font-medium text-ink-500">
            <Flag className="h-2.5 w-2.5" />
            優先度 {PRIORITY_LABEL[task.priority]}
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
            <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                ブロック数
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
                  {blocks}
                </span>
                <button
                  type="button"
                  onClick={() => setBlocks(Math.min(8, blocks + 1))}
                  className="flex h-9 w-9 items-center justify-center text-ink-700"
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                優先度
              </label>
              <ul className="mt-1 flex gap-1 rounded-xl bg-cream-100/70 p-1">
                {([1, 2, 3] as const).map((p) => (
                  <li key={p} className="flex-1">
                    <button
                      type="button"
                      onClick={() => setPriority(p)}
                      className={cn(
                        "flex h-7 w-full items-center justify-center rounded-md text-[11px] font-bold transition",
                        priority === p
                          ? "bg-white text-ink-900 shadow-soft"
                          : "text-ink-500",
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
            <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
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

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
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
