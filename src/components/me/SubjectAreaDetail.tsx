"use client";

// 教科詳細ページ - /app/me/subjects/[areaId]
//
// 構成:
//   1. ヘッダ (戻る + 教科名)
//   2. ステータスサマリ (偏差値 / アプリスコア / 直近テスト)
//   3. 偏差値推移ライングラフ (この教科のみ)
//   4. 領域・単元 (1〜3年トグル + 単元タップで得意苦手)
//   5. 必要能力タグ

import { useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/hooks/useStore";
import {
  CURRICULUM,
  SUBJECT_AREAS,
  type GradeId,
  type SubjectAreaId,
} from "@/lib/master/subjects/hierarchy";
import { guessArea } from "@/lib/master/subjects/guessArea";
import { DeviationTrend, type TrendSeries } from "./DeviationTrend";

const PROFICIENCY_LEVELS = [
  { id: "good", label: "得意",         tone: "bg-mint-100 text-mint-600" },
  { id: "fair", label: "ちょい得意",   tone: "bg-sky-100 text-sky-700" },
  { id: "weak", label: "苦手",         tone: "bg-peach-100 text-peach-500" },
  { id: "bad",  label: "マジで苦手",   tone: "bg-coral-300 text-white" },
] as const;
type Proficiency = (typeof PROFICIENCY_LEVELS)[number]["id"];

// TODO: テスト結果と能力タグから自動推定する関数に置き換える
const DEFAULT_PROFICIENCY: Proficiency = "fair";

export function SubjectAreaDetail({ area }: { area: SubjectAreaId }) {
  const { state, hydrated } = useStore();
  const [gradeToggle, setGradeToggle] = useState<GradeId>("h2");
  const [proficiency, setProficiency] = useState<Record<string, Proficiency>>({});

  const areaDef = SUBJECT_AREAS.find((a) => a.id === area);

  const subjects = useMemo(
    () => CURRICULUM.filter((s) => s.area === area),
    [area],
  );

  const visibleSubjects = useMemo(
    () => subjects.filter((s) => s.grades.includes(gradeToggle)),
    [subjects, gradeToggle],
  );

  // 偏差値推移 (state.tests から、この教科に該当するもの)
  const trendSeries = useMemo<TrendSeries[]>(() => {
    if (!areaDef) return [];
    const pts = (state.tests ?? [])
      .filter((t) => guessArea(t.input.subject) === area)
      .map((t) => ({
        date: t.createdAt.slice(0, 10),
        value: t.input.deviation ?? Math.round((t.input.score / t.input.fullScore) * 100 / 2 + 35),
        label: t.input.testName,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    if (pts.length === 0) return [];
    return [{ name: areaDef.name, color: "rgb(0, 113, 227)", points: pts }];
  }, [state.tests, area, areaDef]);

  const tests = (state.tests ?? []).filter((t) => guessArea(t.input.subject) === area);
  const lastTest = tests[0];
  const lastDeviation = lastTest?.input.deviation;
  const lastScorePct = lastTest
    ? Math.round((lastTest.input.score / lastTest.input.fullScore) * 100)
    : undefined;

  // 必要能力タグ (この教科に出てくる全 ability) 集計
  const abilityCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of visibleSubjects) {
      for (const d of s.domains) {
        for (const u of d.units) {
          for (const a of u.abilities ?? []) {
            map.set(a, (map.get(a) ?? 0) + 1);
          }
        }
      }
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [visibleSubjects]);

  if (!hydrated) {
    return <div className="px-5 pt-8 text-sm text-ink-500">読み込み中…</div>;
  }
  if (!areaDef) {
    return (
      <div className="px-5 pt-8">
        <p className="text-sm text-ink-500">指定の教科が見つかりません</p>
        <Link href="/app/me" className="mt-2 inline-flex text-sky-500 underline">
          マイページへ戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="px-5 pb-8 pt-3 space-y-5">
      {/* 教科ヘッダ */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl text-base font-bold",
            areaDef.tone,
          )}
        >
          {areaDef.shortName}
        </span>
        <h1 className="text-[22px] font-bold leading-tight tracking-tight text-ink-900">
          {areaDef.name}
        </h1>
      </div>

      {/* サマリ */}
      <section className="grid grid-cols-3 gap-2">
        <Stat label="偏差値" main={lastDeviation ? String(lastDeviation) : "—"} unit="" tone="bg-white" />
        <Stat
          label="得点率"
          main={lastScorePct !== undefined ? String(lastScorePct) : "—"}
          unit="%"
          tone="bg-white"
        />
        <Stat
          label="テスト数"
          main={String(tests.length)}
          unit="件"
          tone="bg-white"
        />
      </section>

      {/* 偏差値推移 */}
      <section className="rounded-2xl border border-ink-100/80 bg-white p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
            偏差値の推移
          </h2>
          <span className="text-[10px] font-medium text-ink-500 tabular-nums">
            {tests.length} 回
          </span>
        </div>
        <div className="mt-3">
          <DeviationTrend series={trendSeries} />
        </div>
      </section>

      {/* 領域・単元 */}
      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
            領域・単元
          </h2>
          <ul className="flex gap-1 rounded-xl bg-cream-100/70 p-1">
            {(["h1", "h2", "h3"] as GradeId[]).map((g) => (
              <li key={g}>
                <button
                  type="button"
                  onClick={() => setGradeToggle(g)}
                  className={cn(
                    "h-7 rounded-lg px-2.5 text-[10px] font-bold transition",
                    gradeToggle === g ? "bg-white text-ink-900 shadow-soft" : "text-ink-500",
                  )}
                >
                  {g === "h1" ? "高1" : g === "h2" ? "高2" : "高3"}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <ul className="mt-3 space-y-2">
          {visibleSubjects.map((s) => (
            <li
              key={s.id}
              className="rounded-2xl border border-ink-100/80 bg-white p-3"
            >
              <div className="text-[13px] font-bold text-ink-900">{s.name}</div>
              <ul className="mt-2 space-y-2">
                {s.domains.map((d) => (
                  <li key={d.id}>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                      {d.name}
                    </div>
                    <ul className="mt-1 flex flex-wrap gap-1">
                      {d.units.map((u) => {
                        const prof = proficiency[u.id] ?? DEFAULT_PROFICIENCY;
                        const def = PROFICIENCY_LEVELS.find((p) => p.id === prof)!;
                        return (
                          <li key={u.id}>
                            <button
                              type="button"
                              onClick={() => {
                                const order: Proficiency[] = ["good", "fair", "weak", "bad"];
                                const cur = order.indexOf(prof);
                                const next = order[(cur + 1) % order.length];
                                setProficiency({ ...proficiency, [u.id]: next });
                              }}
                              className={cn(
                                "rounded-full px-2.5 py-1 text-[11px] font-bold transition",
                                def.tone,
                              )}
                            >
                              {u.name}
                              <span className="ml-1 text-[9px] opacity-70">
                                {def.label}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[10px] text-ink-400">
          単元タップで「得意 → ちょい得意 → 苦手 → マジで苦手」が切り替わります。
        </p>
      </section>

      {/* 必要能力タグ */}
      {abilityCounts.length > 0 ? (
        <section className="rounded-2xl border border-ink-100/80 bg-white p-4">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-ink-400" />
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
              必要な能力
            </h2>
          </div>
          <ul className="mt-2 flex flex-wrap gap-1">
            {abilityCounts.map(([name, count]) => (
              <li
                key={name}
                className="flex items-center gap-1 rounded-full bg-peach-50 px-2 py-1 text-[10px] font-bold text-peach-500"
              >
                {name}
                <span className="text-ink-400 tabular-nums">×{count}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  main,
  unit,
  tone,
}: {
  label: string;
  main: string;
  unit: string;
  tone: string;
}) {
  return (
    <div className={cn("rounded-xl border border-ink-100/80 p-2.5", tone)}>
      <div className="text-[10px] font-medium text-ink-500">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-0.5">
        <span className="text-xl font-bold tabular-nums text-ink-900">{main}</span>
        {unit ? <span className="text-[10px] font-medium text-ink-400">{unit}</span> : null}
      </div>
    </div>
  );
}

// guessArea は @/lib/master/subjects/guessArea から import 済み
