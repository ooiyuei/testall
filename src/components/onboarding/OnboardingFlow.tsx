"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { GRADES } from "@/lib/subjects";
import {
  TIER_LABEL,
  UNIVERSITIES as MASTER_UNIVERSITIES,
} from "@/lib/master/universities";
import { searchHighschools } from "@/lib/master/highschools";
import { remoteEnabled, remoteSearchHighschools } from "@/lib/master/remote";
import { mergedHighschools, mergedUniversities } from "@/lib/master/userAdditions";
import type { Highschool, University } from "@/lib/master";
import {
  DEVIATION_BUCKETS,
  bucketMid,
  readStore,
  setProfile,
} from "@/lib/store";
import type {
  DeviationBucket,
  StoredProfile,
  SubjectAreaId,
  TargetUniversity,
} from "@/lib/store";
import { AddEntityModal, type AddEntityKind } from "@/components/master/AddEntityModal";

// ── ステップ定義 ──────────────────────────────────────
const STEPS = [
  { id: "grade" },
  { id: "school" },
  { id: "deviation" },
  { id: "target-dev" },
  { id: "univ-types" },
  { id: "target-unis" },
  { id: "study-time" },
  { id: "schedule" },
  { id: "weekend" },
  { id: "strengths" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

// ── 5大教科 ──────────────────────────────────────────
const SUBJECT_AREAS: { id: SubjectAreaId; label: string }[] = [
  { id: "japanese", label: "国語" },
  { id: "math", label: "数学" },
  { id: "english", label: "英語" },
  { id: "science", label: "理科" },
  { id: "social", label: "社会" },
];

// ── 学部カテゴリ ───────────────────────────────────────
const FACULTY_CATEGORIES = [
  { id: "letters", label: "文" },
  { id: "law", label: "法" },
  { id: "economics", label: "経済経営" },
  { id: "science", label: "理" },
  { id: "engineering", label: "工" },
  { id: "medical", label: "医療" },
  { id: "agriculture", label: "農" },
  { id: "info", label: "情報" },
  { id: "education", label: "教育" },
  { id: "other", label: "その他" },
];

// ── 勉強時間 ─────────────────────────────────────────
const WEEKDAY_OPTIONS = [
  { label: "〜1h", minutes: 45 },
  { label: "1〜2h", minutes: 90 },
  { label: "2〜3h", minutes: 150 },
  { label: "3〜4h", minutes: 210 },
  { label: "4h〜", minutes: 270 },
];

const WEEKEND_OPTIONS = [
  { label: "〜2h", minutes: 60 },
  { label: "2〜4h", minutes: 180 },
  { label: "4〜6h", minutes: 300 },
  { label: "6〜8h", minutes: 420 },
  { label: "8h〜", minutes: 540 },
];

// ── 時刻ヘルパー ─────────────────────────────────────
function minutesToTime(totalMin: number): string {
  const h = Math.floor(totalMin / 60) % 24;
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function makeTimeOptions(startMin: number, endMin: number, stepMin = 30): string[] {
  const opts: string[] = [];
  for (let m = startMin; m <= endMin; m += stepMin) {
    opts.push(minutesToTime(m));
  }
  return opts;
}

const WAKEUP_OPTIONS = makeTimeOptions(5 * 60, 10 * 60);    // 5:00〜10:00
const RETURN_OPTIONS = makeTimeOptions(14 * 60, 23 * 60);   // 14:00〜23:00
const BED_OPTIONS = makeTimeOptions(20 * 60, 26 * 60);      // 20:00〜26:00 (26:00=翌2:00)

// ── フォームステート ──────────────────────────────────
type FormState = {
  // step1: grade
  grade: string;
  // step2: school
  schoolName: string;
  // step3: deviation
  deviationBucket: DeviationBucket;
  deviationByArea: Partial<Record<SubjectAreaId, DeviationBucket>>;
  // step4: target-dev
  targetDeviationBucket: DeviationBucket;
  // step5: univ-types
  universityTypes: ("national" | "public" | "private")[];
  interestedFacultyCategories: string[];
  // step6: target-unis
  targetUniversities: TargetUniversity[];
  // step7: study-time
  weekdayMinutes: number;
  weekendMinutes: number;
  // step8: schedule
  wakeupTime: string;
  returnTime: string;
  bedTime: string;
  // step9: weekend
  weekendDays: ("sat" | "sat-half" | "sun" | "sun-half")[];
  // step10: strengths
  proficiencyByArea: Partial<Record<SubjectAreaId, "good" | "fair" | "weak" | "bad">>;
};

function defaultExamDate(grade: string): string {
  const now = new Date();
  let year = now.getFullYear();
  if (grade === "h1") year += 3;
  else if (grade === "h2") year += 2;
  else year += 1;
  return `${year}-01-15`;
}

// ── メインコンポーネント ─────────────────────────────
export function OnboardingFlow() {
  const router = useRouter();
  const [stepIdx, setStepIdx] = useState(0);
  const [addModal, setAddModal] = useState<AddEntityKind | null>(null);

  const [form, setForm] = useState<FormState>(() => {
    const existing = readStore().profile;
    return {
      grade: existing?.grade ?? "h2",
      schoolName: existing?.schoolName ?? "",
      deviationBucket: existing?.deviationBucket ?? "55-60",
      deviationByArea: existing?.deviationByArea ?? {},
      targetDeviationBucket: existing?.targetDeviationBucket ?? "65-70",
      universityTypes: existing?.universityTypes ?? [],
      interestedFacultyCategories: existing?.interestedFacultyCategories ?? [],
      targetUniversities: existing?.targetUniversities ?? [],
      weekdayMinutes: existing?.weekdayMinutes ?? 120,
      weekendMinutes: existing?.weekendMinutes ?? 240,
      wakeupTime: existing?.wakeupTime ?? "07:00",
      returnTime: existing?.returnTime ?? "18:00",
      bedTime: existing?.bedTime ?? "23:00",
      weekendDays: existing?.weekendDays ?? [],
      proficiencyByArea: existing?.proficiencyByArea ?? {},
    };
  });

  const stepId = STEPS[stepIdx].id as StepId;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function canProceed(): boolean {
    if (stepId === "grade") return !!form.grade;
    if (stepId === "school") return true;
    if (stepId === "deviation") return !!form.deviationBucket;
    if (stepId === "target-dev") return !!form.targetDeviationBucket;
    if (stepId === "univ-types") return true;
    if (stepId === "target-unis") return true;
    if (stepId === "study-time") return form.weekdayMinutes > 0 && form.weekendMinutes > 0;
    if (stepId === "schedule") return true;
    if (stepId === "weekend") return true;
    if (stepId === "strengths") return true;
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
      schoolName: form.schoolName.trim() || undefined,
      deviationBucket: form.deviationBucket,
      deviation: bucketMid(form.deviationBucket),
      deviationByArea: Object.keys(form.deviationByArea).length > 0
        ? form.deviationByArea
        : undefined,
      targetDeviationBucket: form.targetDeviationBucket,
      universityTypes: form.universityTypes.length > 0 ? form.universityTypes : undefined,
      interestedFacultyCategories: form.interestedFacultyCategories.length > 0
        ? form.interestedFacultyCategories
        : undefined,
      targetUniversities: form.targetUniversities,
      weekdayMinutes: form.weekdayMinutes,
      weekendMinutes: form.weekendMinutes,
      availableMinutesPerDay: Math.round(
        (form.weekdayMinutes * 5 + form.weekendMinutes * 2) / 7,
      ),
      wakeupTime: form.wakeupTime,
      returnTime: form.returnTime,
      bedTime: form.bedTime,
      weekendDays: form.weekendDays.length > 0 ? form.weekendDays : undefined,
      proficiencyByArea: Object.keys(form.proficiencyByArea).length > 0
        ? form.proficiencyByArea
        : undefined,
      target:
        form.targetUniversities[0]
          ? form.targetUniversities[0].universityId
          : existing?.target ?? "private-top",
      examDate: existing?.examDate ?? defaultExamDate(form.grade),
      textbooks: existing?.textbooks ?? [],
      userId:
        existing?.userId ?? String(10000 + Math.floor(Math.random() * 90000)),
      onboardedAt: new Date().toISOString(),
    };
    setProfile(profile);
    router.push("/app");
  }

  function handleSkip() {
    const existing = readStore().profile;
    setProfile({
      ...(existing ?? {}),
      grade: form.grade,
      target: existing?.target ?? "private-top",
      examDate: existing?.examDate ?? defaultExamDate(form.grade),
      textbooks: existing?.textbooks ?? [],
      onboardedAt: existing?.onboardedAt ?? new Date().toISOString(),
      userId:
        existing?.userId ??
        String(10000 + Math.floor(Math.random() * 90000)),
    } as StoredProfile);
    router.push("/app");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-cream-50">
      <header className="sticky top-0 z-10 border-b border-ink-100/60 bg-cream-50/85 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={prev}
            disabled={stepIdx === 0}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full",
              stepIdx === 0 ? "text-ink-300" : "text-ink-700 hover:bg-cream-100",
            )}
            aria-label="戻る"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-xs font-bold text-ink-500 tabular-nums">
            {stepIdx + 1} / {STEPS.length}
          </span>
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-bold text-ink-400 hover:text-ink-700"
          >
            スキップ
          </button>
        </div>
        <div className="mt-3 flex gap-1">
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
        {stepId === "grade" && (
          <GradeStep value={form.grade} onChange={(v) => update("grade", v)} />
        )}
        {stepId === "school" && (
          <SchoolStep
            value={form.schoolName}
            onChange={(v) => update("schoolName", v)}
            onAdd={() => setAddModal("highschool")}
          />
        )}
        {stepId === "deviation" && (
          <DeviationStep
            current={form.deviationBucket}
            byArea={form.deviationByArea}
            onChangeCurrent={(v) => update("deviationBucket", v)}
            onChangeByArea={(v) => update("deviationByArea", v)}
          />
        )}
        {stepId === "target-dev" && (
          <TargetDevStep
            value={form.targetDeviationBucket}
            onChange={(v) => update("targetDeviationBucket", v)}
          />
        )}
        {stepId === "univ-types" && (
          <UnivTypesStep
            types={form.universityTypes}
            faculties={form.interestedFacultyCategories}
            onChangeTypes={(v) => update("universityTypes", v)}
            onChangeFaculties={(v) => update("interestedFacultyCategories", v)}
          />
        )}
        {stepId === "target-unis" && (
          <TargetUnisStep
            value={form.targetUniversities}
            deviation={bucketMid(form.deviationBucket)}
            univTypes={form.universityTypes}
            onChange={(v) => update("targetUniversities", v)}
            onAdd={() => setAddModal("university")}
          />
        )}
        {stepId === "study-time" && (
          <StudyTimeStep
            weekday={form.weekdayMinutes}
            weekend={form.weekendMinutes}
            onChangeWeekday={(v) => update("weekdayMinutes", v)}
            onChangeWeekend={(v) => update("weekendMinutes", v)}
          />
        )}
        {stepId === "schedule" && (
          <ScheduleStep
            wakeup={form.wakeupTime}
            returnT={form.returnTime}
            bed={form.bedTime}
            onChangeWakeup={(v) => update("wakeupTime", v)}
            onChangeReturn={(v) => update("returnTime", v)}
            onChangeBed={(v) => update("bedTime", v)}
          />
        )}
        {stepId === "weekend" && (
          <WeekendStep
            value={form.weekendDays}
            onChange={(v) => update("weekendDays", v)}
          />
        )}
        {stepId === "strengths" && (
          <StrengthsStep
            value={form.proficiencyByArea}
            onChange={(v) => update("proficiencyByArea", v)}
          />
        )}
      </main>

      <footer className="sticky bottom-0 z-10 border-t border-ink-100/60 bg-cream-50/85 px-5 py-4 backdrop-blur-xl">
        <button
          type="button"
          onClick={next}
          disabled={!canProceed()}
          className={cn(
            "flex h-12 w-full items-center justify-center gap-1 rounded-xl text-[14px] font-bold text-white transition active:scale-[0.98]",
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

      {addModal ? (
        <AddEntityModal kind={addModal} onClose={() => setAddModal(null)} />
      ) : null}
    </div>
  );
}

// ── 共通パーツ ───────────────────────────────────────

function StepTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-[22px] font-bold leading-tight tracking-tight text-ink-900">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2 text-sm leading-relaxed text-ink-600">{subtitle}</p>
      ) : null}
    </div>
  );
}

