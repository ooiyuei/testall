"use client";

// 5 タブ・FAB なし。Apple HIG / iOS Tab Bar ベース。
// アイコン上 + ラベル下、アクティブはアクセントカラー。
// 「追加」は AppHeader の "+" ボタンに移動した。

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarRange,
  CheckSquare,
  Home,
  Timer,
  User,
} from "lucide-react";
import { cn } from "@/lib/cn";

type Tab = {
  href: string;
  label: string;
  icon: typeof Home;
  match: (path: string) => boolean;
};

const TABS: Tab[] = [
  { href: "/app",         label: "ホーム",     icon: Home,          match: (p) => p === "/app" },
  { href: "/app/todo",    label: "TODO",      icon: CheckSquare,    match: (p) => p.startsWith("/app/todo") },
  { href: "/app/focus",   label: "集中",       icon: Timer,          match: (p) => p.startsWith("/app/focus") },
  { href: "/app/plan",    label: "計画",       icon: CalendarRange,  match: (p) => p.startsWith("/app/plan") },
  { href: "/app/me",      label: "マイページ", icon: User,           match: (p) => p.startsWith("/app/me") },
];

export function BottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/app/focus/run")) return null;

  return (
    <nav
      aria-label="メインナビゲーション"
      className="pb-safe fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[480px] border-t border-cream-200/80 bg-cream-50/85 backdrop-blur-xl md:absolute md:bottom-0 md:rounded-b-[32px]"
    >
      <ul className="flex items-stretch justify-around px-1 py-1.5">
        {TABS.map((t) => {
          const active = t.match(pathname);
          const Icon = t.icon;
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className="group flex flex-col items-center gap-0.5 py-1.5"
              >
                <Icon
                  className={cn(
                    "h-[22px] w-[22px] transition-colors",
                    active ? "text-sky-500" : "text-ink-400",
                  )}
                  strokeWidth={active ? 2.2 : 1.8}
                />
                <span
                  className={cn(
                    "text-[10px] tracking-tight transition-colors",
                    active ? "font-bold text-sky-500" : "font-medium text-ink-400",
                  )}
                >
                  {t.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
