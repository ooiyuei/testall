"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  TEST_KINDS,
  type GradeId,
  type SubjectCategory,
} from "@/lib/curriculum";
import { readStore, saveTest, setProfile } from "@/lib/store";
import { preprocessImage } from "@/lib/image-preprocess";
import { updateProfileFromTests } from "@/lib/auto-deviation";
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
  const [prefill, setPrefill] = useState<VisionResult | null>(null);

  function handleVisionAccept(result: VisionResult) {
    setPrefill(result);
    setMode("manual");
  }

  return (
    <>
      {mode === "select" ? (
        <ModeSelect
          onPickManual={() => setMode("manual")}
          onPickPhoto={() => setMode("photo")}
        />
      ) : mode === "photo" ? (
        <PhotoMode
          onBack={() => setMode("select")}
          onAccept={handleVisionAccept}
        />
      ) : (
        <ManualForm prefill={prefill} />
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
    <div className="px-5 pb-8 pt-2">
      {/* Step label */}
      <div className="text-[11px] font-medium text-ink-400">STEP 1 / 3</div>
      <h1
        className="mt-1.5 text-[28px] font-extrabold leading-[1.15] tracking-[-0.025em] text-ink-900"
        style={{ fontFamily: "var(--font-display)" }}
      >
        テストを登録して、
        <br />
        次の25分を決めよう
      </h1>
      <p className="mt-2.5 text-[13px] leading-[1.7] text-ink-500">
        1テストに複数科目を一括で登録できます。AIが苦手と次の手を出します。
      </p>

      {/* Photo mode — dark hero */}
      <button
        type="button"
        onClick={onPickPhoto}
        className="mt-6 flex w-full items-center gap-3.5 rounded-[20px] bg-ink-900 p-5 text-left text-white shadow-[0_8px_28px_-10px_rgba(20,19,15,0.35)] transition active:scale-[0.99]"
      >
        <div className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-white/[0.08]">
          <Camera className="h-[26px] w-[26px]" strokeWidth={1.6} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[16px] font-extrabold tracking-tight">
              写真で取り込む
            </span>
            <span className="rounded-full bg-sun-300 px-1.5 py-0.5 text-[9px] font-bold text-ink-900">
              β版
            </span>
          </div>
          <div className="mt-1 text-[11px] leading-[1.6] text-white/65">
            答案・成績票を撮影 → AIが自動で科目・点数・単元を入力
          </div>
        </div>
        <ChevronRight className="h-4 w-4 flex-none text-white/60" strokeWidth={2.3} />
      </button>

      {/* Manual mode */}
      <button
        type="button"
        onClick={onPickManual}
        className="mt-2.5 flex w-full items-center gap-3.5 rounded-[18px] border border-ink-100 bg-white p-4 text-left text-ink-900 transition active:scale-[0.99]"
      >
        <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-cream-100">
          <Edit3 className="h-[22px] w-[22px] text-ink-700" strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-bold tracking-tight">手入力する</div>
          <div className="mt-0.5 text-[11px] leading-[1.6] text-ink-500">
            5科目から複数選び、点数・単元を入力
          </div>
        </div>
        <ChevronRight className="h-3.5 w-3.5 flex-none text-ink-300" strokeWidth={2.3} />
      </button>

      {/* Trust strip */}
      <div className="mt-7 rounded-[14px] bg-cream-100/60 p-4">
        <div className="text-[11px] font-semibold text-ink-700">
          どちらも30秒で終わります
        </div>
        <p className="mt-1 text-[11px] leading-[1.7] text-ink-500">
          学年・志望校に合わせた具体的な作戦が、診断後すぐ届きます。問題文の中身は保存しません。
        </p>
      </div>
    </div>
  );
}

type Confidence = "high" | "medium" | "low";

type VisionResult = {
  subject: string;
  testName: string;
  score: number;
  fullScore: number;
  units: {
    unit: string;
    correct: number;
    total: number;
    cause: "knowledge" | "understanding" | "time" | "careless" | null;
  }[];
};

type VisionDetail = {
  confidence?: { overall: Confidence; score: Confidence; units: Confidence };
  notes?: string | null;
};

type PhotoState =
  | { status: "idle" }
  | { status: "optimizing" }
  | { status: "analyzing" }
  | { status: "done"; result: VisionResult; detail?: VisionDetail; previewUrl: string }
  | { status: "error"; message: string };

function PhotoMode({
  onBack,
  onAccept,
}: {
  onBack: () => void;
  onAccept: (result: VisionResult) => void;
}) {
  const [photoState, setPhotoState] = useState<PhotoState>({ status: "idle" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    // Step 1: 画像を最適化（長辺 1024px / JPEG 0.85）
    setPhotoState({ status: "optimizing" });
    let base64: string;
    let mediaType: string;
    try {
      const processed = await preprocessImage(file);
      base64 = processed.base64;
      mediaType = processed.mediaType;
    } catch {
      // 前処理失敗時は元ファイルをフォールバック
      const buffer = await file.arrayBuffer();
      base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      mediaType = file.type || "image/jpeg";
    }

    // Step 2: Vision API に送信
    setPhotoState({ status: "analyzing" });

    try {
      const res = await fetch("/api/diagnose-from-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mediaType }),
      });

      if (res.status === 503) {
        setPhotoState({ status: "error", message: "api_key_not_configured" });
        return;
      }

      const data = (await res.json()) as {
        ok: boolean;
        result?: VisionResult;
        detail?: VisionDetail;
        error?: string;
      };
      if (!data.ok || !data.result) {
        setPhotoState({ status: "error", message: data.error ?? "vision_failed" });
        return;
      }

      setPhotoState({
        status: "done",
        result: data.result,
        detail: data.detail,
        previewUrl,
      });
    } catch {
      setPhotoState({ status: "error", message: "network_error" });
    }
  }

  function handleAccept() {
    if (photoState.status !== "done") return;
    onAccept(photoState.result);
  }

  const errorMessages: Record<string, string> = {
    api_key_not_configured: "画像入力は準備中です。手入力をご利用ください。",
    parse_failed: "答案を読み取れませんでした。もう一度試すか手入力をご利用ください。",
    vision_failed: "解析に失敗しました。もう一度試してください。",
    network_error: "通信エラーが発生しました。接続を確認してください。",
    image_required: "画像が選択されていません。",
  };

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
        AIが答案を読み取って、科目・点数・単元を自動入力します。
      </p>

      {photoState.status === "idle" ? (
        <label className="mt-5 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-cream-300 bg-white/60 p-8 text-center cursor-pointer hover:bg-cream-50 transition">
          <ImagePlus className="h-8 w-8 text-sky-500" />
          <span className="text-sm font-black text-ink-900">写真を選ぶ</span>
          <span className="text-[11px] text-ink-500">または カメラで撮影</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      ) : null}

      {photoState.status === "optimizing" ? (
        <div className="mt-5 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-cream-300 bg-cream-50 p-10">
          <Loader2 className="h-8 w-8 animate-spin text-ink-400" />
          <span className="text-sm font-bold text-ink-600">画像を最適化中…</span>
        </div>
      ) : null}

      {photoState.status === "analyzing" ? (
        <div className="mt-5 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-sky-200 bg-sky-50 p-10">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
          <span className="text-sm font-bold text-sky-700">解析中…</span>
          <span className="text-[11px] text-sky-500">Claude が答案を読み取っています</span>
        </div>
      ) : null}

      {photoState.status === "error" ? (
        <div className="mt-5 space-y-3">
          <div className="flex items-start gap-2 rounded-2xl border border-coral-300 bg-coral-300/10 p-4 text-xs text-coral-500">
            <AlertCircle className="h-4 w-4 flex-none mt-0.5" />
            <span>{errorMessages[photoState.message] ?? "エラーが発生しました。"}</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setPhotoState({ status: "idle" });
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="flex h-11 flex-1 items-center justify-center rounded-xl border border-cream-200 text-sm font-bold text-ink-700"
            >
              やり直す
            </button>
            <button
              type="button"
              onClick={onBack}
              className="flex h-11 flex-1 items-center justify-center rounded-xl bg-sky-500 text-sm font-bold text-white"
            >
              手入力へ切替
            </button>
          </div>
        </div>
      ) : null}

      {photoState.status === "done" ? (
        <div className="mt-5 space-y-4">
          <img
            src={photoState.previewUrl}
            alt="撮影した答案"
            className="w-full rounded-2xl object-cover max-h-48"
          />
          <div className="rounded-2xl border border-cream-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-ink-500">解析結果</span>
              {photoState.detail?.confidence ? (
                <ConfidenceBadge level={photoState.detail.confidence.overall} />
              ) : (
                <Check className="h-4 w-4 text-mint-500" />
              )}
            </div>

            {/* AI が低信頼度を返してきたら警告 */}
            {photoState.detail?.confidence?.overall === "low" ? (
              <div className="flex items-start gap-1.5 rounded-xl bg-sun-200/40 px-3 py-2 text-[11px] text-ink-700">
                <AlertCircle className="h-3.5 w-3.5 flex-none mt-0.5 text-sun-300" />
                <span>
                  写真が読みにくかった部分があります。次の画面で正しい値に直してください。
                  {photoState.detail.notes ? <><br />（{photoState.detail.notes}）</> : null}
                </span>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] text-ink-500">科目</div>
                <div className="mt-0.5 text-sm font-black text-ink-900">{photoState.result.subject}</div>
              </div>
              <div>
                <div className="text-[10px] text-ink-500">
                  テスト名
                  {photoState.detail?.confidence && photoState.detail.confidence.overall !== "high" ? (
                    <span className="ml-1 text-[9px] font-bold text-ink-400">推測</span>
                  ) : null}
                </div>
                <div className="mt-0.5 text-sm font-black text-ink-900">{photoState.result.testName || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] text-ink-500">
                  得点
                  {photoState.detail?.confidence?.score === "low" ? (
                    <span className="ml-1 text-[9px] font-bold text-coral-500">要確認</span>
                  ) : null}
                </div>
                <div className="mt-0.5 text-sm font-black text-ink-900 tabular-nums">
                  {photoState.result.score} / {photoState.result.fullScore}点
                </div>
              </div>
              <div>
                <div className="text-[10px] text-ink-500">
                  単元数
                  {photoState.detail?.confidence?.units === "low" ? (
                    <span className="ml-1 text-[9px] font-bold text-coral-500">要確認</span>
                  ) : null}
                </div>
                <div className="mt-0.5 text-sm font-black text-ink-900">{photoState.result.units.length}件</div>
              </div>
            </div>
            {photoState.result.units.length > 0 ? (
              <ul className="mt-1 space-y-1 border-t border-cream-200 pt-2">
                {photoState.result.units.map((u, i) => (
                  <li key={i} className="flex items-baseline justify-between text-xs">
                    <span className="text-ink-700 font-bold">{u.unit}</span>
                    <span className="text-ink-500 tabular-nums">{u.correct}/{u.total}問</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setPhotoState({ status: "idle" });
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="flex h-12 flex-none items-center justify-center rounded-xl border border-cream-200 px-4 text-sm font-bold text-ink-700"
            >
              撮り直す
            </button>
            <button
              type="button"
              onClick={handleAccept}
              className="flex h-12 flex-1 items-center justify-center gap-1 rounded-xl bg-sky-500 text-sm font-black text-white shadow-soft active:scale-[0.98] transition"
            >
              <Check className="h-4 w-4" />
              この内容で入力する
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-cream-200 bg-white p-4 text-[11px] text-ink-700">
        <p className="font-bold text-ink-900">プライバシー</p>
        <p className="mt-1">
          画像はAI解析にのみ使い、サーバーに保存されません。問題文の中身は記録しません。
        </p>
      </div>
    </div>
  );
}

// ── 手入力フォーム（複数科目対応） ──

type Step = 0 | 1 | 2;

// 出題形式 (科目カテゴリ別)
export type QuestionFormat =
  // 数学
  | "math-calc"     // 計算
  | "math-essay"    // 文章題
  | "math-proof"    // 証明
  | "math-choice"   // 記号選択
  // 英語
  | "eng-vocab"     // 単語・熟語
  | "eng-grammar"   // 文法
  | "eng-reading"   // 読解
  | "eng-listening" // リスニング
  | "eng-writing"   // 英作文
  // 国語
  | "jp-reading"    // 読解
  | "jp-desc"       // 記述
  | "jp-choice"     // 選択
  | "jp-summary"    // 要約
  | "jp-knowledge"  // 漢字・語彙
  // 理科
  | "sci-calc"      // 計算
  | "sci-desc"      // 記述
  | "sci-experiment" // 実験考察
  | "sci-choice"    // 選択
  // 社会
  | "soc-shortans"  // 一問一答
  | "soc-desc"      // 記述
  | "soc-essay"     // 論述
  | "soc-choice";   // 選択

// UnitInput を拡張 (詳細フィールドを optional で追加)
type UnitInputExt = UnitInput & {
  format?: QuestionFormat;
  pointValue?: number;     // 1配点あたりの点数 (1-10)
};

type SubjectEntry = {
  category: SubjectCategory;
  subjectId: string;
  score: string;
  fullScore: string;
  deviation?: string;      // 偏差値 (任意)
  units: UnitInputExt[];
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

const SUBJECT_NAME_TO_CATEGORY: Record<string, SubjectCategory> = {
  数学: "math",
  英語: "english",
  国語: "japanese",
  理科: "science",
  社会: "social",
};

function buildInitialState(prefill: VisionResult | null): FormState {
  const existing = readStore().profile;
  const grade = (existing?.grade as GradeId) ?? "h2";

  if (prefill) {
    const cat: SubjectCategory =
      SUBJECT_NAME_TO_CATEGORY[prefill.subject] ?? "math";
    const subjects = subjectsForCategory(cat, grade);
    const first = subjects[0];
    const prefillEntry: SubjectEntry | null = first
      ? {
          category: cat,
          subjectId: first.id,
          score: String(prefill.score ?? ""),
          fullScore: String(prefill.fullScore ?? 100),
          units: prefill.units.map((u) => ({
            unit: u.unit,
            correct: u.correct,
            total: u.total,
            cause: u.cause ?? undefined,
          })),
        }
      : null;

    return {
      grade,
      testKindId: "school-mock",
      testDate: todayDate(),
      testName: prefill.testName ?? "",
      selectedCategories: [cat],
      subjects: prefillEntry ? [prefillEntry] : [],
    };
  }

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

function ManualForm({ prefill }: { prefill?: VisionResult | null }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState<FormState>(() => buildInitialState(prefill ?? null));
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

  // 同カテゴリ内のサブ科目をトグル選択 (複数選択可)
  // 例: 数学カテゴリで数Ⅰ・A と 数Ⅱ・B を両方記録
  function toggleSubjectInCategory(
    category: SubjectCategory,
    subjectId: string,
  ) {
    setForm((prev) => {
      const existing = prev.subjects.find(
        (s) => s.category === category && s.subjectId === subjectId,
      );
      if (existing) {
        // 既に選択済 → 削除 (ただしそのカテゴリの最後の1つなら維持)
        const sameCategoryCount = prev.subjects.filter(
          (s) => s.category === category,
        ).length;
        if (sameCategoryCount <= 1) return prev;
        return {
          ...prev,
          subjects: prev.subjects.filter(
            (s) => !(s.category === category && s.subjectId === subjectId),
          ),
        };
      }
      // 未選択 → 追加
      const def = subjectsForCategory(category, prev.grade).find(
        (s) => s.id === subjectId,
      );
      if (!def) return prev;
      const newEntry: SubjectEntry = {
        category,
        subjectId: def.id,
        score: "",
        fullScore: "100",
        units: def.units.slice(0, 3).map((u) => ({
          unit: u,
          correct: 0,
          total: 0,
        })),
      };
      return { ...prev, subjects: [...prev.subjects, newEntry] };
    });
  }

  // 同一カテゴリ + サブ科目で一意に SubjectEntry を更新
  function updateSubject(
    category: SubjectCategory,
    subjectId: string,
    next: Partial<SubjectEntry>,
  ) {
    setForm((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) =>
        s.category === category && s.subjectId === subjectId
          ? { ...s, ...next }
          : s,
      ),
    }));
  }

  function setUnit(
    category: SubjectCategory,
    subjectId: string,
    idx: number,
    next: Partial<UnitInputExt>,
  ) {
    setForm((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) =>
        s.category === category && s.subjectId === subjectId
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

  function addUnit(category: SubjectCategory, subjectId: string) {
    const entry = form.subjects.find(
      (s) => s.category === category && s.subjectId === subjectId,
    );
    if (!entry) return;
    const def = subjectsForCategory(category, form.grade).find(
      (s) => s.id === subjectId,
    );
    const remaining =
      def?.units.filter(
        (u) => !entry.units.some((cur) => cur.unit === u),
      ) ?? [];
    const next = remaining[0] ?? "新しい単元";
    updateSubject(category, subjectId, {
      units: [
        ...entry.units,
        { unit: next, correct: 0, total: 0 },
      ],
    });
  }

  function removeUnit(category: SubjectCategory, subjectId: string, idx: number) {
    const entry = form.subjects.find(
      (s) => s.category === category && s.subjectId === subjectId,
    );
    if (!entry) return;
    updateSubject(category, subjectId, {
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
      if (form.subjects.length === 0)
        return "詳細科目を1つ以上選んでください";
      for (const entry of form.subjects) {
        const def = subjectsForCategory(entry.category, form.grade).find(
          (sd) => sd.id === entry.subjectId,
        );
        const subjLabel = def?.shortName ?? getCategoryDef(entry.category).name;
        const score = Number(entry.score);
        const full = Number(entry.fullScore);
        if (Number.isNaN(score) || score < 0) return `${subjLabel}の点数を入れてください`;
        if (Number.isNaN(full) || full <= 0) return `${subjLabel}の満点を入れてください`;
        if (score > full) return `${subjLabel}の点数が満点を超えています`;
        if (entry.deviation && entry.deviation.trim()) {
          const dev = Number(entry.deviation);
          if (Number.isNaN(dev) || dev < 20 || dev > 90) {
            return `${subjLabel}の偏差値は 20〜90 の範囲で入れてください`;
          }
        }
      }
    }
    if (s === 2) {
      const allEmpty = form.subjects.every((entry) =>
        entry.units.every((u) => (u.total ?? 0) === 0),
      );
      // 単元は任意。空でもOK。
      if (allEmpty) return null;
      for (const entry of form.subjects) {
        for (const u of entry.units) {
          if ((u.correct ?? 0) > (u.total ?? 0))
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
      const dev = entry.deviation ? Number(entry.deviation) : undefined;
      return {
        subjectId: entry.subjectId,
        subjectName: def?.name ?? entry.subjectId,
        score: Number(entry.score) || 0,
        fullScore: Number(entry.fullScore) || 100,
        deviation: Number.isFinite(dev) && dev! > 0 ? dev : undefined,
        units: entry.units
          .filter((u) => (u.total ?? 0) > 0)
          .map((u) => ({
            unit: u.unit,
            correct: Number(u.correct),
            total: Number(u.total),
            cause: u.cause,
            format: u.format,
            pointValue: u.pointValue,
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
      // v0.5: 過去のテスト履歴 / 学習ログ / 本棚を AI に渡してパーソナライズ
      history: buildHistoryContext(),
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

      // 直近テストから profile.deviation / deviationByArea を自動補正
      const after = readStore();
      const updated = updateProfileFromTests(after.profile, after.tests);
      if (updated) setProfile(updated);

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
            toggleSubject={toggleSubjectInCategory}
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
  const current = step + 1;
  const total = labels.length;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[12px] font-semibold tracking-tight text-ink-700">
          {labels[step]}
        </span>
        <span className="text-[11px] font-semibold tabular-nums text-ink-400">
          {current} / {total}
        </span>
      </div>
      <div className="mt-2 flex gap-1.5">
        {labels.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-[3px] flex-1 rounded-full transition-colors",
              i <= step ? "bg-ink-900" : "bg-ink-100",
            )}
          />
        ))}
      </div>
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
  toggleSubject,
  updateSubject,
}: {
  form: FormState;
  toggleSubject: (cat: SubjectCategory, subjectId: string) => void;
  updateSubject: (
    cat: SubjectCategory,
    subjectId: string,
    next: Partial<SubjectEntry>,
  ) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-500">
        記録する科目を選んで、点数を入れてください。1テストで複数記録 OK。
      </p>
      {form.selectedCategories.map((catId) => {
        const cat = getCategoryDef(catId);
        const list = subjectsForCategory(catId, form.grade);
        const entries = form.subjects.filter((s) => s.category === catId);
        return (
          <Card key={catId}>
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
              <span className="ml-auto text-[10px] font-medium text-ink-400">
                {entries.length} 科目
              </span>
            </div>

            {/* サブ科目: 複数選択可能 */}
            {list.length > 1 ? (
              <div className="mt-2.5">
                <Label>記録する科目（複数選択可）</Label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {list.map((s) => {
                    const active = entries.some((e) => e.subjectId === s.id);
                    return (
                      <Chip
                        key={s.id}
                        active={active}
                        onClick={() => toggleSubject(catId, s.id)}
                      >
                        {active ? "✓ " : ""}{s.shortName}
                      </Chip>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* 選択中の各サブ科目の点数入力 */}
            <div className="mt-3 space-y-3">
              {entries.map((entry) => {
                const def = list.find((s) => s.id === entry.subjectId);
                return (
                  <SubjectScoreInput
                    key={entry.subjectId}
                    title={def?.name ?? def?.shortName ?? entry.subjectId}
                    entry={entry}
                    showTitle={entries.length > 1 || list.length > 1}
                    onChange={(next) =>
                      updateSubject(entry.category, entry.subjectId, next)
                    }
                  />
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// 1サブ科目の点数 + 偏差値 (任意) 入力
function SubjectScoreInput({
  title,
  entry,
  showTitle,
  onChange,
}: {
  title: string;
  entry: SubjectEntry;
  showTitle: boolean;
  onChange: (next: Partial<SubjectEntry>) => void;
}) {
  const score = Number(entry.score) || 0;
  const fullScore = Number(entry.fullScore) || 100;
  const pct = fullScore > 0 ? Math.round((score / fullScore) * 100) : 0;

  return (
    <div className="rounded-xl bg-cream-50/60 p-3">
      {showTitle ? (
        <div className="mb-2 text-[12px] font-bold text-ink-900">{title}</div>
      ) : null}

      {/* 満点設定 (コンパクト) */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium text-ink-500">満点</span>
        <input
          type="number"
          inputMode="numeric"
          value={entry.fullScore}
          onChange={(e) => onChange({ fullScore: e.target.value })}
          className="h-8 w-16 rounded-lg border border-cream-200 bg-white px-2 text-right text-sm font-bold text-ink-900 outline-none focus:border-sky-400"
        />
        <span className="text-[10px] font-medium text-ink-500">点</span>
      </div>

      {/* 点数スライダー + 数値 */}
      <div className="mt-2.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
            得点
          </span>
          <span className="text-[10px] font-medium tabular-nums text-ink-500">
            {pct > 0 ? `${pct}%` : ""}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2.5">
          <input
            type="range"
            min={0}
            max={fullScore}
            step={1}
            value={score}
            onChange={(e) => onChange({ score: e.target.value })}
            className="flex-1 accent-sky-500"
          />
          <input
            type="number"
            inputMode="numeric"
            value={entry.score}
            onChange={(e) => onChange({ score: e.target.value })}
            placeholder="0"
            className="h-9 w-16 flex-none rounded-lg border border-cream-200 bg-white px-2 text-right text-sm font-bold text-ink-900 outline-none focus:border-sky-400"
          />
        </div>
      </div>

      {/* 偏差値 (任意) */}
      <div className="mt-3 border-t border-cream-200/60 pt-2.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
            偏差値 <span className="font-medium normal-case tracking-normal text-ink-400">(任意)</span>
          </span>
          <span className="text-[10px] font-medium tabular-nums text-ink-500">
            {entry.deviation ? `${entry.deviation}` : "—"}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2.5">
          <input
            type="range"
            min={30}
            max={80}
            step={1}
            value={Number(entry.deviation) || 50}
            onChange={(e) => onChange({ deviation: e.target.value })}
            className="flex-1 accent-mint-500"
          />
          <input
            type="number"
            inputMode="numeric"
            value={entry.deviation ?? ""}
            onChange={(e) => onChange({ deviation: e.target.value })}
            placeholder="—"
            min={20}
            max={90}
            className="h-9 w-16 flex-none rounded-lg border border-cream-200 bg-white px-2 text-right text-sm font-bold text-ink-900 outline-none focus:border-sky-400"
          />
        </div>
      </div>
    </div>
  );
}

// カテゴリ別の出題形式オプション
const FORMAT_OPTIONS: Record<SubjectCategory, { id: QuestionFormat; label: string }[]> = {
  math: [
    { id: "math-calc", label: "計算" },
    { id: "math-essay", label: "文章題" },
    { id: "math-proof", label: "証明" },
    { id: "math-choice", label: "記号" },
  ],
  english: [
    { id: "eng-vocab", label: "単語・熟語" },
    { id: "eng-grammar", label: "文法" },
    { id: "eng-reading", label: "読解" },
    { id: "eng-listening", label: "リスニング" },
    { id: "eng-writing", label: "英作文" },
  ],
  japanese: [
    { id: "jp-reading", label: "読解" },
    { id: "jp-desc", label: "記述" },
    { id: "jp-choice", label: "選択" },
    { id: "jp-summary", label: "要約" },
    { id: "jp-knowledge", label: "漢字・語彙" },
  ],
  science: [
    { id: "sci-calc", label: "計算" },
    { id: "sci-desc", label: "記述" },
    { id: "sci-experiment", label: "実験考察" },
    { id: "sci-choice", label: "選択" },
  ],
  social: [
    { id: "soc-shortans", label: "一問一答" },
    { id: "soc-desc", label: "記述" },
    { id: "soc-essay", label: "論述" },
    { id: "soc-choice", label: "選択" },
  ],
  info: [
    { id: "math-calc", label: "計算" },
    { id: "math-choice", label: "選択" },
  ],
};

function UnitStep({
  form,
  setUnit,
  addUnit,
  removeUnit,
}: {
  form: FormState;
  setUnit: (
    cat: SubjectCategory,
    subjectId: string,
    idx: number,
    next: Partial<UnitInputExt>,
  ) => void;
  addUnit: (cat: SubjectCategory, subjectId: string) => void;
  removeUnit: (cat: SubjectCategory, subjectId: string, idx: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-sky-50/60 px-3 py-2.5 text-[11px] leading-[1.6] text-sky-700">
        <span className="font-bold">スキップしてOK。</span>
        単元・出題形式・配点まで入れると AI の弱点分析がぐっと正確になります。
      </div>

      {form.subjects.map((entry) => {
        const cat = getCategoryDef(entry.category);
        const def = subjectsForCategory(entry.category, form.grade).find(
          (s) => s.id === entry.subjectId,
        );
        const unitOptions = def?.units ?? [];
        const formats = FORMAT_OPTIONS[entry.category] ?? [];

        return (
          <section
            key={`${entry.category}:${entry.subjectId}`}
            className="rounded-2xl border border-cream-200 bg-white p-3 shadow-soft"
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
                {def?.name ?? def?.shortName ?? cat.name}
              </span>
            </header>

            <ul className="space-y-2 border-t border-cream-200 pt-2">
              {entry.units.map((u, idx) => (
                <li
                  key={idx}
                  className="rounded-xl border border-cream-200 bg-cream-50 p-3"
                >
                  {/* 単元 + 削除 */}
                  <div className="flex items-start gap-2">
                    <select
                      value={u.unit}
                      onChange={(e) =>
                        setUnit(entry.category, entry.subjectId, idx, {
                          unit: e.target.value,
                        })
                      }
                      className="h-9 flex-1 rounded-lg border border-cream-200 bg-white px-2 text-xs font-bold text-ink-900 outline-none focus:border-sky-400"
                    >
                      {unitOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                      {!unitOptions.includes(u.unit) ? (
                        <option value={u.unit}>{u.unit}</option>
                      ) : null}
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        removeUnit(entry.category, entry.subjectId, idx)
                      }
                      className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-ink-400 hover:bg-cream-100"
                      aria-label="削除"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* 出題形式 (科目別、複数選択ではなく1つだけ) */}
                  {formats.length > 0 ? (
                    <div className="mt-2">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-ink-500">
                        出題形式
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {formats.map((f) => (
                          <button
                            type="button"
                            key={f.id}
                            onClick={() =>
                              setUnit(entry.category, entry.subjectId, idx, {
                                format: u.format === f.id ? undefined : f.id,
                              })
                            }
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-bold transition",
                              u.format === f.id
                                ? "bg-sky-500 text-white"
                                : "bg-white text-ink-500 hover:bg-cream-100",
                            )}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* 問題数 / 正答数 (スライダー) */}
                  <div className="mt-2.5 space-y-1.5">
                    <SliderRow
                      label="問題数"
                      value={u.total ?? 0}
                      min={0}
                      max={10}
                      onChange={(v) =>
                        setUnit(entry.category, entry.subjectId, idx, {
                          total: v,
                          correct: Math.min(u.correct ?? 0, v),
                        })
                      }
                      suffix="問"
                    />
                    <SliderRow
                      label="正答数"
                      value={u.correct ?? 0}
                      min={0}
                      max={Math.max(1, u.total ?? 0)}
                      disabled={(u.total ?? 0) === 0}
                      onChange={(v) =>
                        setUnit(entry.category, entry.subjectId, idx, {
                          correct: v,
                        })
                      }
                      suffix="正答"
                    />
                    <SliderRow
                      label="1問の配点"
                      value={u.pointValue ?? 0}
                      min={0}
                      max={10}
                      onChange={(v) =>
                        setUnit(entry.category, entry.subjectId, idx, {
                          pointValue: v,
                        })
                      }
                      suffix="点"
                    />
                  </div>

                  {/* 正答率表示 */}
                  {u.total && u.total > 0 ? (
                    <div className="mt-2 text-right text-[10px] font-bold text-ink-500 tabular-nums">
                      正答率 {Math.round(((u.correct ?? 0) / u.total) * 100)}%
                    </div>
                  ) : null}

                  {/* ミスの原因 */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {CAUSE_OPTIONS.map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() =>
                          setUnit(entry.category, entry.subjectId, idx, {
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
              onClick={() => addUnit(entry.category, entry.subjectId)}
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

// 共通スライダー (1〜10 系の数値入力)
function SliderRow({
  label,
  value,
  min,
  max,
  onChange,
  suffix,
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  suffix?: string;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2",
        disabled && "opacity-50 pointer-events-none",
      )}
    >
      <span className="w-16 flex-none text-[10px] font-bold text-ink-500">
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-sky-500"
      />
      <span className="flex-none w-12 text-right text-[11px] font-bold tabular-nums text-ink-900">
        {value || 0}
        {suffix ? <span className="ml-0.5 text-[9px] font-medium text-ink-500">{suffix}</span> : null}
      </span>
    </div>
  );
}

// 診断 AI に渡す履歴コンテキストを sessionStorage から組み立てる
function buildHistoryContext(): TestInput["history"] {
  const store = readStore();
  const pastTests = (store.tests ?? []).slice(0, 5).map((t) => ({
    testName: t.input.testName,
    subject: t.input.subject,
    scorePct:
      t.input.fullScore > 0
        ? Math.round((t.input.score / t.input.fullScore) * 100)
        : 0,
    deviation: t.input.deviation,
    createdAt: t.createdAt,
    weakUnits: (t.diagnosis.weaknesses ?? [])
      .slice(0, 3)
      .map((w) => w.unit),
  }));
  const cutoffMs = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const recentBlockLogs = (store.blockLogs ?? [])
    .filter((b) => new Date(b.completedAt).getTime() >= cutoffMs)
    .map((b) => ({
      date: b.completedAt.slice(0, 10),
      rating: b.rating,
    }));
  const bookshelf = (store.profile?.bookshelfItems ?? []).map((b) => ({
    name: b.name,
    kind: b.kind,
  }));
  return { pastTests, recentBlockLogs, bookshelf };
}

function ConfidenceBadge({ level }: { level: Confidence }) {
  const meta = {
    high: { label: "信頼度 高", tone: "bg-mint-100 text-mint-600" },
    medium: { label: "信頼度 中", tone: "bg-sun-200/60 text-ink-700" },
    low: { label: "信頼度 低", tone: "bg-coral-300/20 text-coral-500" },
  }[level];
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-bold",
        meta.tone,
      )}
    >
      {meta.label}
    </span>
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