function BucketPicker({
  label,
  value,
  onChange,
  tone = "sky",
}: {
  label: string;
  value: DeviationBucket;
  onChange: (v: DeviationBucket) => void;
  tone?: "sky" | "peach";
}) {
  // 5刻みスライダー版: DEVIATION_BUCKETS の index を扱う
  const idx = Math.max(0, DEVIATION_BUCKETS.findIndex((b) => b.id === value));
  const current = DEVIATION_BUCKETS[idx];
  const max = DEVIATION_BUCKETS.length - 1;
  const accentClass = tone === "sky" ? "accent-sky-500" : "accent-peach-400";
  return (
    <div className="rounded-2xl border border-ink-100/80 bg-white p-4">
      <div className="flex items-baseline justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
          {label}
        </div>
        <div className="flex items-baseline gap-1">
          <span className={cn(
            "text-3xl font-bold tabular-nums",
            tone === "sky" ? "text-sky-500" : "text-peach-400",
          )}>
            {current.label}
          </span>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={idx}
        onChange={(e) => onChange(DEVIATION_BUCKETS[Number(e.target.value)].id)}
        className={cn("mt-3 w-full", accentClass)}
        aria-label={label}
      />
      <div className="mt-1 flex justify-between text-[9px] font-bold text-ink-400 tabular-nums">
        <span>~45</span>
        <span>50</span>
        <span>55</span>
        <span>60</span>
        <span>65</span>
        <span>70</span>
        <span>75~</span>
      </div>
    </div>
  );
}

