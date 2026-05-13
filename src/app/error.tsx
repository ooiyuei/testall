"use client";

// グローバルエラー画面 — App Router の error.tsx
// renderエラーや予期しない例外をユーザーに伝える

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.error("[app error]", error);
      // Sentry が設定されていれば自動的に送信される
      Sentry.captureException(error);
    }
  }, [error]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col items-center justify-center bg-cream-50 px-5 py-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-coral-300/15 text-coral-500 shadow-soft">
        <AlertTriangle className="h-7 w-7" strokeWidth={2.2} />
      </div>
      <h1 className="mt-5 text-[22px] font-bold text-ink-900">
        予期しないエラーが発生しました
      </h1>
      <p className="mt-2 text-[12px] leading-[1.7] text-ink-500">
        少し待ってから再読み込みしてください。続く場合は設定からデータをエクスポートしてサポートにご連絡ください。
      </p>
      {error.digest ? (
        <p className="mt-3 rounded-lg bg-cream-100 px-2 py-1 text-[10px] font-mono text-ink-500">
          digest: {error.digest}
        </p>
      ) : null}
      <div className="mt-6 flex w-full max-w-[280px] flex-col gap-2">
        <button
          type="button"
          onClick={reset}
          className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-ink-900 text-[13px] font-bold text-white"
        >
          <RotateCcw className="h-4 w-4" strokeWidth={2.4} />
          もう一度試す
        </button>
        <Link
          href="/app"
          className="flex h-11 items-center justify-center rounded-xl border border-cream-200 text-[12px] font-bold text-ink-700"
        >
          ホームに戻る
        </Link>
      </div>
    </div>
  );
}
