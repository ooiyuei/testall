"use client";

import Link from "next/link";
import {
  Flame,
  HelpCircle,
  Settings,
  Trophy,
  ChevronRight,
  Target,
  BookOpen,
  TrendingUp,
  ChevronDown,
  CalendarDays,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/hooks/useStore";
import { getStreak, getSubjectStrengths } from "@/lib/store";
import { GRADES, TARGET_LEVELS } from "@/lib/subjects";
import { findUniversity } from "@/lib/universities";
import { CATEGORY_DEFS, getCategoryDef } from "@/lib/curriculum";
import type { SubjectCategory } from "@/lib/curriculum";

export function MeView() {
  const { state, hydrated } = useStore();
  const [expandedCategory, setExpandedCategory] =
    useState<SubjectCategory | null>(null);

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
  const strengths = getSubjectStrengths();
  const strengthByCat = new Map(strengths.map((s) => [s.category, s]));

  const daysToExam = profile?.examDate
    ? Math.max(
        0,
        Math.ceil(
          (new Date(profile.examDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : null;

  return (
    <div className="px-4 pt-3 pb-10 space-y-5">
      {/* Profile header */}
      <section className="overflow-hidden rounded-3xl border border-cream-200 bg-gradient-to-br from-white to-cream-50 p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-sky-500 text-xl font-black text-white">
            {profile?.name?.[0] ?? "あ"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-base font-black text-ink-900">
              {profile?.name ?? "あなた"}
            </div>
            <div className="mt-0.5 text-xs text-ink-500">
              {gradeLabel}
              {profile?.schoolName ? ` · ${profile.schoolName}` : ""}
              {profile?.deviation ? ` · 偏差値 ${profile.deviation}` : ""}
            </div>
          </div>
          <Link
            href="/onboarding"
            className="flex h-9 flex-none items-center rounded-full border border-cream-200 px-3 text-[11px] font-bold text-ink-700 hover:bg-cream-50"
          >
            編集
          </Link>
        </div>

        {daysToExam !== null ? (
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-white p-3 shadow-soft">
            <div className="flex items-center gap-2 text-xs text-ink-500">
              <CalendarDays className="h-3.5 w-3.5" />
              本番日
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black tabular-nums text-peach-500">
                {daysToExam}
              </span>
              <span className="text-xs font-bold text-ink-500">日</span>
            </div>
          </div>
        ) : null}
      </section>

      {/* Stats */}
      <ul className="grid grid-cols-3 gap-2.5">
        {[
          {
            icon: Flame,
            tone: "bg-peach-100 text-peach-500",
            label: "連続",
            value: String(streak),
            unit: "日",
          },
          {
            icon: Trophy,
            tone: "bg-sun-200 text-ink-900",
            label: "今月",
            value: String(completedThisMonth),
            unit: "本",
          },
          {
            icon: Target,
            tone: "bg-sky-100 text-sky-600",
            label: "テスト",
            value: String(state.tests.length),
            unit: "件",
          },
        ].map((s) => (
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

      {/* 実力パラメーター */}
      <section>
        <SectionHeader icon={TrendingUp} title="実力パラメーター" />
        <p className="mt-1 text-[11px] text-ink-500">
          テストを追加するとここに反映されます。カテゴリをタップで詳細表示。
        </p>
        <ul className="mt-3 space-y-2">
          {CATEGORY_DEFS.filter((c) => c.id !== "info").map((cat) => {
            const s = strengthByCat.get(cat.id);
            const bar = s?.bar ?? 0;
            const tests = state.tests.filter(
              (t) => extractCategory(t.input.subject) === cat.id,
            );
            const expanded = expandedCategory === cat.id;
            return (
              <li
                key={cat.id}
                className="rounded-2xl border border-cream-200 bg-white shadow-soft overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedCategory(expanded ? null : cat.id)
                  }
                  className="flex w-full items-center gap-3 px-3 py-3 text-left active:bg-cream-100"
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 flex-none items-center justify-center rounded-xl text-sm font-black",
                      cat.tone,
                    )}
                  >
                    {cat.shortName}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-black text-ink-900">
                        {cat.name}
                      </span>
                      {s ? (
                        <span className="text-[10px] font-bold text-ink-500 tabular-nums">
                          {bar}%（直近）· {s.count}回
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-ink-400">
                          未記録
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-cream-100">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          bar >= 75
                            ? "bg-mint-500"
                            : bar >= 50
                            ? "bg-sky-500"
                            : bar >= 30
                            ? "bg-sun-400"
                            : "bg-coral-300",
                        )}
                        style={{ width: `${bar}%` }}
                      />
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 flex-none text-ink-400 transition-transform",
                      expanded && "rotate-180",
                    )}
                  />
                </button>
                {expanded ? (
                  <CategoryDetail
                    category={cat.id}
                    tests={tests.map((t) => ({
                      id: t.id,
                      testName: t.input.testName,
                      subject: t.input.subject,
                      pct: Math.round(
                        (t.input.score / t.input.fullScore) * 100,
                      ),
                      date: t.createdAt,
                    }))}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Target universities */}
      {targetUniversities.length > 0 ? (
        <section>
          <SectionHeader icon={Target} title="志望校" />
          <ul className="mt-2 space-y-1.5">
            {targetUniversities.map((tu) => {
              const u = findUniversity(tu.universityId);
              if (!u) return null;
              const minDev = Math.min(...u.faculties.map((f) => f.deviation));
              const maxDev = Math.max(...u.faculties.map((f) => f.deviation));
              return (
                <li
                  key={tu.universityId}
                  className="flex items-center gap-3 rounded-2xl border border-cream-200 bg-white p-3 shadow-soft"
                >
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-sky-500 text-xs font-black text-white">
                    第{tu.priority}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-black text-ink-900 truncate">
                      {u.name}
                      {tu.faculty ? ` / ${tu.faculty}` : ""}
                    </div>
                    <div className="text-[10px] text-ink-500">
                      偏差値 {minDev}-{maxDev} · {u.region}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* Textbooks */}
      <section>
        <SectionHeader icon={BookOpen} title="使ってる参考書" />
        {profile?.textbooks && profile.textbooks.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {profile.textbooks.map((t, i) => (
              <li
                key={i}
                className="rounded-full border border-cream-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-ink-700 shadow-soft"
              >
                {t}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[11px] text-ink-500">
            まだ登録がありません。
          </p>
        )}
        <Link
          href="/app/search"
          className="mt-3 inline-flex h-9 items-center gap-1 rounded-full border border-cream-200 px-3 text-[11px] font-bold text-ink-700"
        >
          探すで追加
          <ChevronRight className="h-3 w-3" />
        </Link>
      </section>

      {/* Menu */}
      <ul className="divide-y divide-cream-200 overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-soft">
        <li>
          <Link
            href="/app/me/settings"
            className="flex items-center gap-3 px-4 py-3.5 active:bg-cream-100"
          >
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-cream-100 text-ink-700">
              <Settings className="h-4 w-4" />
            </span>
            <span className="flex-1 text-sm font-bold text-ink-900">設定</span>
            <ChevronRight className="h-4 w-4 text-ink-400" />
          </Link>
        </li>
        <li>
          <a
            className="flex items-center gap-3 px-4 py-3.5 active:bg-cream-100"
            href="#"
          >
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-cream-100 text-ink-700">
              <HelpCircle className="h-4 w-4" />
            </span>
            <span className="flex-1 text-sm font-bold text-ink-900">
              ヘルプ・お問い合わせ
            </span>
            <ChevronRight className="h-4 w-4 text-ink-400" />
          </a>
        </li>
      </ul>

      <p className="text-center text-[10px] text-ink-400">
        Testall v0.4.0 · {targetLabel}
      </p>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: typeof Target;
  title: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-ink-500" />
      <h2 className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
        {title}
      </h2>
    </div>
  );
}

function CategoryDetail({
  category,
  tests,
}: {
  category: SubjectCategory;
  tests: { id: string; testName: string; subject: string; pct: number; date: string }[];
}) {
  const cat = getCategoryDef(category);

  // カテゴリ別の代表的な詳細分野
  const detailAreas: Record<SubjectCategory, string[]> = {
    japanese: ["現代文", "古文", "漢文", "漢字・語彙"],
    math: ["数IA", "数IIBC", "数IIIC"],
    english: ["単語", "文法", "長文", "リスニング", "英作文"],
    science: ["物理", "化学", "生物", "地学"],
    social: ["日本史", "世界史", "地理", "政経", "倫理"],
    info: ["情報Ⅰ"],
  };

  return (
    <div className="border-t border-cream-200 bg-cream-50/60 p-4">
      <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
        {cat.name}の詳細分野
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {detailAreas[category].map((area) => (
          <span
            key={area}
            className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-ink-700 border border-cream-200"
          >
            {area}
          </span>
        ))}
      </div>

      {tests.length > 0 ? (
        <>
          <div className="mt-4 text-[10px] font-bold uppercase tracking-widest text-ink-500">
            最近のテスト
          </div>
          <ul className="mt-2 space-y-1.5">
            {tests.slice(0, 3).map((t) => (
              <li key={t.id}>
                <Link
                  href={`/app/test/${t.id}`}
                  className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 hover:bg-cream-100"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-ink-900 truncate">
                      {t.testName}
                    </div>
                    <div className="text-[10px] text-ink-500">
                      {t.subject} ·{" "}
                      {new Date(t.date).toLocaleDateString("ja-JP", {
                        month: "numeric",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                  <span className="text-sm font-black text-ink-900 tabular-nums">
                    {t.pct}%
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-3 text-[11px] text-ink-500">
          このカテゴリのテストはまだありません。
        </p>
      )}
    </div>
  );
}

function extractCategory(name: string): string {
  if (/数学|数IA|数IIBC|数IIIC/.test(name)) return "math";
  if (/英語|英コミュ|英表現/.test(name)) return "english";
  if (/国語|現代文|古典|古文|漢文/.test(name)) return "japanese";
  if (/物理|化学|生物|地学|理科/.test(name)) return "science";
  if (/日史|世史|地理|歴総|地総|政経|倫理|公共|社会|日本史|世界史/.test(name))
    return "social";
  if (/情報/.test(name)) return "info";
  return "other";
}
