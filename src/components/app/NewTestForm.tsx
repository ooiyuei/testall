"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import {
  AlertCircle,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  ImagePlus,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { GRADES } from "@/lib/subjects";
import {
  CATEGORY_DEFS,
  getCategoryDef,
  subjectsForCategory,
  subjectsForGrade,
  TEST_KINDS,
  type GradeId,
  type SubjectCategory,
  type SubjectDef,
} from "@/lib/curriculum";
import { readStore, saveTest, setProfile } from "@/lib/store";
import type {
  Diagnosis,
  MissCause,
  SubjectInput,
  TestInput,
  UnitInput,
} from "@/lib/types";

type Mode = "select" | "manual" | "photo";

const CAUSE_OPTIONS: { id: MissCause; label: string; tone: string }[] = [
  { id: "knowledge", label: "知識不足", tone: "bg-peach-100 text-peach-500" },
  {
    id: "understanding",
    label: "理解不足",
    tone: "bg-coral-300 text-white",
  },
  { id: "time", label: "時間不足", tone: "bg-sun-300 text-ink-900" },
  { id: "careless", label: "ケアレス", tone: "bg-sky-100 text-sky-700" },
];

export function NewTestForm() {
  const [mode, setMode] = useState<Mode>("select");

  return (
    <>
      {mode === "select" ? (
        <ModeSelect
          onPickManual={() => setMode("manual")}
          onPickPhoto={() => setMode("photo")}
        />
      ) : mode === "photo" ? (
        <PhotoMode onBack={() => setMode("select")} />
      ) : (
        <ManualForm />
      )}
    </>
  );
}

function ModeSelect({
  onPickManual,
  onPickPhoto,
}: {
  onPickManual: () => void;
  onPickPhoto: () => void;
}) {
  return (
    <div className="px-5 pb-8 pt-3">
      <p className="text-sm text-ink-600">
        テスト1つに複数科目を一括で登録できます。AIが弱点と次の45分を整えます。
      </p>

      <div className="mt-5 grid gap-3">
        <button
          type="button"
          onClick={onPickPhoto}
          className="flex items-center gap-4 rounded-3xl border border-cream-200 bg-white p-5 text-left shadow-soft active:scale-[0.99] transition"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
            <Camera className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-black text-ink-900">写真で取り込む</div>
            <div className="mt-0.5 text-[11px] text-ink-500">
              答案・成績票を撮影。問題文の中身は保存しません。
            </div>
          </div>
          <span className="rounded-full bg-sun-200 px-2 py-0.5 text-[10px] font-bold text-ink-900">
            β版
          </span>
        </button>

        <button
          type="button"
          onClick={onPickManual}
          className="flex items-center gap-4 rounded-3xl border border-cream-200 bg-white p-5 text-left shadow-soft active:scale-[0.99] transition"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint-100 text-mint-600">
            <Edit3 className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-black text-ink-900">手入力する</div>
            <div className="mt-0.5 text-[11px] text-ink-500">
              5科目から複数選び、点数と単元を入力。
            </div>
          </div>
        </button>
      </div>

      <div className="mt-8 rounded-2xl bg-sky-50 p-4 text-[11px] text-sky-900">
        <p className="font-bold">どちらも数十秒で終わります</p>
        <p className="mt-1 text-sky-700">
          学年・志望校に合わせた具体的な作戦が、診断後すぐ届きます。
        </p>
      </div>
    </div>
  );
}

