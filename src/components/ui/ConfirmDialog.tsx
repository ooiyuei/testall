"use client";

// 確認ダイアログ — window.confirm を使わずに美しい UI で確認する。
//
// 2つの使い方:
// 1) <ConfirmDialog open onClose onConfirm /> — 宣言的に
// 2) await confirm({ title, body, ... }) — async API。任意の関数から呼べる
//
// danger=true で削除系の赤いボタン。デフォルトは ink-900 の標準。
// Esc / 背景タップで cancel 扱い。

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";
import { haptic } from "@/lib/haptic";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "OK",
  cancelLabel = "キャンセル",
  danger = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const trapRef = useFocusTrap<HTMLDivElement>(open);

  useEffect(() => {
    if (!open) return;
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
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-[2px] px-5"
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        ref={trapRef}
        className="sheet-in w-full max-w-[360px] rounded-3xl bg-cream-50 px-5 pt-6 pb-5 shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {danger ? (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-coral-300/15 text-coral-500">
            <AlertTriangle className="h-6 w-6" strokeWidth={2.2} />
          </div>
        ) : null}
        <h3
          className={cn(
            "text-center text-[16px] font-extrabold tracking-[-0.01em] text-ink-900",
            danger ? "mt-3" : "mt-1",
          )}
        >
          {title}
        </h3>
        {body ? (
          <p className="mt-2 text-center text-[12px] leading-[1.7] text-ink-500">
            {body}
          </p>
        ) : null}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => {
              haptic.light();
              onClose();
            }}
            className="h-11 flex-1 rounded-xl border border-ink-100 bg-white text-[13px] font-bold text-ink-700 transition active:scale-[0.98]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              haptic.medium();
              onConfirm();
              onClose();
            }}
            className={cn(
              "h-11 flex-1 rounded-xl text-[13px] font-bold text-white transition active:scale-[0.98]",
              danger ? "bg-coral-500" : "bg-ink-900",
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// 命令的 API: await confirm({ title, body }) → Promise<boolean>
//
// 内部で <ConfirmHost /> を一度だけ Toaster と同じレベルにマウントしておくと、
// 任意のクライアントコードから呼べる。
// ──────────────────────────────────────────────────────────

interface ConfirmOptions {
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

type ConfirmRequest = ConfirmOptions & { resolve: (ok: boolean) => void };

const listeners = new Set<(req: ConfirmRequest | null) => void>();
let current: ConfirmRequest | null = null;

function emit() {
  for (const l of listeners) l(current);
}

export function confirm(opts: ConfirmOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    current = { ...opts, resolve };
    emit();
  });
}

export function ConfirmHost() {
  const [req, setReq] = useState<ConfirmRequest | null>(null);

  useEffect(() => {
    listeners.add(setReq);
    return () => {
      listeners.delete(setReq);
    };
  }, []);

  if (!req) return null;
  return (
    <ConfirmDialog
      open
      title={req.title}
      body={req.body}
      confirmLabel={req.confirmLabel}
      cancelLabel={req.cancelLabel}
      danger={req.danger}
      onConfirm={() => {
        req.resolve(true);
        current = null;
        emit();
      }}
      onClose={() => {
        req.resolve(false);
        current = null;
        emit();
      }}
    />
  );
}
