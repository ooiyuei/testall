"use client";

// 5 タブ・FAB なし。Apple HIG / iOS Tab Bar ベース。
// リデザイン後 (NavAfter): 背景クリーム + 強めのblur、active はインクブラック + 下にスカイドット。
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
import { haptic } from "@/lib/haptic";

type Tab = {
  href: string;
  label: string;
  icon: typeof Home;
  match: (path: string) => boolean;
};

const TABS: Tab[] = [
  { href: "/app",         label: "ホーム",     icon: Home,          match: (p) => p === "/app" },
  { href: "/app/todo",    label: "やること",   icon: CheckSquare,   match: (p) => p.startsWith("/app/todo") },
  { href: "/app/focus",   label: "集中",       icon: Timer,         match: (p) => p.startsWith("/app/focus") },
  { href: "/app/plan",    label: "計画",       icon: CalendarRange, match: (p) => p.startsWith("/app/plan") },
  { href: "/app/me",      label: "マイ",       icon: User,          match: (p) => p.startsWith("/app/me") },
];

export function BottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/app/focus/run")) return null;

  return (
    <nav
      aria-label="メインナビゲーション"
      className="pb-safe fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[480px] border-t border-ink-200 bg-cream-50 shadow-[0_-4px_20px_-8px_rgba(20,19,15,0.10)]"
    >
      <ul className="flex items-stretch justify-around gap-1 px-3 py-1.5">
        {TABS.map((t) => {
          const active = t.match(pathname);
          const Icon = t.icon;
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  if (!active) haptic.light();
                }}
                className="group relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 transition active:scale-[0.96]"
              >
                <Icon
                  className={cn(
                    "h-6 w-6 transition-colors",
                    active
                      ? "text-ink-900"
                      : "text-ink-300 group-hover:text-ink-700",
                  )}
                  strokeWidth={active ? 2.0 : 1.6}
                />
                <span
                  className={cn(
                    "text-[10px] leading-none tracking-tight transition-colors",
                    active
                      ? "font-bold text-ink-900"
                      : "font-medium text-ink-400 group-hover:text-ink-700",
                  )}
                >
                  {t.label}
                </span>
                {/* iOS 風アクティブドット (下) */}
                {active ? (
                  <span className="pointer-events-none absolute bottom-0.5 h-1 w-1 rounded-full bg-sky-500" />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
