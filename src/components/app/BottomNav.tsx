"use client";

// 5 タブ + 中央 FAB 構成
// 探すタブを削除し、TODO タブを追加
// 中央の「追加」FAB はテスト・模試・勉強時間・タスクの登録メニューを開く

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  CalendarDays,
  CheckSquare,
  Home,
  Plus,
  Timer,
  User,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { AddFabSheet } from "./AddFabSheet";

type Tab = {
  href: string;
  label: string;
  icon: typeof Home;
  match: (path: string) => boolean;
};

// 左から: ホーム / TODO / [FAB] / 集中 / 計画 / マイページ
const LEFT: Tab[] = [
  { href: "/app", label: "ホーム", icon: Home, match: (p) => p === "/app" },
  {
    href: "/app/todo",
    label: "TODO",
    icon: CheckSquare,
    match: (p) => p.startsWith("/app/todo"),
  },
];
const RIGHT: Tab[] = [
  {
    href: "/app/focus",
    label: "集中",
    icon: Timer,
    match: (p) => p.startsWith("/app/focus"),
  },
  {
    href: "/app/plan",
    label: "計画",
    icon: CalendarDays,
    match: (p) => p.startsWith("/app/plan"),
  },
  {
    href: "/app/me",
    label: "マイページ",
    icon: User,
    match: (p) => p.startsWith("/app/me"),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname.startsWith("/app/focus/run")) return null;

  return (
    <>
      <nav
        aria-label="メインナビゲーション"
        className="pb-safe fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[480px] border-t border-cream-200 bg-cream-50/95 backdrop-blur-xl md:absolute md:bottom-0 md:rounded-b-[40px]"
      >
        <ul className="flex items-stretch justify-around px-2 py-2">
          {LEFT.map((t) => (
            <NavItem key={t.href} tab={t} pathname={pathname} />
          ))}
          <li className="flex-1 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="追加"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-500 text-white shadow-soft active:scale-95 transition"
            >
              <Plus className="h-6 w-6" strokeWidth={2.4} />
            </button>
          </li>
          {RIGHT.map((t) => (
            <NavItem key={t.href} tab={t} pathname={pathname} />
          ))}
        </ul>
      </nav>

      <AddFabSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function NavItem({ tab, pathname }: { tab: Tab; pathname: string }) {
  const active = tab.match(pathname);
  const Icon = tab.icon;
  return (
    <li className="flex-1">
      <Link
        href={tab.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group flex flex-col items-center justify-center gap-1 rounded-2xl py-1.5",
          active ? "text-sky-600" : "text-ink-400 hover:text-ink-700",
        )}
      >
        <span
          className={cn(
            "flex h-9 w-12 items-center justify-center rounded-2xl transition",
            active
              ? "bg-sky-100"
              : "bg-transparent group-hover:bg-cream-100",
          )}
        >
          <Icon className={cn("h-5 w-5", active ? "stroke-[2.4]" : "")} />
        </span>
        <span
          className={cn(
            "text-[10px] font-bold",
            active ? "text-sky-600" : "text-ink-500",
          )}
        >
          {tab.label}
        </span>
      </Link>
    </li>
  );
}