function PhotoMode({ onBack }: { onBack: () => void }) {
  const [scope, setScope] = useState<"answer" | "question" | "both">("answer");

  return (
    <div className="px-5 pb-8 pt-3">
      <button
        type="button"
        onClick={onBack}
        className="flex h-9 items-center gap-1 rounded-full text-xs font-bold text-ink-500 hover:bg-cream-100"
      >
        <ChevronLeft className="h-4 w-4" />
        モードを変える
      </button>

      <h1 className="mt-3 text-xl font-black text-ink-900">
        テストを撮影して取り込む
      </h1>
      <p className="mt-1 text-xs text-ink-500">
        AIが答案を読み取って、単元別の正答数を自動入力します。
      </p>

      <div className="mt-5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
          何を撮影しますか？
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(
            [
              { id: "answer", label: "答案のみ" },
              { id: "question", label: "問題のみ" },
              { id: "both", label: "両方" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setScope(opt.id)}
              className={cn(
                "rounded-2xl border-2 px-2 py-2.5 text-xs font-bold transition",
                scope === opt.id
                  ? "border-sky-500 bg-sky-50 text-sky-700"
                  : "border-cream-200 bg-white text-ink-700",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <label className="mt-5 flex flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-cream-300 bg-white/60 p-8 text-center cursor-pointer hover:bg-cream-50 transition">
        <ImagePlus className="h-8 w-8 text-sky-500" />
        <span className="text-sm font-black text-ink-900">写真を選ぶ</span>
        <span className="text-[11px] text-ink-500">
          または カメラで撮影
        </span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              alert(
                `写真モードはβ版です。\n選択ファイル: ${file.name}\n\n現在は手入力モードのみ精度を保証しています。`,
              );
            }
          }}
        />
      </label>

      <div className="mt-6 rounded-2xl border border-cream-200 bg-white p-4 text-[11px] text-ink-700">
        <p className="font-bold text-ink-900">プライバシー</p>
        <p className="mt-1">
          画像はAI解析にのみ使い、保存されません。問題文の中身は記録しません。
        </p>
      </div>
    </div>
  );
}

// ── 手入力フォーム（複数科目対応） ──

type Step = 0 | 1 | 2;

type SubjectEntry = {
  category: SubjectCategory;
  subjectId: string;
  score: string;
  fullScore: string;
  units: UnitInput[];
};

type FormState = {
  grade: GradeId;
  testKindId: string;
  testDate: string;
  testName: string;
  selectedCategories: SubjectCategory[];
  subjects: SubjectEntry[];
};

function todayDate(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function defaultSubjectForCategory(
  category: SubjectCategory,
  grade: GradeId,
): SubjectEntry | null {
  const subjects = subjectsForCategory(category, grade);
  const first = subjects[0];
  if (!first) return null;
  return {
    category,
    subjectId: first.id,
    score: "",
    fullScore: "100",
    units: first.units.slice(0, 3).map((u) => ({
      unit: u,
      correct: 0,
      total: 0,
    })),
  };
}

function buildInitialState(): FormState {
  const existing = readStore().profile;
  const grade = (existing?.grade as GradeId) ?? "h2";
  const initialCat: SubjectCategory = "math";
  const first = defaultSubjectForCategory(initialCat, grade);
  return {
    grade,
    testKindId: "school-mock",
    testDate: todayDate(),
    testName: "",
    selectedCategories: [initialCat],
    subjects: first ? [first] : [],
  };
}

function ManualForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState<FormState>(buildInitialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleCategory(category: SubjectCategory) {
    setForm((prev) => {
      const has = prev.selectedCategories.includes(category);
      if (has) {
        return {
          ...prev,
          selectedCategories: prev.selectedCategories.filter(
            (c) => c !== category,
          ),
          subjects: prev.subjects.filter((s) => s.category !== category),
        };
      }
      const next = defaultSubjectForCategory(category, prev.grade);
      return {
        ...prev,
        selectedCategories: [...prev.selectedCategories, category],
        subjects: next ? [...prev.subjects, next] : prev.subjects,
      };
    });
  }

  function changeSubjectInCategory(
    category: SubjectCategory,
    subjectId: string,
  ) {
    const list = subjectsForCategory(category, form.grade);
    const def = list.find((s) => s.id === subjectId) ?? list[0];
    if (!def) return;
    setForm((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) =>
        s.category === category
          ? {
              ...s,
              subjectId: def.id,
              units: def.units.slice(0, 3).map((u) => ({
                unit: u,
                correct: 0,
                total: 0,
              })),
            }
          : s,
      ),
    }));
  }

  function updateSubject(
    category: SubjectCategory,
    next: Partial<SubjectEntry>,
  ) {
    setForm((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) =>
        s.category === category ? { ...s, ...next } : s,
      ),
    }));
  }

  function setUnit(
    category: SubjectCategory,
    idx: number,
    next: Partial<UnitInput>,
  ) {
    setForm((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) =>
        s.category === category
          ? {
              ...s,
              units: s.units.map((u, i) =>
                i === idx ? { ...u, ...next } : u,
              ),
            }
          : s,
      ),
    }));
  }

  function addUnit(category: SubjectCategory) {
    const entry = form.subjects.find((s) => s.category === category);
    if (!entry) return;
    const def = subjectsForCategory(category, form.grade).find(
      (s) => s.id === entry.subjectId,
    );
    const remaining =
      def?.units.filter(
        (u) => !entry.units.some((cur) => cur.unit === u),
      ) ?? [];
    const next = remaining[0] ?? "新しい単元";
    updateSubject(category, {
      units: [...entry.units, { unit: next, correct: 0, total: 0 }],
    });
  }

  function removeUnit(category: SubjectCategory, idx: number) {
    const entry = form.subjects.find((s) => s.category === category);
    if (!entry) return;
    updateSubject(category, {
      units: entry.units.filter((_, i) => i !== idx),
    });
  }

  function validateStep(s: Step): string | null {
    if (s === 0) {
      if (!form.grade) return "学年を選んでください";
      if (!form.testKindId) return "テスト種別を選んでください";
      if (!form.testName.trim()) return "テスト名を入れてください";
      if (form.selectedCategories.length === 0)
        return "科目を1つ以上選んでください";
    }
    if (s === 1) {
      for (const entry of form.subjects) {
        const cat = getCategoryDef(entry.category).name;
        const score = Number(entry.score);
        const full = Number(entry.fullScore);
        if (Number.isNaN(score) || score < 0) return `${cat}の点数を入れてください`;
        if (Number.isNaN(full) || full <= 0) return `${cat}の満点を入れてください`;
        if (score > full) return `${cat}の点数が満点を超えています`;
      }
    }
    if (s === 2) {
      const allEmpty = form.subjects.every((entry) =>
        entry.units.every((u) => u.total === 0),
      );
      // 単元は任意。空でもOK。
      if (allEmpty) return null;
      for (const entry of form.subjects) {
        for (const u of entry.units) {
          if (u.correct > u.total)
            return `「${u.unit}」の正答数が出題数を超えています`;
        }
      }
    }
    return null;
  }

  function goNext() {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    if (step < 2) setStep(((step + 1) as Step));
    else submit();
  }

  function goPrev() {
    setError(null);
    if (step > 0) setStep((step - 1) as Step);
  }

  async function submit() {
    setSubmitting(true);
    setError(null);

    const existing = readStore().profile;
    if (existing && existing.grade !== form.grade) {
      setProfile({ ...existing, grade: form.grade });
    }
    const profile = readStore().profile;

    // 複数科目を SubjectInput[] へ展開
    const subjectsPayload: SubjectInput[] = form.subjects.map((entry) => {
      const def = subjectsForCategory(entry.category, form.grade).find(
        (s) => s.id === entry.subjectId,
      );
      return {
        subjectId: entry.subjectId,
        subjectName: def?.name ?? entry.subjectId,
        score: Number(entry.score) || 0,
        fullScore: Number(entry.fullScore) || 100,
        units: entry.units
          .filter((u) => u.total > 0)
          .map((u) => ({
            unit: u.unit,
            correct: Number(u.correct),
            total: Number(u.total),
            cause: u.cause,
          })),
      };
    });

    // 旧スキーマ互換：1テスト1科目相当として「最大点数の科目」を主表示にする
    const primary =
      subjectsPayload.slice().sort((a, b) => b.fullScore - a.fullScore)[0] ??
      subjectsPayload[0];

    const totalScore = subjectsPayload.reduce((s, e) => s + e.score, 0);
    const totalFull = subjectsPayload.reduce((s, e) => s + e.fullScore, 0);

    const input: TestInput = {
      grade: form.grade,
      target: profile?.target ?? "private-top",
      examDate: profile?.examDate ?? todayDate(),
      availableMinutesPerDay: profile?.availableMinutesPerDay ?? 120,
      textbooks: profile?.textbooks ?? [],
      subject: primary?.subjectName ?? "総合",
      testName: form.testName.trim(),
      score: primary?.score ?? totalScore,
      fullScore: primary?.fullScore ?? totalFull,
      units: primary?.units ?? [],
      deviation: profile?.deviation,
      schoolName: profile?.schoolName,
      weekdayMinutes: profile?.weekdayMinutes,
      weekendMinutes: profile?.weekendMinutes,
      targetUniversities: profile?.targetUniversities?.map((tu) => ({
        universityId: tu.universityId,
        faculty: tu.faculty,
      })),
      testKindId: form.testKindId,
      testDate: form.testDate,
      subjects: subjectsPayload,
    };

    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("diagnose_failed");
      const data = (await res.json()) as { ok: boolean; diagnosis: Diagnosis };
      if (!data.ok) throw new Error("diagnose_failed");

      const id = nanoid(10);
      saveTest({
        id,
        createdAt: new Date().toISOString(),
        input,
        diagnosis: data.diagnosis,
      });

      router.push(`/app/test/${id}`);
    } catch {
      setError("診断の生成に失敗しました。少し待ってから再度お試しください。");
      setSubmitting(false);
    }
  }

  return (
    <div className="px-5 pb-8 pt-3">
      <StepIndicator step={step} />

      {error ? (
        <div className="mt-3 flex items-start gap-2 rounded-2xl border border-coral-300 bg-coral-300/10 p-3 text-xs text-coral-500">
          <AlertCircle className="h-4 w-4 flex-none" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="mt-4">
        {step === 0 ? (
          <BasicStep
            form={form}
            update={update}
            toggleCategory={toggleCategory}
          />
        ) : null}
        {step === 1 ? (
          <ScoreStep
            form={form}
            changeSubject={changeSubjectInCategory}
            updateSubject={updateSubject}
          />
        ) : null}
        {step === 2 ? (
          <UnitStep
            form={form}
            setUnit={setUnit}
            addUnit={addUnit}
            removeUnit={removeUnit}
          />
        ) : null}
      </div>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-20 z-20 mx-auto w-full max-w-[480px] px-4">
        <div className="flex gap-2 rounded-2xl bg-white/95 p-2 shadow-[0_8px_24px_-8px_rgba(50,46,41,0.18)] backdrop-blur">
          {step > 0 ? (
            <button
              type="button"
              onClick={goPrev}
              disabled={submitting}
              className="flex h-12 flex-none items-center justify-center gap-1 rounded-xl border border-cream-200 px-4 text-sm font-bold text-ink-700"
            >
              <ChevronLeft className="h-4 w-4" />
              戻る
            </button>
          ) : null}
          <button
            type="button"
            onClick={goNext}
            disabled={submitting}
            className={cn(
              "flex h-12 flex-1 items-center justify-center gap-1 rounded-xl bg-sky-500 text-sm font-black text-white shadow-soft transition active:scale-[0.98]",
              submitting && "opacity-70",
            )}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                診断中…
              </>
            ) : step < 2 ? (
              <>
                次へ
                <ChevronRight className="h-4 w-4" />
              </>
            ) : (
              "AIで診断する"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const labels = ["基本情報", "科目別点数", "単元（任意）"];
  return (
    <div className="flex items-center gap-2">
      {labels.map((label, i) => (
        <div key={label} className="flex flex-1 items-center gap-2">
          <div
            className={cn(
              "flex h-6 w-6 flex-none items-center justify-center rounded-full text-[10px] font-black",
              i < step
                ? "bg-mint-500 text-white"
                : i === step
                ? "bg-sky-500 text-white"
                : "bg-cream-100 text-ink-400",
            )}
          >
            {i + 1}
          </div>
          <span
            className={cn(
              "text-[11px] font-bold",
              i === step ? "text-ink-900" : "text-ink-400",
            )}
          >
            {label}
          </span>
          {i < labels.length - 1 ? (
            <div
              className={cn(
                "h-px flex-1",
                i < step ? "bg-mint-500" : "bg-cream-200",
              )}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function BasicStep({
  form,
  update,
  toggleCategory,
}: {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  toggleCategory: (c: SubjectCategory) => void;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <Label>テスト名</Label>
        <input
          value={form.testName}
          onChange={(e) => update("testName", e.target.value)}
          placeholder="例：5月校内模試 / 前期中間"
          className="mt-2 h-12 w-full rounded-xl border border-cream-200 bg-white px-3 text-base text-ink-900 outline-none focus:border-sky-400"
        />
      </Card>

      <Card>
        <Label>テスト種別</Label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TEST_KINDS.map((k) => (
            <Chip
              key={k.id}
              active={form.testKindId === k.id}
              onClick={() => update("testKindId", k.id)}
            >
              {k.name}
            </Chip>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <Label>受験日</Label>
          <span className="text-[10px] text-ink-500">任意</span>
        </div>
        <input
          type="date"
          value={form.testDate}
          onChange={(e) => update("testDate", e.target.value)}
          className="mt-2 h-11 w-full rounded-xl border border-cream-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-sky-400"
        />
      </Card>

      <Card>
        <Label>学年</Label>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {GRADES.map((g) => (
            <Chip
              key={g.id}
              active={form.grade === g.id}
              onClick={() => update("grade", g.id as GradeId)}
            >
              {g.name}
            </Chip>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <Label>記録する科目（複数OK）</Label>
          <span className="text-[10px] font-bold text-ink-500 tabular-nums">
            {form.selectedCategories.length} 科目
          </span>
        </div>
        <ul className="mt-2 grid grid-cols-3 gap-2">
          {CATEGORY_DEFS.filter((c) => c.id !== "info").map((cat) => {
            const active = form.selectedCategories.includes(cat.id);
            return (
              <li key={cat.id}>
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={cn(
                    "relative flex h-20 w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 transition",
                    active
                      ? "border-sky-500 bg-sky-50"
                      : "border-cream-200 bg-white hover:bg-cream-50",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-xl text-sm font-black",
                      cat.tone,
                    )}
                  >
                    {cat.shortName}
                  </span>
                  <span className="text-xs font-bold text-ink-900">
                    {cat.name}
                  </span>
                  {active ? (
                    <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-white">
                      <Check className="h-3 w-3" />
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

function ScoreStep({
  form,
  changeSubject,
  updateSubject,
}: {
  form: FormState;
  changeSubject: (cat: SubjectCategory, subjectId: string) => void;
  updateSubject: (cat: SubjectCategory, next: Partial<SubjectEntry>) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-500">
        科目ごとの点数を入れてください。詳細単元は次のステップで（任意）。
      </p>
      {form.subjects.map((entry) => {
        const cat = getCategoryDef(entry.category);
        const list = subjectsForCategory(entry.category, form.grade);
        return (
          <Card key={entry.category}>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-8 w-8 flex-none items-center justify-center rounded-xl text-sm font-black",
                  cat.tone,
                )}
              >
                {cat.shortName}
              </span>
              <span className="text-sm font-black text-ink-900">{cat.name}</span>
            </div>

            {list.length > 1 ? (
              <div className="mt-2">
                <Label>詳細科目</Label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {list.map((s) => (
                    <Chip
                      key={s.id}
                      active={entry.subjectId === s.id}
                      onClick={() => changeSubject(entry.category, s.id)}
                    >
                      {s.shortName}
                    </Chip>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-3">
              <Label>点数</Label>
              <div className="mt-1.5 flex items-baseline gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  value={entry.score}
                  onChange={(e) =>
                    updateSubject(entry.category, { score: e.target.value })
                  }
                  placeholder="0"
                  className="h-12 w-24 flex-none rounded-xl border border-cream-200 bg-white px-3 text-right text-lg font-black text-ink-900 outline-none focus:border-sky-400"
                />
                <span className="text-sm font-bold text-ink-500">/</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={entry.fullScore}
                  onChange={(e) =>
                    updateSubject(entry.category, {
                      fullScore: e.target.value,
                    })
                  }
                  placeholder="100"
                  className="h-12 w-24 flex-none rounded-xl border border-cream-200 bg-white px-3 text-right text-lg font-black text-ink-900 outline-none focus:border-sky-400"
                />
                <span className="text-sm font-bold text-ink-500">点</span>
                {Number(entry.score) > 0 && Number(entry.fullScore) > 0 ? (
                  <span className="ml-auto rounded-full bg-cream-100 px-2.5 py-0.5 text-[11px] font-bold text-ink-700 tabular-nums">
                    {Math.round(
                      (Number(entry.score) / Number(entry.fullScore)) * 100,
                    )}
                    %
                  </span>
                ) : null}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function UnitStep({
  form,
  setUnit,
  addUnit,
  removeUnit,
}: {
  form: FormState;
  setUnit: (cat: SubjectCategory, idx: number, next: Partial<UnitInput>) => void;
  addUnit: (cat: SubjectCategory) => void;
  removeUnit: (cat: SubjectCategory, idx: number) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-500">
        単元別の正答数や原因を入れると、AIの診断精度が上がります。空欄でもOK。
      </p>
      {form.subjects.map((entry) => {
        const cat = getCategoryDef(entry.category);
        const def = subjectsForCategory(entry.category, form.grade).find(
          (s) => s.id === entry.subjectId,
        );
        const units = def?.units ?? [];
        return (
          <section
            key={entry.category}
            className="rounded-3xl border border-cream-200 bg-white p-3 shadow-soft"
          >
            <header className="flex items-center gap-2 pb-2">
              <span
                className={cn(
                  "flex h-8 w-8 flex-none items-center justify-center rounded-xl text-sm font-black",
                  cat.tone,
                )}
              >
                {cat.shortName}
              </span>
              <span className="text-sm font-black text-ink-900">
                {def?.shortName ?? cat.name}
              </span>
            </header>

            <ul className="space-y-2 border-t border-cream-200 pt-2">
              {entry.units.map((u, idx) => (
                <li
                  key={idx}
                  className="rounded-xl border border-cream-200 bg-cream-50 p-3"
                >
                  <div className="flex items-start gap-2">
                    <select
                      value={u.unit}
                      onChange={(e) =>
                        setUnit(entry.category, idx, {
                          unit: e.target.value,
                        })
                      }
                      className="h-9 flex-1 rounded-lg border border-cream-200 bg-white px-2 text-xs font-bold text-ink-900 outline-none focus:border-sky-400"
                    >
                      {units.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                      {!units.includes(u.unit) ? (
                        <option value={u.unit}>{u.unit}</option>
                      ) : null}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeUnit(entry.category, idx)}
                      className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-ink-400 hover:bg-cream-100"
                      aria-label="削除"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mt-2 flex items-baseline gap-1.5">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={u.correct || ""}
                      onChange={(e) =>
                        setUnit(entry.category, idx, {
                          correct: Number(e.target.value),
                        })
                      }
                      placeholder="0"
                      className="h-10 w-16 flex-none rounded-lg border border-cream-200 bg-white px-2 text-right text-sm font-black text-ink-900 outline-none focus:border-sky-400"
                    />
                    <span className="text-[11px] font-bold text-ink-500">/</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={u.total || ""}
                      onChange={(e) =>
                        setUnit(entry.category, idx, {
                          total: Number(e.target.value),
                        })
                      }
                      placeholder="0"
                      className="h-10 w-16 flex-none rounded-lg border border-cream-200 bg-white px-2 text-right text-sm font-black text-ink-900 outline-none focus:border-sky-400"
                    />
                    <span className="text-[11px] font-bold text-ink-500">問</span>
                    {u.total > 0 ? (
                      <span className="ml-auto text-[11px] font-bold text-ink-500 tabular-nums">
                        {Math.round((u.correct / u.total) * 100)}%
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {CAUSE_OPTIONS.map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() =>
                          setUnit(entry.category, idx, {
                            cause: u.cause === c.id ? undefined : c.id,
                          })
                        }
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold transition",
                          u.cause === c.id
                            ? c.tone
                            : "bg-white text-ink-500 hover:bg-cream-100",
                        )}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => addUnit(entry.category)}
              className="mt-2 flex h-9 w-full items-center justify-center gap-1 rounded-xl border border-dashed border-cream-300 text-[11px] font-bold text-ink-500 hover:bg-cream-50"
            >
              <Plus className="h-3.5 w-3.5" />
              単元を追加
            </button>
          </section>
        );
      })}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-ink-100/80 bg-white p-4">
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 rounded-xl px-3 text-xs font-bold transition",
        active
          ? "bg-sky-500 text-white shadow-soft"
          : "bg-cream-100 text-ink-700 hover:bg-cream-200",
      )}
    >
      {children}
    </button>
  );
}
