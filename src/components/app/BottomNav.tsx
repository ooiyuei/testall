"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Home,
  Plus,
  Search,
  Timer,
  User,
} from "lucide-react";
import { cn } from "@/lib/cn";

type Tab = {
  href: string;
  label: string;
  icon: typeof Home;
  match: (path: string) => boolean;
  primary?: boolean; // 中央の強調表示
};

const TABS: Tab[] = [
  { href: "/app", label: "ホーム", icon: Home, match: (p) => p === "/app" },
  {
    href: "/app/search",
    label: "探す",
    icon: Search,
    match: (p) => p.startsWith("/app/search"),
  },
  {
    href: "/app/test/new",
    label: "入力",
    icon: Plus,
    match: (p) => p.startsWith("/app/test"),
    primary: true,
  },
  {
    href: "/app/plan",
    label: "計画",
    icon: CalendarDays,
    match: (p) => p.startsWith("/app/plan"),
  },
  {
    href: "/app/focus",
    label: "集中",
    icon: Timer,
    match: (p) => p.startsWith("/app/focus"),
  },
  {
    href: "/app/me",
    label: "マイ",
    icon: User,
    match: (p) => p.startsWith("/app/me"),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  // Hide bottom nav during immersive focus session
  if (pathname.startsWith("/app/focus/run")) return null;

  return (
    <nav
      aria-label="メインナビゲーション"
      className="pb-safe fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[480px] border-t border-cream-200 bg-cream-50/90 backdrop-blur-xl md:absolute md:bottom-0 md:rounded-b-[40px]"
    >
      <ul className="flex items-stretch justify-around px-1 py-2">
        {TABS.map((t) => {
          const active = t.match(pathname);
          const Icon = t.icon;
          if (t.primary) {
            return (
              <li key={t.href} className="flex-1">
                <Link
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className="group flex flex-col items-center justify-center gap-1 rounded-2xl py-0"
                >
                  <span
                    className={cn(
                      "-mt-3 flex h-12 w-12 items-center justify-center rounded-full bg-sky-500 text-white shadow-[0_8px_20px_-8px_var(--color-sky-500)] transition active:scale-95",
                      active && "ring-4 ring-sky-200",
                    )}
                  >
                    <Icon className="h-6 w-6 stroke-[2.4]" />
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 text-[10px] font-bold",
                      active ? "text-sky-600" : "text-ink-500",
                    )}
                  >
                    {t.label}
                  </span>
                </Link>
              </li>
            );
          }
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
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
                  <Icon
                    className={cn("h-5 w-5", active ? "stroke-[2.4]" : "")}
                  />
                </span>
                <span
                  className={cn(
                    "text-[10px] font-bold",
                    active ? "text-sky-600" : "text-ink-500",
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
