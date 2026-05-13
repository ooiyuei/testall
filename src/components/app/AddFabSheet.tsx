"use client";

// ヘッダーの "+" ボタンから開く追加メニュー (ボトムシート)
// Apple HIG: 角丸 16px / 影なし背景 / 高コントラスト不要のホワイト

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  Clock3,
  FileText,
  ScrollText,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { BookshelfAddModal } from "@/components/me/BookshelfAddModal";

type Props = {
  open: boolean;
  onClose: () => void;
};

type FabItem = {
  icon: typeof ClipboardList;
  tone: string;
  title: string;
  sub: string;
  action: { kind: "route"; href: string } | { kind: "bookshelf" };
};

const ITEMS: FabItem[] = [
  {
    icon: ClipboardList,
    tone: "bg-sky-100 text-sky-600",
    title: "タスクを追加",
    sub: "今日やることを1つ登録",
    action: { kind: "route", href: "/app/todo?new=1" },
  },
  {
    icon: BookOpen,
    tone: "bg-mint-100 text-mint-600",
    title: "参考書・教科書を追加",
    sub: "本棚に登録 (検索・人気から選択)",
    action: { kind: "bookshelf" },
  },
  {
    icon: Clock3,
    tone: "bg-peach-100 text-peach-500",
    title: "勉強時間を記録",
    sub: "集中したブロックを後から記録",
    action: { kind: "route", href: "/app/focus" },
  },
  {
    icon: FileText,
    tone: "bg-coral-200 text-coral-400",
    title: "定期テストを追加",
    sub: "校内の中間・期末・実力",
    action: { kind: "route", href: "/app/test/new?kind=regular" },
  },
  {
    icon: ScrollText,
    tone: "bg-sun-200 text-ink-900",
    title: "模試を追加",
    sub: "河合・駿台・東進・代ゼミ・進研",
    action: { kind: "route", href: "/app/test/new?kind=mock" },
  },
];

export function AddFabSheet({ open, onClose }: Props) {
  const router = useRouter();
  const [bookshelfOpen, setBookshelfOpen] = useState(false);
  if (!open && !bookshelfOpen) return null;

  function go(item: FabItem) {
    onClose();
    if (item.action.kind === "route") {
      router.push(item.action.href);
    } else {
      setBookshelfOpen(true);
    }
  }

  if (bookshelfOpen) {
    return <BookshelfAddModal onClose={() => setBookshelfOpen(false)} />;
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-ink-900/40 backdrop-blur-[2px]">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="閉じる"
        onClick={onClose}
      />
      <div className="sheet-in relative z-10 mx-auto w-full max-w-[480px] rounded-t-3xl bg-cream-50 px-5 pt-3 pb-[max(env(safe-area-inset-bottom),1.25rem)] shadow-[0_-12px_40px_-8px_rgba(20,19,15,0.20)]">
        <div className="mx-auto h-1 w-9 rounded-full bg-ink-200" />
        <div className="mt-3 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-ink-900">追加する</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-500 active:bg-cream-200"
            aria-label="閉じる"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>
        <ul className="mt-3 space-y-1.5">
          {ITEMS.map((it) => {
            const Icon = it.icon;
            return (
              <li key={it.title}>
                <button
                  type="button"
                  onClick={() => go(it)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-ink-100/80 bg-white px-3 py-3 text-left active:scale-[0.985] active:bg-cream-50 transition"
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 flex-none items-center justify-center rounded-xl",
                      it.tone,
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-bold text-ink-900">
                      {it.title}
                    </div>
                    <div className="text-[11px] text-ink-500">{it.sub}</div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
