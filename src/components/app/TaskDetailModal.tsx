"use client";

import { useState } from "react";
import { Minus, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { deleteTask, saveTask } from "@/lib/store";
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
  homework: "bg-coral-50 text-coral-500",
  elective: "bg-sky-50 text-sky-600",
  qualification: "bg-mint-50 text-mint-600",
  added: "bg-sun-100 text-ink-700",
  other: "bg-cream-100 text-ink-600",
};

type Props = {
  task: StoredTask;
  onClose: () => void;
};

export function TaskDetailModal({ task, onClose }: Props) {
  const [draft, setDraft] = useState<StoredTask>(task);

  function handleSave() {
    if (!draft.title.trim()) return;
    saveTask({ ...draft, title: draft.title.trim() });
    onClose();
  }

  function handleDelete() {
    deleteTask(task.id);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-ink-900/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="relative z-10 mx-auto w-full max-w-[480px] rounded-t-3xl bg-cream-50 px-5 pt-3 pb-[max(env(safe-area-inset-bottom),1.5rem)] shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto h-1 w-9 rounded-full bg-ink-200" />

        <div className="mt-3 flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-ink-900">タスク詳細</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-500"
            aria-label="閉じる"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* タイトル */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
              タイトル
            </label>
            <input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              className="mt-1 h-11 w-full rounded-xl border border-ink-100/80 bg-white px-3 text-[14px] text-ink-900 outline-none focus:border-sky-400"
            />
          </div>

          {/* 教科 */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
              教科
            </label>
            <ul className="mt-1.5 flex flex-wrap gap-1">
              <li>
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, subjectArea: undefined }))}
                  className={cn(
                    "h-7 rounded-full px-2.5 text-[11px] font-bold transition",
                    !draft.subjectArea
                      ? "bg-ink-900 text-white"
                      : "border border-ink-100/80 bg-white text-ink-500",
                  )}
                >
                  なし
                </button>
              </li>
              {SUBJECT_AREAS.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, subjectArea: a.id }))}
                    className={cn(
                      "h-7 rounded-full px-2.5 text-[11px] font-bold transition",
                      draft.subjectArea === a.id
                        ? a.tone
                        : "border border-ink-100/80 bg-white text-ink-600",
                    )}
                  >
                    {a.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* タグ */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
              タグ
            </label>
            <ul className="mt-1.5 flex flex-wrap gap-1">
              {(Object.keys(TAG_LABEL) as TaskTag[]).map((t) => (
                <li key={t}>
                  <button
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, tag: t }))}
                    className={cn(
                      "h-7 rounded-full px-2.5 text-[11px] font-bold transition",
                      draft.tag === t
                        ? TAG_TONE[t]
                        : "border border-ink-100/80 bg-white text-ink-600",
                    )}
                  >
                    {TAG_LABEL[t]}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* ブロック数 */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
              ブロック数（1ブロック = 25分）
            </label>
            <div className="mt-1.5 flex items-center rounded-xl border border-ink-100/80 bg-white px-1">
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, blocks: Math.max(1, d.blocks - 1) }))}
                className="flex h-9 w-9 items-center justify-center text-ink-700"
                aria-label="ブロック数を減らす"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="flex-1 text-center text-[15px] font-bold tabular-nums text-ink-900">
                {draft.blocks}{" "}
                <span className="text-[10px] text-ink-400">/ {draft.blocks * 25}分</span>
              </span>
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, blocks: Math.min(12, d.blocks + 1) }))}
                className="flex h-9 w-9 items-center justify-center text-ink-700"
                aria-label="ブロック数を増やす"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* 期日 */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
              期日（任意）
            </label>
            <input
              type="date"
              value={draft.dueDate ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, dueDate: e.target.value || undefined }))
              }
              className="mt-1.5 h-10 w-full rounded-xl border border-ink-100/80 bg-white px-3 text-[13px] text-ink-900 outline-none focus:border-sky-400"
            />
          </div>
        </div>

        {/* アクション */}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={handleDelete}
            className="flex h-12 flex-none items-center justify-center rounded-xl border border-coral-300/60 px-4 text-coral-500"
            aria-label="削除"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 flex-1 items-center justify-center rounded-xl border border-cream-200 text-[13px] font-bold text-ink-700"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex h-12 flex-1 items-center justify-center rounded-xl bg-ink-900 text-[13px] font-bold text-white"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
