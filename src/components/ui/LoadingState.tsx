// 共通ローディング・エラー UI
// 全ビューで「読み込み中…」「失敗しました」を統一する。

import { AlertCircle, Loader2 } from "lucide-react";

export function LoadingState({ label = "読み込み中…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-5 pt-10 text-ink-400">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-[12px] font-medium">{label}</span>
    </div>
  );
}

export function ErrorState({
  message,
  retry,
  retryLabel = "やり直す",
}: {
  message: string;
  retry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="mx-5 mt-5 flex items-start gap-2 rounded-2xl border border-coral-300 bg-coral-300/10 p-4 text-xs text-coral-500">
      <AlertCircle className="h-4 w-4 flex-none mt-0.5" />
      <div className="flex-1">
        <span>{message}</span>
        {retry ? (
          <button
            type="button"
            onClick={retry}
            className="mt-2 inline-flex h-7 items-center rounded-full bg-white px-3 text-[11px] font-bold text-coral-500"
          >
            {retryLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
