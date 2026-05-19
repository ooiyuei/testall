// 共通ローディング・エラー UI
// 全ビューで「読み込み中…」「失敗しました」を統一する。

import { AlertCircle, Loader2, RotateCcw } from "lucide-react";

export function LoadingState({ label = "読み込み中…" }: { label?: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 px-5 pt-10 text-ink-400 animate-fade-in-up"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      <span className="text-[12px] font-medium">{label}</span>
    </div>
  );
}

type ErrorStateProps = {
  message: string;
  description?: string;
  retry?: () => void;
  retryLabel?: string;
};

export function ErrorState({
  message,
  description,
  retry,
  retryLabel = "もう一度試す",
}: ErrorStateProps) {
  return (
    <div
      className="mx-5 mt-5 flex items-start gap-3 rounded-2xl border border-coral-300/50 bg-coral-300/8 p-4 animate-fade-in-up"
      role="alert"
    >
      <AlertCircle className="h-4 w-4 flex-none mt-0.5 text-coral-500" strokeWidth={2.2} />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-bold text-coral-600">{message}</div>
        {description ? (
          <p className="mt-1 text-[11px] leading-[1.6] text-ink-600">
            {description}
          </p>
        ) : null}
        {retry ? (
          <button
            type="button"
            onClick={retry}
            className="mt-3 inline-flex h-8 items-center gap-1 rounded-full bg-white border border-coral-300/40 px-3 text-[11px] font-bold text-coral-500 shadow-soft transition active:scale-[0.96] hover:bg-coral-300/10"
          >
            <RotateCcw className="h-3 w-3" strokeWidth={2.4} />
            {retryLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
