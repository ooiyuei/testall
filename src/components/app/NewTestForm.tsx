"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import {
  AlertCircle,
  Camera,
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
  subjectsForGrade,
  TEST_KINDS,
  type GradeId,
  type SubjectDef,
} from "@/lib/curriculum";
import { readStore, saveTest, setProfile } from "@/lib/store";
import type {
  Diagnosis,
  MissCause,
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
    <div className="px-4 pt-3 pb-10">
      <p className="text-sm text-ink-600">
        模試・校内テストの結果を入力すると、AIが苦手と次の45分を整えます。
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
              科目・単元ごとに正答数と原因を選ぶだけ。
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
    <div className="px-4 pt-3 pb-10">
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

// ── 手入力フォーム ──

type Step = 0 | 1 | 2;

type FormState = {
  grade: GradeId;
  testKindId: string;
  subjectId: string;
  testName: string;
  score: string;
  fullScore: string;
  units: UnitInput[];
};

function buildInitialState(): FormState {
  const existing = readStore().profile;
  const grade = (existing?.grade as GradeId) ?? "h2";
  const subjects = subjectsForGrade(grade);
  const subject = subjects[0] ?? subjectsForGrade("h2")[0];
  return {
    grade,
    testKindId: "school-mock",
    subjectId: subject.id,
    testName: "",
    score: "",
    fullScore: "100",
    units: subject.units.slice(0, 3).map((u) => ({
      unit: u,
      correct: 0,
      total: 0,
    })),
  };
}

function ManualForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState<FormState>(buildInitialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subjectsAvailable = useMemo(
    () => subjectsForGrade(form.grade),
    [form.grade],
  );
  const subject = useMemo(
    () =>
      subjectsAvailable.find((s) => s.id === form.subjectId) ??
      subjectsAvailable[0],
    [subjectsAvailable, form.subjectId],
  );

  // 学年変更時に科目をリセット
  useEffect(() => {
    if (!subjectsAvailable.some((s) => s.id === form.subjectId)) {
      const first = subjectsAvailable[0];
      if (first) {
        setForm((prev) => ({
          ...prev,
          subjectId: first.id,
          units: first.units.slice(0, 3).map((u) => ({
            unit: u,
            correct: 0,
            total: 0,
          })),
        }));
      }
    }
  }, [form.grade, form.subjectId, subjectsAvailable]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setUnit(idx: number, next: Partial<UnitInput>) {
    setForm((prev) => ({
      ...prev,
      units: prev.units.map((u, i) => (i === idx ? { ...u, ...next } : u)),
    }));
  }

  function addUnit() {
    const remaining = subject.units.filter(
      (u) => !form.units.some((cur) => cur.unit === u),
    );
    const next = remaining[0] ?? "新しい単元";
    setForm((prev) => ({
      ...prev,
      units: [...prev.units, { unit: next, correct: 0, total: 0 }],
    }));
  }

  function removeUnit(idx: number) {
    setForm((prev) => ({
      ...prev,
      units: prev.units.filter((_, i) => i !== idx),
    }));
  }

  function changeSubject(id: string) {
    const next = subjectsAvailable.find((s) => s.id === id) ?? subjectsAvailable[0];
    if (!next) return;
    setForm((prev) => ({
      ...prev,
      subjectId: id,
      units: next.units.slice(0, 3).map((u) => ({
        unit: u,
        correct: 0,
        total: 0,
      })),
    }));
  }

  function validateStep(s: Step): string | null {
    if (s === 0) {
      if (!form.grade) return "学年を選んでください";
      if (!form.testKindId) return "テスト種別を選んでください";
      if (!form.subjectId) return "科目を選んでください";
    }
    if (s === 1) {
      if (!form.testName.trim()) return "テスト名を入れてください";
      const score = Number(form.score);
      const full = Number(form.fullScore);
      if (Number.isNaN(score) || score < 0) return "点数を入れてください";
      if (Number.isNaN(full) || full <= 0) return "満点を入れてください";
      if (score > full) return "点数が満点を超えています";
    }
    if (s === 2) {
      if (form.units.length === 0) return "単元を1つ以上追加してください";
      const hasAny = form.units.some((u) => u.total > 0);
      if (!hasAny) return "少なくとも1単元の出題数を入れてください";
      const overflow = form.units.find((u) => u.correct > u.total);
      if (overflow) return `「${overflow.unit}」の正答数が出題数を超えています`;
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
    // 学年が変わっていたら保存
    if (existing && existing.grade !== form.grade) {
      setProfile({ ...existing, grade: form.grade });
    }

    const profile = readStore().profile;
    const input: TestInput = {
      grade: form.grade,
      target: profile?.target ?? "private-top",
      examDate: profile?.examDate ?? new Date().toISOString().slice(0, 10),
      availableMinutesPerDay: profile?.availableMinutesPerDay ?? 120,
      textbooks: profile?.textbooks ?? [],
      subject: subject.name,
      testName: form.testName.trim(),
      score: Number(form.score),
      fullScore: Number(form.fullScore),
      units: form.units
        .filter((u) => u.total > 0)
        .map((u) => ({
          unit: u.unit,
          correct: Number(u.correct),
          total: Number(u.total),
          cause: u.cause,
        })),
      deviation: profile?.deviation,
      schoolName: profile?.schoolName,
      weekdayMinutes: profile?.weekdayMinutes,
      weekendMinutes: profile?.weekendMinutes,
      targetUniversities: profile?.targetUniversities?.map((tu) => ({
        universityId: tu.universityId,
        faculty: tu.faculty,
      })),
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
    <div className="px-4 pt-3 pb-32">
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
            subjectsAvailable={subjectsAvailable}
            update={update}
            changeSubject={changeSubject}
          />
        ) : null}
        {step === 1 ? <ScoreStep form={form} update={update} /> : null}
        {step === 2 ? (
          <UnitStep
            form={form}
            subjectUnits={subject?.units ?? []}
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
  const labels = ["科目", "点数", "単元"];
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
  subjectsAvailable,
  update,
  changeSubject,
}: {
  form: FormState;
  subjectsAvailable: SubjectDef[];
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  changeSubject: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
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
        <Label>科目</Label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {subjectsAvailable.map((s) => (
            <Chip
              key={s.id}
              active={form.subjectId === s.id}
              onClick={() => changeSubject(s.id)}
            >
              {s.shortName}
            </Chip>
          ))}
        </div>
        {subjectsAvailable.length === 0 ? (
          <p className="mt-2 text-[11px] text-ink-500">
            選択中の学年に登録されている科目がありません。
          </p>
        ) : null}
      </Card>
    </div>
  );
}

function ScoreStep({
  form,
  update,
}: {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <Label>テスト名</Label>
        <input
          value={form.testName}
          onChange={(e) => update("testName", e.target.value)}
          placeholder="例：5月校内模試"
          className="mt-2 h-11 w-full rounded-xl border border-cream-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-sky-400"
        />
      </Card>

      <Card>
        <Label>点数</Label>
        <div className="mt-2 flex items-baseline gap-2">
          <input
            type="number"
            inputMode="numeric"
            value={form.score}
            onChange={(e) => update("score", e.target.value)}
            placeholder="0"
            className="h-12 w-24 flex-none rounded-xl border border-cream-200 bg-white px-3 text-right text-lg font-black text-ink-900 outline-none focus:border-sky-400"
          />
          <span className="text-sm font-bold text-ink-500">/</span>
          <input
            type="number"
            inputMode="numeric"
            value={form.fullScore}
            onChange={(e) => update("fullScore", e.target.value)}
            placeholder="100"
            className="h-12 w-24 flex-none rounded-xl border border-cream-200 bg-white px-3 text-right text-lg font-black text-ink-900 outline-none focus:border-sky-400"
          />
          <span className="text-sm font-bold text-ink-500">点</span>
        </div>
      </Card>
    </div>
  );
}

function UnitStep({
  form,
  subjectUnits,
  setUnit,
  addUnit,
  removeUnit,
}: {
  form: FormState;
  subjectUnits: string[];
  setUnit: (idx: number, next: Partial<UnitInput>) => void;
  addUnit: () => void;
  removeUnit: (idx: number) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-500">
        単元ごとに「出題数」と「正答数」を入れてください。原因も選ぶと精度が上がります。
      </p>
      {form.units.map((u, idx) => (
        <Card key={idx}>
          <div className="flex items-start gap-2">
            <select
              value={u.unit}
              onChange={(e) => setUnit(idx, { unit: e.target.value })}
              className="h-10 flex-1 rounded-xl border border-cream-200 bg-white px-3 text-sm font-bold text-ink-900 outline-none focus:border-sky-400"
            >
              {subjectUnits.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
              {!subjectUnits.includes(u.unit) ? (
                <option value={u.unit}>{u.unit}</option>
              ) : null}
            </select>
            <button
              type="button"
              onClick={() => removeUnit(idx)}
              className="flex h-10 w-10 flex-none items-center justify-center rounded-xl text-ink-400 hover:bg-cream-100"
              aria-label="削除"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={u.correct || ""}
              onChange={(e) =>
                setUnit(idx, { correct: Number(e.target.value) })
              }
              placeholder="0"
              className="h-11 w-20 flex-none rounded-xl border border-cream-200 bg-white px-3 text-right text-base font-black text-ink-900 outline-none focus:border-sky-400"
            />
            <span className="text-xs font-bold text-ink-500">/</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={u.total || ""}
              onChange={(e) =>
                setUnit(idx, { total: Number(e.target.value) })
              }
              placeholder="0"
              className="h-11 w-20 flex-none rounded-xl border border-cream-200 bg-white px-3 text-right text-base font-black text-ink-900 outline-none focus:border-sky-400"
            />
            <span className="text-xs font-bold text-ink-500">問</span>
            {u.total > 0 ? (
              <span className="ml-auto text-xs font-bold text-ink-500 tabular-nums">
                {Math.round((u.correct / u.total) * 100)}%
              </span>
            ) : null}
          </div>

          <div className="mt-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-ink-400">
              原因（任意）
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {CAUSE_OPTIONS.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() =>
                    setUnit(idx, {
                      cause: u.cause === c.id ? undefined : c.id,
                    })
                  }
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-bold transition",
                    u.cause === c.id
                      ? c.tone
                      : "bg-cream-100 text-ink-500 hover:bg-cream-200",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </Card>
      ))}

      <button
        type="button"
        onClick={addUnit}
        className="flex h-11 w-full items-center justify-center gap-1 rounded-2xl border border-dashed border-cream-300 text-xs font-bold text-ink-500 hover:bg-cream-50"
      >
        <Plus className="h-4 w-4" />
        単元を追加
      </button>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-cream-200 bg-white p-4 shadow-soft">
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
