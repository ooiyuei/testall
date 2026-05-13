"use client";

// 軽量 Toast システム
// - toast.success / toast.error / toast.info / toast.loading を提供
// - 依存ライブラリなし (sonner / react-hot-toast に近い API)
// - 画面上部からスライドダウン、自動 dismiss (4s)、最大 3 件表示

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, Loader2, X } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastKind = "success" | "error" | "info" | "loading";

type ToastItem = {
  id: string;
  kind: ToastKind;
  message: string;
  description?: string;
  duration: number;
};

const listeners = new Set<(items: ToastItem[]) => void>();
let queue: ToastItem[] = [];
let counter = 0;

function emit() {
  for (const l of listeners) l([...queue]);
}

function push(kind: ToastKind, message: string, description?: string, duration?: number) {
  const id = `t-${++counter}-${Date.now()}`;
  const item: ToastItem = {
    id,
    kind,
    message,
    description,
    duration: duration ?? (kind === "error" ? 6000 : 3500),
  };
  queue = [...queue.slice(-2), item]; // 最大 3 件
  emit();
  if (kind !== "loading") {
    setTimeout(() => dismiss(id), item.duration);
  }
  return id;
}

function dismiss(id: string) {
  queue = queue.filter((t) => t.id !== id);
  emit();
}

export const toast = {
  success: (message: string, description?: string) =>
    push("success", message, description),
  error: (message: string, description?: string) =>
    push("error", message, description),
  info: (message: string, description?: string) =>
    push("info", message, description),
  loading: (message: string, description?: string) =>
    push("loading", message, description, Infinity),
  dismiss,
};

const KIND_META: Record<
  ToastKind,
  { Icon: typeof CheckCircle2; tone: string; bar: string }
> = {
  success: {
    Icon: CheckCircle2,
    tone: "text-mint-600",
    bar: "bg-mint-500",
  },
  error: {
    Icon: AlertCircle,
    tone: "text-coral-500",
    bar: "bg-coral-500",
  },
  info: {
    Icon: Info,
    tone: "text-sky-600",
    bar: "bg-sky-500",
  },
  loading: {
    Icon: Loader2,
    tone: "text-ink-600 animate-spin",
    bar: "bg-ink-400",
  },
};

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    listeners.add(setItems);
    return () => {
      listeners.delete(setItems);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-2 z-[60] mx-auto flex w-full max-w-[460px] flex-col items-center gap-2 px-3"
      role="region"
      aria-live="polite"
      aria-label="通知"
    >
      {items.map((t) => {
        const meta = KIND_META[t.kind];
        const Icon = meta.Icon;
        return (
          <div
            key={t.id}
            className="pointer-events-auto w-full overflow-hidden rounded-2xl border border-ink-100/70 bg-white shadow-[0_18px_40px_-16px_rgba(20,19,15,0.25)] animate-slideDown"
            role="alert"
          >
            <div className="flex items-start gap-3 px-4 py-3">
              <Icon
                className={cn("h-4 w-4 flex-none mt-0.5", meta.tone)}
                strokeWidth={2.4}
              />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold text-ink-900">
                  {t.message}
                </div>
                {t.description ? (
                  <div className="mt-0.5 text-[11px] leading-[1.6] text-ink-500">
                    {t.description}
                  </div>
                ) : null}
              </div>
              {t.kind !== "loading" ? (
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  className="flex h-6 w-6 flex-none items-center justify-center rounded-full text-ink-400 hover:bg-cream-100"
                  aria-label="閉じる"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
            {/* 進捗バー (success/info/error のみ) */}
            {t.kind !== "loading" ? (
              <div
                className={cn("h-0.5 w-full origin-left", meta.bar)}
                style={{
                  animation: `toast-progress ${t.duration}ms linear forwards`,
                }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
