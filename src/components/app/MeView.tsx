"use client";

import Link from "next/link";
import {
  Flame,
  HelpCircle,
  Settings,
  Target,
  Trophy,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { useStore } from "@/lib/hooks/useStore";
import { clearAll, getStreak } from "@/lib/store";
import { GRADES, TARGET_LEVELS } from "@/lib/subjects";
import { findUniversity } from "@/lib/universities";

export function MeView() {
  const { state, hydrated } = useStore();

  if (!hydrated) {
    return (
      <div className="px-4 pt-10 text-sm text-ink-500">読み込み中…</div>
    );
  }

  const profile = state.profile;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const completedThisMonth = state.blockLogs.filter(
    (l) => new Date(l.completedAt) >= monthStart,
  ).length;
  const streak = getStreak();

  const gradeLabel =
    GRADES.find((g) => g.id === profile?.grade)?.name ?? "未設定";
  const targetLabel =
    TARGET_LEVELS.find((t) => t.id === profile?.target)?.name ?? "未設定";
  const targetUniversities = profile?.targetUniversities ?? [];

  const stats = [
    {
      icon: Flame,
      tone: "bg-peach-100 text-peach-500",
      label: "連続日数",
      value: String(streak),
      unit: "日",
    },
    {
      icon: Trophy,
      tone: "bg-sun-200 text-ink-900",
      label: "今月の完了",
      value: String(completedThisMonth),
      unit: "ブロック",
    },
    {
      icon: Target,
      tone: "bg-sky-100 text-sky-600",
      label: "登録テスト",
      value: String(state.tests.length),
      unit: "件",
    },
  ];

  function handleReset() {
    if (
      !confirm(
        "保存されているプロフィール・テスト・記録をすべて消します。よろしいですか？",
      )
    ) {
      return;
    }
    clearAll();
  }

  return (
    <div className="px-4 pt-3 pb-10">
      {/* Profile */}
      <section className="rounded-3xl border border-cream-200 bg-white p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-xl font-black text-white">
            {profile?.name?.[0] ?? "あ"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-base font-black text-ink-900">
              {profile?.name ?? "あなた"}
            </div>
            <div className="text-xs text-ink-500">
              {gradeLabel}
              {profile?.schoolName ? ` · ${profile.schoolName}` : ""}
              {profile?.deviation
                ? ` · 偏差値 ${profile.deviation}`
                : ` · ${targetLabel}`}
            </div>
            {profile?.examDate ? (
              <div className="mt-1 text-[10px] font-bold text-peach-500">
                本番まで{" "}
                {Math.max(
                  0,
                  Math.ceil(
                    (new Date(profile.examDate).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24),
                  ),
                )}
                日
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Stats */}
      <ul className="mt-4 grid grid-cols-3 gap-2.5">
        {stats.map((s) => (
          <li
            key={s.label}
            className="rounded-2xl border border-cream-200 bg-white p-3 shadow-soft"
          >
            <div
              className={
                "flex h-8 w-8 items-center justify-center rounded-xl " + s.tone
              }
            >
              <s.icon className="h-4 w-4" />
            </div>
            <div className="mt-2 text-[10px] font-bold text-ink-500">
              {s.label}
            </div>
            <div className="text-lg font-black text-ink-900">
              {s.value}
              <span className="ml-0.5 text-[10px] font-bold text-ink-500">
                {s.unit}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {/* Target universities */}
      {targetUniversities.length > 0 ? (
        <section className="mt-5 rounded-3xl border border-cream-200 bg-white p-4 shadow-soft">
          <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
            志望校
          </div>
          <ul className="mt-2 space-y-1.5">
            {targetUniversities.map((tu) => {
              const u = findUniversity(tu.universityId);
              if (!u) return null;
              return (
                <li
                  key={tu.universityId}
                  className="flex items-center gap-2 rounded-xl bg-cream-50 px-3 py-2"
                >
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-md bg-sky-500 text-[10px] font-black text-white">
                    {tu.priority}
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-bold text-ink-900 truncate">
                    {u.name}
                    {tu.faculty ? ` / ${tu.faculty}` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* Textbooks */}
      {profile?.textbooks && profile.textbooks.length > 0 ? (
        <section className="mt-5 rounded-3xl border border-cream-200 bg-white p-4 shadow-soft">
          <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
            持っている参考書
          </div>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {profile.textbooks.map((t, i) => (
              <li
                key={i}
                className="rounded-full bg-cream-100 px-2.5 py-1 text-[11px] font-bold text-ink-700"
              >
                {t}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Menus */}
      <ul className="mt-5 divide-y divide-cream-200 overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-soft">
        <li>
          <Link
            href="/onboarding"
            className="flex items-center justify-between px-4 py-3.5 active:bg-cream-100"
          >
            <span className="text-sm font-bold text-ink-900">
              プロフィール / 志望校を更新
            </span>
            <ChevronRight className="h-4 w-4 text-ink-400" />
          </Link>
        </li>
        <li>
          <Link
            href="/app/search"
            className="flex items-center justify-between px-4 py-3.5 active:bg-cream-100"
          >
            <span className="text-sm font-bold text-ink-900">
              参考書を追加（探す）
            </span>
            <ChevronRight className="h-4 w-4 text-ink-400" />
          </Link>
        </li>
        <li>
          <a
            className="flex items-center justify-between px-4 py-3.5 active:bg-cream-100"
            href="#"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-ink-900">
              <Settings className="h-4 w-4 text-ink-500" />
              設定（近日）
            </span>
            <ChevronRight className="h-4 w-4 text-ink-400" />
          </a>
        </li>
        <li>
          <a
            className="flex items-center justify-between px-4 py-3.5 active:bg-cream-100"
            href="#"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-ink-900">
              <HelpCircle className="h-4 w-4 text-ink-500" />
              ヘルプ
            </span>
            <ChevronRight className="h-4 w-4 text-ink-400" />
          </a>
        </li>
      </ul>

      <button
        type="button"
        onClick={handleReset}
        className="mt-6 flex h-10 w-full items-center justify-center gap-1 rounded-2xl border border-cream-200 text-xs font-bold text-ink-400 hover:bg-cream-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
        ローカルデータをすべて消す
      </button>
    </div>
  );
}
