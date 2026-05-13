"use client";

// アプリ全域で使うヘッダー。
// 左: 戻る or ロゴ
// 中央: タイトル
// 右: アクション (+ ボタンなど)
//
// + ボタンは AddSheet (旧 AddFabSheet) を開く

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { AddFabSheet } from "./AddFabSheet";

export function AppHeader({
  title,
  back,
  right,
  showAdd = true,
}: {
  title?: string;
  back?: string;
  right?: React.ReactNode;
  showAdd?: boolean;
}) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <header className="pt-safe sticky top-0 z-20 border-b border-cream-200/60 bg-cream-50/80 backdrop-blur-xl">
        <div className="flex h-12 items-center gap-2 px-3">
          {back ? (
            <Link
              href={back}
              className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-ink-600 active:bg-cream-200/60 transition"
              aria-label="戻る"
            >
              <ArrowLeft className="h-[18px] w-[18px]" />
            </Link>
          ) : null}
          {title ? (
            <h1
              className={cn(
                "min-w-0 flex-1 truncate text-[15px] font-bold text-ink-900",
                back ? "" : "px-1",
              )}
            >
              {title}
            </h1>
          ) : (
            <div className="flex-1" />
          )}
          <div className="flex flex-none items-center gap-1">
            {right}
            {showAdd ? (
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink-700 active:bg-cream-200/60 transition"
                aria-label="追加"
              >
                <Plus className="h-[20px] w-[20px]" strokeWidth={2.2} />
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <AddFabSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}
