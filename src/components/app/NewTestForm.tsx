"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { GRADES, SUBJECTS, TARGET_LEVELS } from "@/lib/subjects";
import { readStore, saveTest, setProfile } from "@/lib/store";
import type {
  Diagnosis,
  MissCause,
  TestInput,
  UnitInput,
} from "@/lib/types";

const CAUSE_OPTIONS: { id: MissCause; label: string; tone: string }[] = [
  { id: "knowledge", label: "知識不足", tone: "bg-peach-100 text-peach-500" },
  { id: "understanding", label: "理解不足", tone: "bg-coral-300 text-white" },
  { id: "time", label: "時間不足", tone: "bg-sun-300 text-ink-900" },
  { id: "careless", label: "ケアレス", tone: "bg-sky-100 text-sky-700" },
];

type Step = 0 | 1 | 2;

type FormState = {
  // profile
  grade: string;
  target: string;
  examDate: string;
  availableMinutesPerDay: number;
  textbooks: string[];
  // test
  subjectId: string;
  testName: string;
  score: string;
  fullScore: string;
  units: UnitInput[];
};

function defaultExamDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 6);
  return d.toISOString().slice(0, 10);
}

function buildInitialState(): FormState {
  const existing = readStore().profile;
  return {
    grade: existing?.grade ?? "h2",
    target: existing?.target ?? "private-top",
    examDate: existing?.examDate ?? defaultExamDate(),
    availableMinutesPerDay: existing?.availableMinutesPerDay ?? 120,
    textbooks: existing?.textbooks?.length ? existing.textbooks : [""],
    subjectId: "math",
    testName: "",
    score: "",
    fullScore: "100",
    units: SUBJECTS[0].units.slice(0, 3).map((u) => ({
      unit: u,
      correct: 0,
      total: 0,
    })),
  };
}

export function NewTestForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState<FormState>(buildInitialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subject = useMemo(
    () => SUBJECTS.find((s) => s.id === form.subjectId) ?? SUBJECTS[0],
    [form.subjectId],
  );

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

  function setTextbook(idx: number, value: string) {
    setForm((prev) => ({
      ...prev,
      textbooks: prev.textbooks.map((t, i) => (i === idx ? value : t)),
    }));
  }

  function addTextbook() {
    setForm((prev) => ({ ...prev, textbooks: [...prev.textbooks, ""] }));
  }

  function removeTextbook(idx: number) {
    setForm((prev) => ({
      ...prev,
      textbooks: prev.textbooks.filter((_, i) => i !== idx),
    }));
  }

  function changeSubject(id: string) {
    const next = SUBJECTS.find((s) => s.id === id) ?? SUBJECTS[0];
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
      if (!form.target) return "志望校レベルを選んでください";
      if (!form.examDate) return "本番日を入れてください";
      if (form.availableMinutesPerDay <= 0) return "1日の勉強時間を入れてください";
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

    const textbooks = form.textbooks.map((t) => t.trim()).filter(Boolean);
    const profile = {
      grade: form.grade,
      target: form.target,
      examDate: form.examDate,
      availableMinutesPerDay: form.availableMinutesPerDay,
      textbooks,
    };
    setProfile(profile);

    const input: TestInput = {
      ...profile,
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
          <ProfileStep
            form={form}
            update={update}
            setTextbook={setTextbook}
            addTextbook={addTextbook}
            removeTextbook={removeTextbook}
          />
        ) : null}
        {step === 1 ? (
          <TestStep form={form} update={update} changeSubject={changeSubject} />
        ) : null}
        {step === 2 ? (
          <UnitStep
            form={form}
            subjectUnits={subject.units}
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
  const labels = ["プロフィール", "テスト", "単元"];
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

function ProfileStep({
  form,
  update,
  setTextbook,
  addTextbook,
  removeTextbook,
}: {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  setTextbook: (idx: number, value: string) => void;
  addTextbook: () => void;
  removeTextbook: (idx: number) => void;
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
              onClick={() => update("grade", g.id)}
            >
              {g.name}
            </Chip>
          ))}
        </div>
      </Card>

      <Card>
        <Label>志望校レベル</Label>
        <div className="mt-2 space-y-2">
          {TARGET_LEVELS.map((t) => (
            <RowOption
              key={t.id}
              active={form.target === t.id}
              onClick={() => update("target", t.id)}
            >
              {t.name}
            </RowOption>
          ))}
        </div>
      </Card>

      <Card>
        <Label>本番日</Label>
        <input
          type="date"
          value={form.examDate}
          onChange={(e) => update("examDate", e.target.value)}
          className="mt-2 h-11 w-full rounded-xl border border-cream-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-sky-400"
        />
      </Card>

      <Card>
        <Label>1日に勉強できる時間</Label>
        <div className="mt-2 flex items-center gap-3">
          <input
            type="range"
            min={30}
            max={480}
            step={15}
            value={form.availableMinutesPerDay}
            onChange={(e) =>
              update("availableMinutesPerDay", Number(e.target.value))
            }
            className="flex-1 accent-sky-500"
          />
          <div className="w-20 flex-none rounded-xl bg-cream-100 px-3 py-2 text-right text-sm font-black text-ink-900 tabular-nums">
            {form.availableMinutesPerDay}
            <span className="ml-0.5 text-[10px] font-bold text-ink-500">分</span>
          </div>
        </div>
      </Card>

      <Card>
        <Label>持っている参考書</Label>
        <p className="mt-1 text-[11px] text-ink-500">
          AIが「これを回す」前提でルートを組みます。
        </p>
        <ul className="mt-2 space-y-2">
          {form.textbooks.map((t, i) => (
            <li key={i} className="flex items-center gap-2">
              <input
                value={t}
                onChange={(e) => setTextbook(i, e.target.value)}
                placeholder="例：チャート式 数IA"
                className="h-11 flex-1 rounded-xl border border-cream-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-sky-400"
              />
              {form.textbooks.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeTextbook(i)}
                  className="flex h-11 w-11 flex-none items-center justify-center rounded-xl text-ink-400 hover:bg-cream-100"
                  aria-label="削除"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={addTextbook}
          className="mt-2 flex h-10 w-full items-center justify-center gap-1 rounded-xl border border-dashed border-cream-300 text-xs font-bold text-ink-500 hover:bg-cream-50"
        >
          <Plus className="h-4 w-4" />
          参考書を追加
        </button>
      </Card>
    </div>
  );
}

function TestStep({
  form,
  update,
  changeSubject,
}: {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  changeSubject: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <Label>科目</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {SUBJECTS.map((s) => (
            <Chip
              key={s.id}
              active={form.subjectId === s.id}
              onClick={() => changeSubject(s.id)}
            >
              {s.name}
            </Chip>
          ))}
        </div>
      </Card>

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

function RowOption({
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
        "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-bold transition",
        active
          ? "bg-sky-50 text-sky-700 ring-2 ring-sky-200"
          : "bg-cream-50 text-ink-700 hover:bg-cream-100",
      )}
    >
      <span>{children}</span>
      {active ? (
        <span className="h-2 w-2 rounded-full bg-sky-500" />
      ) : (
        <span className="h-2 w-2 rounded-full bg-cream-300" />
      )}
    </button>
  );
}
