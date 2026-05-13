"use client";

// 中央 FAB から開く「追加」ボトムシート
// 1) 勉強時間の追加
// 2) テストの追加 (定期テスト / 校外模試 で分岐)
// 3) 模試の追加 (主催者・人気・時期から選択)

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ClipboardList,
  FileText,
  Plus,
  ScrollText,
  Timer,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AddFabSheet({ open, onClose }: Props) {
  const router = useRouter();
  if (!open) return null;

  function go(href: string) {
    onClose();
    router.push(href);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="閉じる"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-[480px] mx-auto rounded-t-3xl bg-white p-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-ink-900">追加</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-500"
            aria-label="閉じる"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="mt-3 space-y-2">
          <Row
            icon={<Timer className="h-5 w-5" />}
            tone="bg-mint-100 text-mint-600"
            title="勉強時間を記録"
            sub="集中したブロックを後から記録"
            onClick={() => go("/app/focus")}
          />
          <Row
            icon={<FileText className="h-5 w-5" />}
            tone="bg-peach-100 text-peach-500"
            title="定期テストを追加"
            sub="校内の中間・期末・実力テスト"
            onClick={() => go("/app/test/new?kind=regular")}
          />
          <Row
            icon={<ScrollText className="h-5 w-5" />}
            tone="bg-sky-100 text-sky-700"
            title="模試を追加"
            sub="河合塾・駿台・東進・代ゼミ・進研"
            onClick={() => go("/app/test/new?kind=mock")}
          />
          <Row
            icon={<ClipboardList className="h-5 w-5" />}
            tone="bg-sun-200 text-ink-900"
            title="TODOを追加"
            sub="課題・暗記・その他のやること"
            onClick={() => go("/app/todo?new=1")}
          />
        </ul>
      </div>
    </div>
  );
}

function Row({
  icon,
  tone,
  title,
  sub,
  onClick,
}: {
  icon: React.ReactNode;
  tone: string;
  title: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-2xl border border-cream-200 bg-white p-3 text-left shadow-soft active:bg-cream-50 transition"
      >
        <span
          className={cn(
            "flex h-11 w-11 flex-none items-center justify-center rounded-2xl",
            tone,
          )}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-black text-ink-900">{title}</div>
          <div className="text-[11px] text-ink-500">{sub}</div>
        </div>
        <ChevronRight className="h-4 w-4 flex-none text-ink-400" />
      </button>
    </li>
  );
}
