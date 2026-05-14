"use client";

// 共通ボトムシート ㉒ デザインに準拠
// - 角丸 24px / グリップバー / 見出し→本文→CTA の3層構造
// - fixed の右下ボタンから一発で開く想定
// - sheet-in アニメーションは globals.css 側で定義済み

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** body (フォームなど) */
  children: React.ReactNode;
  /** CTA — 渡せばフッターに表示。<button> / <Link> どちらでも */
  cta?: React.ReactNode;
  /** スクロール領域に追加クラス */
  className?: string;
};

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  cta,
  className,
}: Props) {
  // ESC で閉じる + body スクロールロック
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/40 backdrop-blur-[2px] sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={cn(
          "sheet-in relative w-full max-w-[480px] rounded-t-3xl bg-cream-50 px-5 pt-3 shadow-[0_-12px_30px_-12px_rgba(0,0,0,0.25)] sm:rounded-2xl",
          cta
            ? "pb-[max(env(safe-area-inset-bottom),1rem)]"
            : "pb-[max(env(safe-area-inset-bottom),1.25rem)]",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grip bar */}
        <div className="mx-auto h-1 w-8 rounded-full bg-ink-200" />

        {/* Header */}
        <div className="mt-3.5 flex items-center justify-between">
          <h3 className="text-[15px] font-extrabold tracking-[-0.01em] text-ink-900">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-cream-100 text-ink-600 transition active:scale-[0.92]"
            aria-label="閉じる"
          >
            <X className="h-3 w-3" strokeWidth={2.4} />
          </button>
        </div>

        {/* Body */}
        <div className={cn("mt-3.5", className)}>{children}</div>

        {/* CTA */}
        {cta ? <div className="mt-4">{cta}</div> : null}
      </div>
    </div>
  );
}

// ヘルパー: モーダル内ラベル + フィールド
export function SheetField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-ink-500">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

// ヘルパー: 共通インプット (高さ40px / cream-100 角丸 / 13px)
export function SheetInput(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  const { className, ...rest } = props;
  return (
    <input
      {...rest}
      className={cn(
        "h-10 w-full rounded-[10px] border border-ink-100 bg-white px-3 text-[13px] text-ink-900 outline-none focus:border-sky-400",
        className,
      )}
    />
  );
}

// ヘルパー: CTA 黒ボタン (高さ44px、角丸12px)
export function SheetCta({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-ink-900 text-[13px] font-bold text-white transition active:scale-[0.98]",
        disabled && "opacity-50",
      )}
    >
      {children}
    </button>
  );
}