function SegmentPicker<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="rounded-3xl border border-cream-200 bg-white p-4 shadow-soft">
      {label ? (
        <div className="mb-3 text-sm font-bold text-ink-700">{label}</div>
      ) : null}
      <div className="flex gap-1 rounded-xl bg-cream-100 p-1">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={cn(
              "flex-1 rounded-lg py-2 text-xs font-bold transition",
              value === o.id
                ? "bg-white text-sky-600 shadow-soft"
                : "text-ink-500 hover:text-ink-700",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Step 1: 学年 ─────────────────────────────────────

function GradeStep({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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
            <span
              className={cn(
                "h-3 w-3 rounded-full",
                value === g.id ? "bg-sky-500" : "bg-cream-200",
              )}
            />
          </button>
        ))}
      </div>
    </>
  );
}

// ── Step 2: 高校 ─────────────────────────────────────

function SchoolStep({
  value,
  onChange,
  onAdd,
}: {
  value: string;
  onChange: (v: string) => void;
  onAdd: () => void;
}) {
  const [query, setQuery] = useState(value);
  const [remoteResults, setRemoteResults] = useState<Highschool[]>([]);
  const useRemote = remoteEnabled();

  // ローカル即時検索
  const localResults = useMemo((): Highschool[] => {
    if (!query.trim()) return [];
    const base = searchHighschools(query.trim(), 30);
    const merged = mergedHighschools([]);
    const userAdded = merged.filter((h) =>
      h.searchText?.includes(query.toLowerCase()),
    );
    return [...userAdded, ...base];
  }, [query]);

  // Supabase に問い合わせ (300ms debounce)
  useEffect(() => {
    if (!useRemote) return;
    const q = query.trim();
    if (!q) {
      setRemoteResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const rs = await remoteSearchHighschools(q, 30);
      setRemoteResults(rs);
    }, 300);
    return () => clearTimeout(t);
  }, [query, useRemote]);

  // 統合 (id 重複除去)
  const results = useMemo<Highschool[]>(() => {
    const seen = new Set<string>();
    const merged: Highschool[] = [];
    for (const h of [...localResults, ...remoteResults]) {
      if (seen.has(h.id)) continue;
      seen.add(h.id);
      merged.push(h);
    }
    return merged.slice(0, 30);
  }, [localResults, remoteResults]);

  function pick(name: string) {
    onChange(name);
    setQuery(name);
  }

  return (
    <>
      <StepTitle
        title="通っている学校"
        subtitle="任意。同じ学校の人と比較するのに使います。"
      />
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
          }}
          placeholder="高校名を検索（例：日比谷）"
          className="h-12 w-full rounded-2xl border border-cream-200 bg-white pl-9 pr-3 text-base text-ink-900 outline-none focus:border-sky-400"
        />
      </div>

      {results.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {results.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => pick(h.name)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl p-3 text-left transition",
                  value === h.name
                    ? "bg-sky-100 text-sky-700"
                    : "bg-white text-ink-900 hover:bg-cream-50",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-black">{h.name}</div>
                  <div className="text-[10px] text-ink-500">
                    {h.prefecture}
                    {h.city ? ` · ${h.city}` : ""} ·{" "}
                    {h.type === "private" ? "私立" : h.type === "national" ? "国立" : "公立"}
                    {h.deviation ? ` · 偏差値 ${h.deviation}` : ""}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {query.trim() && results.length === 0 ? (
        <button
          type="button"
          onClick={onAdd}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-cream-200 bg-white p-4 text-xs text-ink-500 hover:border-sky-300 hover:bg-sky-50"
        >
          <Plus className="h-3.5 w-3.5" />「{query}」が見つからない — 追加する
        </button>
      ) : null}

      <p className="mt-3 text-[11px] text-ink-500">
        空欄でも構いません。後から設定で変えられます。
      </p>
    </>
  );
}

