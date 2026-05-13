"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Plus,
  School,
  Search,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { GRADES } from "@/lib/subjects";
import {
  searchUniversities,
  TIER_LABEL,
  type University,
} from "@/lib/universities";
import { readStore, setProfile } from "@/lib/store";
import type { StoredProfile, TargetUniversity } from "@/lib/store";

const STEPS = [
  { id: "grade", label: "学年", icon: GraduationCap },
  { id: "deviation", label: "偏差値", icon: TrendingUp },
  { id: "target", label: "志望校", icon: Target },
  { id: "school", label: "学校", icon: School },
  { id: "time", label: "勉強時間", icon: Plus },
] as const;

type StepId = (typeof STEPS)[number]["id"];

type FormState = {
  grade: string;
  deviation: number;
  targetUniversities: TargetUniversity[];
  schoolName: string;
  weekdayMinutes: number;
  weekendMinutes: number;
};

function defaultExamDate(grade: string): string {
  const now = new Date();
  let year = now.getFullYear();
  if (grade === "h1") year += 3;
  else if (grade === "h2") year += 2;
  else year += 1;
  return `${year}-01-15`;
}

export function OnboardingFlow() {
  const router = useRouter();
  const [stepIdx, setStepIdx] = useState(0);
  const [form, setForm] = useState<FormState>(() => {
    const existing = readStore().profile;
    return {
      grade: existing?.grade ?? "h2",
      deviation: existing?.deviation ?? 55,
      targetUniversities: existing?.targetUniversities ?? [],
      schoolName: existing?.schoolName ?? "",
      weekdayMinutes: existing?.weekdayMinutes ?? 120,
      weekendMinutes: existing?.weekendMinutes ?? 240,
    };
  });

  const stepId = STEPS[stepIdx].id as StepId;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function canProceed(): boolean {
    if (stepId === "grade") return !!form.grade;
    if (stepId === "deviation") return form.deviation > 0;
    if (stepId === "target") return form.targetUniversities.length > 0;
    if (stepId === "school") return true; // optional
    if (stepId === "time") return form.weekdayMinutes > 0 && form.weekendMinutes > 0;
    return true;
  }

  function next() {
    if (!canProceed()) return;
    if (stepIdx < STEPS.length - 1) {
      setStepIdx(stepIdx + 1);
    } else {
      finish();
    }
  }

  function prev() {
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
  }

  function finish() {
    const existing = readStore().profile;
    const profile: StoredProfile = {
      ...existing,
      grade: form.grade,
      deviation: form.deviation,
      targetUniversities: form.targetUniversities,
      schoolName: form.schoolName.trim() || undefined,
      weekdayMinutes: form.weekdayMinutes,
      weekendMinutes: form.weekendMinutes,
      availableMinutesPerDay: Math.round(
        (form.weekdayMinutes * 5 + form.weekendMinutes * 2) / 7,
      ),
      // 既存フィールド互換
      target:
        form.targetUniversities[0]
          ? form.targetUniversities[0].universityId
          : existing?.target ?? "private-top",
      examDate: existing?.examDate ?? defaultExamDate(form.grade),
      textbooks: existing?.textbooks ?? [],
      onboardedAt: new Date().toISOString(),
    };
    setProfile(profile);
    router.push("/app");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-cream-50">
      {/* Header / progress */}
      <header className="sticky top-0 z-10 border-b border-cream-200 bg-cream-50/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={prev}
            disabled={stepIdx === 0}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full",
              stepIdx === 0
                ? "text-ink-300"
                : "text-ink-700 hover:bg-cream-100",
            )}
            aria-label="戻る"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-xs font-bold text-ink-500 tabular-nums">
            {stepIdx + 1} / {STEPS.length}
          </span>
          <Link
            href="/"
            className="text-xs font-bold text-ink-400"
          >
            やめる
          </Link>
        </div>
        <div className="mt-3 flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= stepIdx ? "bg-sky-500" : "bg-cream-200",
              )}
            />
          ))}
        </div>
      </header>

      <main className="flex-1 px-5 pt-6 pb-32">
        {stepId === "grade" ? (
          <GradeStep value={form.grade} onChange={(v) => update("grade", v)} />
        ) : null}
        {stepId === "deviation" ? (
          <DeviationStep
            value={form.deviation}
            onChange={(v) => update("deviation", v)}
          />
        ) : null}
        {stepId === "target" ? (
          <TargetStep
            value={form.targetUniversities}
            deviation={form.deviation}
            onChange={(v) => update("targetUniversities", v)}
          />
        ) : null}
        {stepId === "school" ? (
          <SchoolStep
            value={form.schoolName}
            onChange={(v) => update("schoolName", v)}
          />
        ) : null}
        {stepId === "time" ? (
          <TimeStep
            weekday={form.weekdayMinutes}
            weekend={form.weekendMinutes}
            onChangeWeekday={(v) => update("weekdayMinutes", v)}
            onChangeWeekend={(v) => update("weekendMinutes", v)}
          />
        ) : null}
      </main>

      <footer className="sticky bottom-0 z-10 border-t border-cream-200 bg-cream-50/95 px-5 py-4 backdrop-blur">
        <button
          type="button"
          onClick={next}
          disabled={!canProceed()}
          className={cn(
            "flex h-14 w-full items-center justify-center gap-1 rounded-2xl text-base font-black text-white shadow-soft transition active:scale-[0.98]",
            canProceed() ? "bg-sky-500" : "bg-ink-300",
          )}
        >
          {stepIdx < STEPS.length - 1 ? (
            <>
              次へ
              <ChevronRight className="h-5 w-5" />
            </>
          ) : (
            "はじめる"
          )}
        </button>
      </footer>
    </div>
  );
}

function StepTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="text-[24px] font-black leading-tight text-ink-900">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2 text-sm text-ink-600">{subtitle}</p>
      ) : null}
    </div>
  );
}

function GradeStep({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <>
      <StepTitle
        title="学年を教えて"
        subtitle="学年に合った単元・参考書ルートを準備します。"
      />
      <div className="grid gap-2.5">
        {GRADES.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => onChange(g.id)}
            className={cn(
              "flex items-center justify-between rounded-2xl border-2 p-4 text-left transition",
              value === g.id
                ? "border-sky-500 bg-sky-50"
                : "border-cream-200 bg-white hover:bg-cream-50",
            )}
          >
            <span className="text-base font-black text-ink-900">{g.name}</span>
            {value === g.id ? (
              <span className="h-3 w-3 rounded-full bg-sky-500" />
            ) : (
              <span className="h-3 w-3 rounded-full bg-cream-200" />
            )}
          </button>
        ))}
      </div>
    </>
  );
}

function DeviationStep({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const label =
    value >= 70
      ? "最難関レベル"
      : value >= 65
      ? "難関レベル"
      : value >= 60
      ? "準難関レベル"
      : value >= 55
      ? "中堅上位レベル"
      : value >= 50
      ? "中堅レベル"
      : value >= 45
      ? "標準レベル"
      : "これから伸ばすレベル";

  return (
    <>
      <StepTitle
        title="今の偏差値はどのくらい？"
        subtitle="おおよそでOK。複数科目なら平均で。"
      />
      <div className="rounded-3xl border border-cream-200 bg-white p-6 shadow-soft">
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-6xl font-black tabular-nums text-ink-900">
            {value}
          </span>
          <span className="text-base font-bold text-ink-500">前後</span>
        </div>
        <div className="mt-2 text-center text-xs font-bold text-sky-600">
          {label}
        </div>
        <input
          type="range"
          min={30}
          max={75}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="mt-6 w-full accent-sky-500"
        />
        <div className="mt-2 flex justify-between text-[10px] font-bold text-ink-400 tabular-nums">
          <span>30</span>
          <span>50</span>
          <span>75</span>
        </div>
      </div>
      <p className="mt-4 text-center text-[11px] text-ink-500">
        正確じゃなくて大丈夫。後で模試結果を入れたら自動で調整します。
      </p>
    </>
  );
}

function TargetStep({
  value,
  deviation,
  onChange,
}: {
  value: TargetUniversity[];
  deviation: number;
  onChange: (v: TargetUniversity[]) => void;
}) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const all = searchUniversities(query);
    // ソート：偏差値差が小さい順、tier S→A→B→C→D
    const tierWeight: Record<University["tier"], number> = {
      S: 0,
      A: 1,
      B: 2,
      C: 3,
      D: 4,
    };
    return [...all]
      .map((u) => {
        const minDev = Math.min(...u.faculties.map((f) => f.deviation));
        const maxDev = Math.max(...u.faculties.map((f) => f.deviation));
        const dist = Math.max(0, minDev - deviation);
        return { u, minDev, maxDev, dist };
      })
      .sort((a, b) => {
        // 既選択は下位、tier優先、偏差値距離
        const selA = value.some((v) => v.universityId === a.u.id) ? 1 : 0;
        const selB = value.some((v) => v.universityId === b.u.id) ? 1 : 0;
        if (selA !== selB) return selA - selB;
        if (a.u.tier !== b.u.tier) {
          return tierWeight[a.u.tier] - tierWeight[b.u.tier];
        }
        return a.dist - b.dist;
      })
      .slice(0, 30);
  }, [query, deviation, value]);

  function toggle(uniId: string) {
    if (value.some((v) => v.universityId === uniId)) {
      onChange(value.filter((v) => v.universityId !== uniId));
    } else if (value.length < 3) {
      onChange([
        ...value,
        {
          universityId: uniId,
          priority: (value.length + 1) as 1 | 2 | 3,
        },
      ]);
    }
  }

  function remove(uniId: string) {
    const filtered = value
      .filter((v) => v.universityId !== uniId)
      .map((v, i) => ({ ...v, priority: (i + 1) as 1 | 2 | 3 }));
    onChange(filtered);
  }

  return (
    <>
      <StepTitle
        title="志望校を3つまで"
        subtitle="第1〜第3志望。後から変えてOK。"
      />

      {/* Selected */}
      {value.length > 0 ? (
        <ul className="mb-4 space-y-2">
          {value.map((tu, i) => {
            const u = searchUniversities("").find(
              (x) => x.id === tu.universityId,
            );
            if (!u) return null;
            return (
              <li
                key={tu.universityId}
                className="flex items-center gap-3 rounded-2xl border-2 border-sky-300 bg-sky-50 p-3"
              >
                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-sky-500 text-xs font-black text-white">
                  第{i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-black text-ink-900">
                    {u.name}
                  </div>
                  <div className="text-[10px] text-ink-500">
                    {TIER_LABEL[u.tier]} · {u.region}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => remove(tu.universityId)}
                  className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-ink-400 hover:bg-white"
                  aria-label="外す"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="大学名や地域を検索"
          className="h-11 w-full rounded-2xl border border-cream-200 bg-white pl-9 pr-3 text-sm text-ink-900 outline-none focus:border-sky-400"
        />
      </div>

      {/* Results */}
      <ul className="mt-3 space-y-1.5">
        {results.map(({ u, minDev, maxDev }) => {
          const selected = value.some((v) => v.universityId === u.id);
          const disabled = !selected && value.length >= 3;
          const reach =
            minDev > deviation + 5
              ? "挑戦"
              : minDev > deviation
              ? "やや上"
              : minDev > deviation - 5
              ? "適正"
              : "安全";
          const reachTone =
            reach === "挑戦"
              ? "bg-coral-300 text-white"
              : reach === "やや上"
              ? "bg-sun-300 text-ink-900"
              : reach === "適正"
              ? "bg-sky-100 text-sky-700"
              : "bg-mint-100 text-mint-600";
          return (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => toggle(u.id)}
                disabled={disabled}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl p-3 text-left transition",
                  selected
                    ? "bg-sky-100 text-sky-700"
                    : disabled
                    ? "bg-cream-50 text-ink-300"
                    : "bg-white text-ink-900 hover:bg-cream-50",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-black">{u.name}</div>
                  <div className="text-[10px] text-ink-500">
                    {TIER_LABEL[u.tier]} · 偏差値 {minDev}-{maxDev} · {u.region}
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold flex-none",
                    reachTone,
                  )}
                >
                  {reach}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function SchoolStep({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <>
      <StepTitle
        title="通っている学校"
        subtitle="任意。同じ学校の人と比較するのに使います。"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="例：◯◯高校"
        className="h-12 w-full rounded-2xl border border-cream-200 bg-white px-4 text-base text-ink-900 outline-none focus:border-sky-400"
      />
      <p className="mt-3 text-[11px] text-ink-500">
        空欄でも構いません。
      </p>
    </>
  );
}

function TimeStep({
  weekday,
  weekend,
  onChangeWeekday,
  onChangeWeekend,
}: {
  weekday: number;
  weekend: number;
  onChangeWeekday: (v: number) => void;
  onChangeWeekend: (v: number) => void;
}) {
  return (
    <>
      <StepTitle
        title="1日の勉強時間"
        subtitle="平均でOK。AIが現実的な計画を組みます。"
      />

      <Slider
        label="平日"
        value={weekday}
        onChange={onChangeWeekday}
        min={0}
        max={600}
      />
      <div className="mt-4" />
      <Slider
        label="休日"
        value={weekend}
        onChange={onChangeWeekend}
        min={0}
        max={720}
      />
    </>
  );
}

function Slider({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  const hours = Math.floor(value / 60);
  const mins = value % 60;
  return (
    <div className="rounded-3xl border border-cream-200 bg-white p-5 shadow-soft">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-black text-ink-900">{label}</span>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black tabular-nums text-ink-900">
            {hours}
          </span>
          <span className="text-xs font-bold text-ink-500">h</span>
          {mins > 0 ? (
            <>
              <span className="ml-1 text-2xl font-black tabular-nums text-ink-900">
                {mins}
              </span>
              <span className="text-xs font-bold text-ink-500">m</span>
            </>
          ) : null}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={15}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full accent-sky-500"
      />
      <div className="mt-1 flex justify-between text-[10px] font-bold text-ink-400 tabular-nums">
        <span>0</span>
        <span>{Math.round(max / 60)}h</span>
      </div>
    </div>
  );
}
