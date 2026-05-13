import { AppHeader } from "@/components/app/AppHeader";
import { Flame, Trophy, Target, Settings, HelpCircle, ChevronRight } from "lucide-react";

const STATS = [
  { icon: Flame, tone: "bg-peach-100 text-peach-500", label: "連続日数", value: "12", unit: "日" },
  { icon: Trophy, tone: "bg-sun-200 text-ink-900", label: "今月の完了", value: "37", unit: "ブロック" },
  { icon: Target, tone: "bg-sky-100 text-sky-600", label: "週目標", value: "7 / 24", unit: "" },
];

const MENUS = [
  { label: "志望校・本番日", href: "/app/me/goal" },
  { label: "所有参考書", href: "/app/me/textbooks" },
  { label: "通知設定", href: "/app/me/notify" },
  { label: "プラン", href: "/app/me/plan" },
];

export default function MePage() {
  return (
    <>
      <AppHeader title="マイ" />
      <div className="px-4 pt-3">
        {/* Profile */}
        <section className="rounded-3xl border border-cream-200 bg-white p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-xl font-black text-white">
              ゆ
            </div>
            <div>
              <div className="text-base font-black text-ink-900">ゆうえいさん</div>
              <div className="text-xs text-ink-500">高2 · 私立難関志望</div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <ul className="mt-4 grid grid-cols-3 gap-2.5">
          {STATS.map((s) => (
            <li
              key={s.label}
              className="rounded-2xl border border-cream-200 bg-white p-3 shadow-soft"
            >
              <div className={"flex h-8 w-8 items-center justify-center rounded-xl " + s.tone}>
                <s.icon className="h-4 w-4" />
              </div>
              <div className="mt-2 text-[10px] font-bold text-ink-500">
                {s.label}
              </div>
              <div className="text-lg font-black text-ink-900">
                {s.value}
                <span className="ml-0.5 text-[10px] font-bold text-ink-500">{s.unit}</span>
              </div>
            </li>
          ))}
        </ul>

        {/* Menus */}
        <ul className="mt-5 divide-y divide-cream-200 overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-soft">
          {MENUS.map((m) => (
            <li key={m.href}>
              <a
                href={m.href}
                className="flex items-center justify-between px-4 py-3.5 active:bg-cream-100"
              >
                <span className="text-sm font-bold text-ink-900">{m.label}</span>
                <ChevronRight className="h-4 w-4 text-ink-400" />
              </a>
            </li>
          ))}
        </ul>

        <ul className="mt-3 divide-y divide-cream-200 overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-soft">
          <li>
            <a className="flex items-center justify-between px-4 py-3.5 active:bg-cream-100" href="/app/me/settings">
              <span className="flex items-center gap-2 text-sm font-bold text-ink-900">
                <Settings className="h-4 w-4 text-ink-500" />
                設定
              </span>
              <ChevronRight className="h-4 w-4 text-ink-400" />
            </a>
          </li>
          <li>
            <a className="flex items-center justify-between px-4 py-3.5 active:bg-cream-100" href="/app/me/help">
              <span className="flex items-center gap-2 text-sm font-bold text-ink-900">
                <HelpCircle className="h-4 w-4 text-ink-500" />
                ヘルプ
              </span>
              <ChevronRight className="h-4 w-4 text-ink-400" />
            </a>
          </li>
        </ul>
      </div>
    </>
  );
}
