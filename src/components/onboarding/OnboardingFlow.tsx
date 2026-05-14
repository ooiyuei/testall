"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { bucketMid, readStore, setProfile } from "@/lib/store";
import type {
  DeviationBucket,
  StoredProfile,
  SubjectAreaId,
  TargetUniversity,
} from "@/lib/store";
import { AddEntityModal, type AddEntityKind } from "@/components/master/AddEntityModal";
import {
  GradeStep,
  SchoolStep,
  DeviationStep,
  TargetDevStep,
  UnivTypesStep,
  TargetUnisStep,
  StudyTimeStep,
  ScheduleStep,
  WeekendStep,
  StrengthsStep,
} from "./OnboardingSteps";

// ── ステップ定義 ──────────────────────────────────────
const STEPS = [
  { id: "grade",       label: "学年" },
  { id: "school",      label: "高校" },
  { id: "deviation",   label: "偏差値" },
  { id: "target-dev",  label: "目標" },
  { id: "univ-types",  label: "大学" },
  { id: "target-unis", label: "志望校" },
  { id: "study-time",  label: "勉強時間" },
  { id: "schedule",    label: "スケジュール" },
  { id: "weekend",     label: "休日" },
  { id: "strengths",   label: "得意苦手" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

// ── フォームステート ──────────────────────────────────
type FormState = {
  grade: string;
  schoolName: string;
  deviationBucket: DeviationBucket;
  deviationByArea: Partial<Record<SubjectAreaId, DeviationBucket>>;
  targetDeviationBucket: DeviationBucket;
  universityTypes: ("national" | "public" | "private")[];
  interestedFacultyCategories: string[];
  targetUniversities: TargetUniversity[];
  weekdayMinutes: number;
  weekendMinutes: number;
  wakeupTime: string;
  returnTime: string;
  bedTime: string;
  weekendDays: ("sat" | "sat-half" | "sun" | "sun-half")[];
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

// ── ヘッダー: プログレスバー + ナビ ──────────────────
function OnboardingHeader({
  stepIdx,
  totalSteps,
  onPrev,
  onSkip,
}: {
  stepIdx: number;
  totalSteps: number;
  onPrev: () => void;
  onSkip: () => void;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-ink-100/60 bg-cream-50/90 px-4 pb-3 pt-3 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onPrev}
          disabled={stepIdx === 0}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full transition",
            stepIdx === 0
              ? "text-ink-200"
              : "text-ink-700 hover:bg-cream-100 active:bg-cream-200",
          )}
          aria-label="前のステップに戻る"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
        </button>

        <span className="text-[12px] font-medium text-ink-400 tabular-nums">
          {stepIdx + 1} / {totalSteps}
        </span>

        <button
          type="button"
          onClick={onSkip}
          className="text-[13px] font-medium text-sky-500 hover:text-sky-600 transition"
        >
          スキップ
        </button>
      </div>

      {/* プログレスバー */}
      <div className="mt-3 flex gap-1" role="progressbar" aria-valuenow={stepIdx + 1} aria-valuemax={totalSteps}>
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-300",
              i < stepIdx ? "bg-sky-500"
              : i === stepIdx ? "bg-sky-400"
              : "bg-cream-200",
            )}
          />
        ))}
      </div>
    </header>
  );
}

// ── フッター: 次へボタン ──────────────────────────────
function OnboardingFooter({
  stepIdx,
  totalSteps,
  canProceed,
  onNext,
}: {
  stepIdx: number;
  totalSteps: number;
  canProceed: boolean;
  onNext: () => void;
}) {
  const isLast = stepIdx === totalSteps - 1;

  return (
    <footer className="sticky bottom-0 z-10 border-t border-ink-100/60 bg-cream-50/90 px-5 py-4 backdrop-blur-xl">
      <button
        type="button"
        onClick={onNext}
        disabled={!canProceed}
        className={cn(
          "flex h-12 w-full items-center justify-center gap-1.5 rounded-xl text-[15px] font-bold text-white transition active:scale-[0.98]",
          canProceed ? "bg-ink-900 hover:bg-ink-800" : "bg-ink-300 cursor-not-allowed",
        )}
      >
        {isLast ? (
          "はじめる"
        ) : (
          <>
            次へ
            <ChevronRight className="h-4.5 w-4.5" strokeWidth={1.75} />
          </>
        )}
      </button>
    </footer>
  );
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
    if (stepId === "deviation") return !!form.deviationBucket;
    if (stepId === "target-dev") return !!form.targetDeviationBucket;
    if (stepId === "study-time") return form.weekdayMinutes > 0 && form.weekendMinutes > 0;
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
        ? form.deviationByArea : undefined,
      targetDeviationBucket: form.targetDeviationBucket,
      universityTypes: form.universityTypes.length > 0 ? form.universityTypes : undefined,
      interestedFacultyCategories: form.interestedFacultyCategories.length > 0
        ? form.interestedFacultyCategories : undefined,
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
        ? form.proficiencyByArea : undefined,
      target: form.targetUniversities[0]
        ? form.targetUniversities[0].universityId
        : existing?.target ?? "private-top",
      examDate: existing?.examDate ?? defaultExamDate(form.grade),
      textbooks: existing?.textbooks ?? [],
      userId: existing?.userId ?? String(10000 + Math.floor(Math.random() * 90000)),
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
      userId: existing?.userId ?? String(10000 + Math.floor(Math.random() * 90000)),
    } as StoredProfile);
    router.push("/app");
  }

  // キーボード: Enter で次へ
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && canProceed()) next();
    if (e.key === "ArrowLeft" && stepIdx > 0) prev();
  }

  return (
    <div
      className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-cream-50"
      onKeyDown={handleKeyDown}
    >
      <OnboardingHeader
        stepIdx={stepIdx}
        totalSteps={STEPS.length}
        onPrev={prev}
        onSkip={handleSkip}
      />

      <main className="flex-1 px-5 pt-7 pb-32">
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

      <OnboardingFooter
        stepIdx={stepIdx}
        totalSteps={STEPS.length}
        canProceed={canProceed()}
        onNext={next}
      />

      {addModal && (
        <AddEntityModal kind={addModal} onClose={() => setAddModal(null)} />
      )}
    </div>
  );
}