// ── Step 3: 現在の偏差値 ────────────────────────────

function DeviationStep({
  current,
  byArea,
  onChangeCurrent,
  onChangeByArea,
}: {
  current: DeviationBucket;
  byArea: Partial<Record<SubjectAreaId, DeviationBucket>>;
  onChangeCurrent: (v: DeviationBucket) => void;
  onChangeByArea: (v: Partial<Record<SubjectAreaId, DeviationBucket>>) => void;
}) {
  function setArea(id: SubjectAreaId, val: DeviationBucket | undefined) {
    if (val === undefined) {
      const next = { ...byArea };
      delete next[id];
      onChangeByArea(next);
    } else {
      onChangeByArea({ ...byArea, [id]: val });
    }
  }

  return (
    <>
      <StepTitle
        title="今の偏差値は？"
        subtitle="おおよその帯でOK。後で模試結果から自動補正されます。"
      />

      <BucketPicker
        label="平均偏差値"
        value={current}
        onChange={onChangeCurrent}
        tone="sky"
      />

      <div className="mt-5">
        <p className="mb-3 text-xs font-bold text-ink-500">
          教科ごとに違う場合は任意で設定（空欄なら平均値を使います）
        </p>
        <div className="space-y-3">
          {SUBJECT_AREAS.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl border border-cream-200 bg-white p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-bold text-ink-700">{s.label}</span>
                {byArea[s.id] ? (
                  <button
                    type="button"
                    onClick={() => setArea(s.id, undefined)}
                    className="text-[10px] text-ink-400 hover:text-ink-600"
                  >
                    クリア
                  </button>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DEVIATION_BUCKETS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setArea(s.id, b.id)}
                    className={cn(
                      "rounded-lg px-2.5 py-1.5 text-xs font-bold transition",
                      byArea[s.id] === b.id
                        ? "bg-sky-500 text-white"
                        : "bg-cream-50 text-ink-600 hover:bg-cream-100",
                    )}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Step 4: 目指す偏差値 ────────────────────────────

function TargetDevStep({
  value,
  onChange,
}: {
  value: DeviationBucket;
  onChange: (v: DeviationBucket) => void;
}) {
  return (
    <>
      <StepTitle
        title="目指す偏差値は？"
        subtitle="志望校の合格ラインに必要な偏差値を選んでください。"
      />
      <BucketPicker
        label="目標偏差値"
        value={value}
        onChange={onChange}
        tone="peach"
      />
      <p className="mt-4 text-[11px] text-ink-500">
        ※ 偏差値は模試ごとに意味が変わるため、内部では帯の中央値で扱います。
      </p>
    </>
  );
}

// ── Step 5: 大学タイプ ───────────────────────────────

function UnivTypesStep({
  types,
  faculties,
  onChangeTypes,
  onChangeFaculties,
}: {
  types: ("national" | "public" | "private")[];
  faculties: string[];
  onChangeTypes: (v: ("national" | "public" | "private")[]) => void;
  onChangeFaculties: (v: string[]) => void;
}) {
  function toggleType(id: "national" | "public" | "private") {
    if (types.includes(id)) {
      onChangeTypes(types.filter((t) => t !== id));
    } else {
      onChangeTypes([...types, id]);
    }
  }

  function toggleFaculty(id: string) {
    if (faculties.includes(id)) {
      onChangeFaculties(faculties.filter((f) => f !== id));
    } else {
      onChangeFaculties([...faculties, id]);
    }
  }

  const typeOptions = [
    { id: "national" as const, label: "国立" },
    { id: "public" as const, label: "公立" },
    { id: "private" as const, label: "私立" },
  ];

  return (
    <>
      <StepTitle
        title="志望校のタイプ"
        subtitle="複数選択OK。絞り込みに使います。"
      />

      <div className="mb-5 rounded-3xl border border-cream-200 bg-white p-4 shadow-soft">
        <div className="mb-3 text-[11px] font-bold uppercase tracking-widest text-ink-500">
          大学タイプ
        </div>
        <div className="flex gap-2">
          {typeOptions.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => toggleType(o.id)}
              className={cn(
                "flex-1 rounded-xl py-3 text-sm font-bold transition",
                types.includes(o.id)
                  ? "bg-sky-500 text-white shadow-soft"
                  : "bg-cream-50 text-ink-600 hover:bg-cream-100",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-cream-200 bg-white p-4 shadow-soft">
        <div className="mb-3 text-[11px] font-bold uppercase tracking-widest text-ink-500">
          興味のある学部
        </div>
        <div className="flex flex-wrap gap-2">
          {FACULTY_CATEGORIES.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => toggleFaculty(f.id)}
              className={cn(
                "rounded-xl px-3 py-2 text-sm font-bold transition",
                faculties.includes(f.id)
                  ? "bg-sky-500 text-white shadow-soft"
                  : "bg-cream-50 text-ink-600 hover:bg-cream-100",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-[11px] text-ink-500">
        どれも選ばなくてもOKです。後から変えられます。
      </p>
    </>
  );
}

// ── Step 6: 志望校選択 ───────────────────────────────

function facultyDevRange(u: University): { min: number; max: number } | null {
  const devs = u.faculties
    .map((f) => f.deviation)
    .filter((v): v is number => typeof v === "number");
  if (devs.length === 0) return null;
  return { min: Math.min(...devs), max: Math.max(...devs) };
}

function TargetUnisStep({
  value,
  deviation,
  univTypes,
  onChange,
  onAdd,
}: {
  value: TargetUniversity[];
  deviation: number;
  univTypes: ("national" | "public" | "private")[];
  onChange: (v: TargetUniversity[]) => void;
  onAdd: () => void;
}) {
  const [query, setQuery] = useState("");

  const allMerged = useMemo(() => mergedUniversities(MASTER_UNIVERSITIES), []);

  // 検索結果 (クエリあり時)
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const filtered = allMerged.filter((u) => u.searchText?.includes(query.toLowerCase()));
    return filtered
      .map((u) => ({ u, range: facultyDevRange(u) }))
      .slice(0, 30);
  }, [query, allMerged]);

  // おすすめ 6 個 (挑戦2 / やや上2 / 適正2) - 偏差値を基準に各カテゴリから抽出
  const recommendations = useMemo(() => {
    const byTypes =
      univTypes.length > 0
        ? allMerged.filter((u) => univTypes.includes(u.type))
        : allMerged;
    type Candidate = { u: University; minDev: number; range: ReturnType<typeof facultyDevRange> };
    const candidates = byTypes
      .map((u): Candidate | null => {
        const range = facultyDevRange(u);
        if (!range) return null;
        return { u, minDev: range.min, range };
      })
      .filter((x): x is Candidate => x !== null);

    // 各カテゴリの偏差値レンジ
    function pickN(filter: (c: Candidate) => boolean, n: number): Candidate[] {
      return candidates
        .filter(filter)
        .sort((a, b) => Math.abs(a.minDev - deviation) - Math.abs(b.minDev - deviation))
        .slice(0, n);
    }

    const challenge = pickN(
      (c) => c.minDev > deviation + 5 && c.minDev <= deviation + 12,
      2,
    );
    const above = pickN((c) => c.minDev > deviation && c.minDev <= deviation + 5, 2);
    const fit = pickN((c) => c.minDev > deviation - 5 && c.minDev <= deviation, 2);

    const seen = new Set<string>();
    const merged: { c: Candidate; label: "挑戦" | "やや上" | "適正" }[] = [];
    for (const c of challenge) {
      if (!seen.has(c.u.id)) { merged.push({ c, label: "挑戦" }); seen.add(c.u.id); }
    }
    for (const c of above) {
      if (!seen.has(c.u.id)) { merged.push({ c, label: "やや上" }); seen.add(c.u.id); }
    }
    for (const c of fit) {
      if (!seen.has(c.u.id)) { merged.push({ c, label: "適正" }); seen.add(c.u.id); }
    }
    return merged;
  }, [allMerged, univTypes, deviation]);

  const results = query.trim()
    ? searchResults.map((r) => ({ u: r.u, minDev: r.range?.min ?? 50, range: r.range }))
    : recommendations.map((r) => ({ u: r.c.u, minDev: r.c.minDev, range: r.c.range, recLabel: r.label }));

  function toggle(uniId: string) {
    if (value.some((v) => v.universityId === uniId)) {
      onChange(value.filter((v) => v.universityId !== uniId));
    } else if (value.length < 3) {
      onChange([
        ...value,
        { universityId: uniId, priority: (value.length + 1) as 1 | 2 | 3 },
      ]);
    }
  }

  function remove(uniId: string) {
    const filtered = value
      .filter((v) => v.universityId !== uniId)
      .map((v, i) => ({ ...v, priority: (i + 1) as 1 | 2 | 3 }));
    onChange(filtered);
  }

  const empty = query.trim() && results.length === 0;

  return (
    <>
      <StepTitle
        title="志望校を3つまで"
        subtitle="第1〜第3志望。後から変えてOK。"
      />

      {value.length > 0 ? (
        <ul className="mb-4 space-y-2">
          {value.map((tu, i) => {
            const u = allMerged.find((x) => x.id === tu.universityId);
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
                  <div className="text-sm font-black text-ink-900">{u.name}</div>
                  <div className="text-[10px] text-ink-500">
                    {u.tier ? `${TIER_LABEL[u.tier]} · ` : ""}
                    {u.region}
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="大学名や略称を検索"
          className="h-11 w-full rounded-2xl border border-cream-200 bg-white pl-9 pr-3 text-sm text-ink-900 outline-none focus:border-sky-400"
        />
      </div>

      <ul className="mt-3 space-y-1.5">
        {results.map(({ u, minDev, range }) => {
          const selected = value.some((v) => v.universityId === u.id);
          const disabled = !selected && value.length >= 3;
          const reach = range
            ? minDev > deviation + 5
              ? "挑戦"
              : minDev > deviation
              ? "やや上"
              : minDev > deviation - 5
              ? "適正"
              : "安全"
            : "—";
          const reachTone =
            reach === "挑戦"
              ? "bg-coral-300 text-white"
              : reach === "やや上"
              ? "bg-sun-300 text-ink-900"
              : reach === "適正"
              ? "bg-sky-100 text-sky-700"
              : reach === "安全"
              ? "bg-mint-100 text-mint-600"
              : "bg-cream-100 text-ink-500";
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
                    {u.tier ? `${TIER_LABEL[u.tier]} · ` : ""}
                    {range ? `偏差値 ${range.min}-${range.max} · ` : ""}
                    {u.region}
                  </div>
                </div>
                <span
                  className={cn(
                    "flex-none rounded-full px-2 py-0.5 text-[10px] font-bold",
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

      {empty ? (
        <button
          type="button"
          onClick={onAdd}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-cream-200 bg-white p-4 text-xs text-ink-500 hover:border-sky-300 hover:bg-sky-50"
        >
          <Plus className="h-3.5 w-3.5" />
          見つからない場合は手動で追加
        </button>
      ) : (
        <button
          type="button"
          onClick={onAdd}
          className="mt-3 flex w-full items-center justify-center gap-1 text-xs font-bold text-ink-500"
        >
          <Plus className="h-3 w-3" />
          一覧にない大学を追加する
        </button>
      )}
    </>
  );
}

// ── Step 7: 勉強時間 ─────────────────────────────────

function StudyTimeStep({
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
  const weekdayIdx = WEEKDAY_OPTIONS.findIndex((o) => o.minutes === weekday);
  const weekendIdx = WEEKEND_OPTIONS.findIndex((o) => o.minutes === weekend);

  return (
    <>
      <StepTitle
        title="1日の勉強時間"
        subtitle="おおよそでOK。AIが現実的な計画を組みます。"
      />

      <TimeOptionPicker
        label="平日"
        options={WEEKDAY_OPTIONS}
        selectedIdx={weekdayIdx === -1 ? 1 : weekdayIdx}
        onChange={(i) => onChangeWeekday(WEEKDAY_OPTIONS[i].minutes)}
      />

      <div className="mt-4" />

      <TimeOptionPicker
        label="休日"
        options={WEEKEND_OPTIONS}
        selectedIdx={weekendIdx === -1 ? 1 : weekendIdx}
        onChange={(i) => onChangeWeekend(WEEKEND_OPTIONS[i].minutes)}
      />
    </>
  );
}

function TimeOptionPicker({
  label,
  options,
  selectedIdx,
  onChange,
}: {
  label: string;
  options: { label: string; minutes: number }[];
  selectedIdx: number;
  onChange: (i: number) => void;
}) {
  return (
    <div className="rounded-3xl border border-cream-200 bg-white p-4 shadow-soft">
      <div className="mb-3 text-sm font-bold text-ink-700">{label}</div>
      <div className="grid grid-cols-5 gap-1.5">
        {options.map((o, i) => (
          <button
            key={o.label}
            type="button"
            onClick={() => onChange(i)}
            className={cn(
              "flex flex-col items-center justify-center rounded-xl py-3 text-xs font-bold transition",
              selectedIdx === i
                ? "bg-sky-500 text-white shadow-soft"
                : "bg-cream-50 text-ink-600 hover:bg-cream-100",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Step 8: スケジュール ─────────────────────────────

function ScheduleStep({
  wakeup,
  returnT,
  bed,
  onChangeWakeup,
  onChangeReturn,
  onChangeBed,
}: {
  wakeup: string;
  returnT: string;
  bed: string;
  onChangeWakeup: (v: string) => void;
  onChangeReturn: (v: string) => void;
  onChangeBed: (v: string) => void;
}) {
  return (
    <>
      <StepTitle
        title="平日のスケジュール"
        subtitle="勉強できる時間帯を把握して、計画に反映します。"
      />

      <TimeScroller
        label="起床"
        options={WAKEUP_OPTIONS}
        value={wakeup}
        onChange={onChangeWakeup}
      />
      <div className="mt-3" />
      <TimeScroller
        label="帰宅"
        options={RETURN_OPTIONS}
        value={returnT}
        onChange={onChangeReturn}
      />
      <div className="mt-3" />
      <TimeScroller
        label="就寝"
        options={BED_OPTIONS}
        value={bed}
        onChange={onChangeBed}
      />
    </>
  );
}

function TimeScroller({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  // 5 個程度の代表時刻を抜粋して4-5択にする
  const step = Math.max(1, Math.floor(options.length / 4));
  const presets: string[] = [];
  for (let i = 0; i < options.length; i += step) presets.push(options[i]);
  if (presets[presets.length - 1] !== options[options.length - 1]) {
    presets.push(options[options.length - 1]);
  }
  // 5 個に絞る
  const display = presets.slice(0, 5);

  return (
    <div className="rounded-2xl border border-ink-100/80 bg-white p-3">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[12px] font-bold text-ink-900">{label}</span>
        <span className="text-[15px] font-bold tabular-nums text-ink-900">
          {value}
        </span>
      </div>
      <ul className="grid grid-cols-5 gap-1">
        {display.map((t) => (
          <li key={t}>
            <button
              type="button"
              onClick={() => onChange(t)}
              className={cn(
                "h-9 w-full rounded-lg text-[11px] font-bold tabular-nums transition",
                value === t
                  ? "bg-ink-900 text-white"
                  : "bg-cream-50 text-ink-700 hover:bg-cream-100",
              )}
            >
              {t}
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="time"
          step={1800}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 flex-1 rounded-lg border border-ink-100/80 bg-cream-50 px-2 text-[12px] text-ink-900 outline-none focus:border-sky-400 focus:bg-white"
        />
        <span className="text-[10px] text-ink-400">詳細</span>
      </div>
    </div>
  );
}

// ── Step 9: 休日 ─────────────────────────────────────

type WeekendDay = "sat" | "sat-half" | "sun" | "sun-half";

const WEEKEND_DAY_OPTIONS: { id: WeekendDay; label: string; sub: string }[] = [
  { id: "sat", label: "土曜 終日", sub: "丸1日使える" },
  { id: "sat-half", label: "土曜 半日", sub: "午前or午後のみ" },
  { id: "sun", label: "日曜 終日", sub: "丸1日使える" },
  { id: "sun-half", label: "日曜 半日", sub: "午前or午後のみ" },
];

function WeekendStep({
  value,
  onChange,
}: {
  value: WeekendDay[];
  onChange: (v: WeekendDay[]) => void;
}) {
  function toggle(id: WeekendDay) {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  }

  return (
    <>
      <StepTitle
        title="休日の使い方"
        subtitle="勉強に使える日・時間帯を教えてください。"
      />
      <div className="grid gap-2.5">
        {WEEKEND_DAY_OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => toggle(o.id)}
            className={cn(
              "flex items-center justify-between rounded-2xl border-2 p-4 text-left transition",
              value.includes(o.id)
                ? "border-sky-500 bg-sky-50"
                : "border-cream-200 bg-white hover:bg-cream-50",
            )}
          >
            <div>
              <div className="text-base font-black text-ink-900">{o.label}</div>
              <div className="text-xs text-ink-500">{o.sub}</div>
            </div>
            <span
              className={cn(
                "h-3 w-3 rounded-full",
                value.includes(o.id) ? "bg-sky-500" : "bg-cream-200",
              )}
            />
          </button>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-ink-500">
        どれも選ばなくてもOKです。
      </p>
    </>
  );
}

// ── Step 10: 得意・苦手 ────────────────────────────

type Proficiency = "good" | "fair" | "weak" | "bad";

const PROFICIENCY_OPTIONS: { id: Proficiency; label: string; color: string }[] = [
  { id: "good", label: "得意", color: "bg-mint-100 text-mint-600 border-mint-200" },
  { id: "fair", label: "ちょい得意", color: "bg-sky-100 text-sky-600 border-sky-200" },
  { id: "weak", label: "苦手", color: "bg-sun-100 text-amber-600 border-amber-200" },
  { id: "bad", label: "マジで苦手", color: "bg-coral-100 text-red-500 border-red-200" },
];

function StrengthsStep({
  value,
  onChange,
}: {
  value: Partial<Record<SubjectAreaId, Proficiency>>;
  onChange: (v: Partial<Record<SubjectAreaId, Proficiency>>) => void;
}) {
  function set(id: SubjectAreaId, p: Proficiency) {
    onChange({ ...value, [id]: p });
  }

  return (
    <>
      <StepTitle
        title="教科の得意・苦手"
        subtitle="AIが重点的に補強する教科を判断します。"
      />
      <div className="space-y-3">
        {SUBJECT_AREAS.map((s) => (
          <div
            key={s.id}
            className="rounded-2xl border border-cream-200 bg-white p-4"
          >
            <div className="mb-3 text-sm font-black text-ink-900">{s.label}</div>
            <div className="grid grid-cols-4 gap-1.5">
              {PROFICIENCY_OPTIONS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => set(s.id, p.id)}
                  className={cn(
                    "rounded-xl border py-2.5 text-xs font-bold transition",
                    value[s.id] === p.id
                      ? p.color + " shadow-soft"
                      : "border-cream-200 bg-cream-50 text-ink-600 hover:bg-cream-100",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-ink-500">
        未選択のままでもOK。後から変えられます。
      </p>
    </>
  );
}
