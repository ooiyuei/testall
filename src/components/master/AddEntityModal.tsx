"use client";

// 大学・高校・参考書・模試の手動追加モーダル（ボトムシート）
// 検索で見つからない時に「＋追加する」から呼ばれる
// 入力データは userAdditions（sessionStorage）に保存される
// TODO: Supabase 接続後は user_master_additions テーブルへ

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  addHighschool,
  addMockExam,
  addTextbook,
  addUniversity,
} from "@/lib/master";
import type {
  Highschool,
  MockExam,
  MockExamProvider,
  Textbook,
  TextbookLevel,
  University,
} from "@/lib/master";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";

export type AddEntityKind = "university" | "highschool" | "textbook" | "mock-exam";

type Props = {
  kind: AddEntityKind;
  initialName?: string;
  onClose: () => void;
  onAdded?: (id: string) => void;
};

export function AddEntityModal({ kind, initialName, onClose, onAdded }: Props) {
  const trapRef = useFocusTrap<HTMLDivElement>(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-ink-900/40 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={`${KIND_LABELS[kind]}を追加`}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="閉じる"
        onClick={onClose}
      />
      <div
        ref={trapRef}
        className="relative z-10 w-full max-w-[480px] mx-auto rounded-t-3xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-cream-200 bg-white px-4 py-3">
          <h2 className="text-base font-black text-ink-900">
            {KIND_LABELS[kind]}を追加
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-500 hover:bg-cream-100"
            aria-label="閉じる"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 py-4 pb-8">
          {kind === "university" ? (
            <UniversityForm
              initialName={initialName}
              onSubmit={(d) => {
                const a = addUniversity(d);
                onAdded?.(a.data.id ?? "");
                onClose();
              }}
            />
          ) : null}
          {kind === "highschool" ? (
            <HighschoolForm
              initialName={initialName}
              onSubmit={(d) => {
                const a = addHighschool(d);
                onAdded?.(a.data.id ?? "");
                onClose();
              }}
            />
          ) : null}
          {kind === "textbook" ? (
            <TextbookForm
              initialName={initialName}
              onSubmit={(d) => {
                const a = addTextbook(d);
                onAdded?.(a.data.id ?? "");
                onClose();
              }}
            />
          ) : null}
          {kind === "mock-exam" ? (
            <MockExamForm
              initialName={initialName}
              onSubmit={(d) => {
                const a = addMockExam(d);
                onAdded?.(a.data.id ?? "");
                onClose();
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

const KIND_LABELS: Record<AddEntityKind, string> = {
  university: "大学",
  highschool: "高校",
  textbook: "参考書",
  "mock-exam": "模試",
};

// ─── 共通 UI ────────────────────────────────────
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-ink-700">{label}</span>
      {hint ? <span className="ml-1 text-[10px] text-ink-400">{hint}</span> : null}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-10 w-full rounded-xl border border-cream-200 bg-cream-50 px-3 text-sm text-ink-900 outline-none focus:border-sky-400 focus:bg-white",
        props.className,
      )}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-10 w-full rounded-xl border border-cream-200 bg-cream-50 px-3 text-sm text-ink-900 outline-none focus:border-sky-400 focus:bg-white",
        props.className,
      )}
    />
  );
}

function SubmitButton({ disabled }: { disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={cn(
        "mt-2 flex h-12 w-full items-center justify-center rounded-2xl text-sm font-black text-white transition active:scale-[0.98]",
        disabled ? "bg-ink-300" : "bg-sky-500",
      )}
    >
      追加する
    </button>
  );
}

// ─── 大学 ────────────────────────────────
function UniversityForm({
  initialName,
  onSubmit,
}: {
  initialName?: string;
  onSubmit: (d: Omit<University, "id" | "searchText" | "source">) => void;
}) {
  const [name, setName] = useState(initialName ?? "");
  const [kana, setKana] = useState("");
  const [shortName, setShortName] = useState("");
  const [type, setType] = useState<University["type"]>("private");
  const [region, setRegion] = useState("関東");
  const [schoolCode, setSchoolCode] = useState("");
  const [facultyName, setFacultyName] = useState("");
  const [deviation, setDeviation] = useState<number | "">("");

  function handle(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      name,
      shortName: shortName || undefined,
      kana: kana || undefined,
      schoolCode: schoolCode || undefined,
      type,
      region,
      faculties: facultyName
        ? [
            {
              id: `tmp-${facultyName}`,
              name: facultyName,
              category: "general",
              deviation: typeof deviation === "number" ? deviation : undefined,
            },
          ]
        : [],
    });
  }

  return (
    <form onSubmit={handle} className="space-y-3">
      <Field label="大学名" hint="必須">
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例：○○大学"
          required
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="略称">
          <TextInput
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
            placeholder="○大"
          />
        </Field>
        <Field label="ふりがな">
          <TextInput
            value={kana}
            onChange={(e) => setKana(e.target.value)}
            placeholder="ひらがな"
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="種別">
          <Select
            value={type}
            onChange={(e) => setType(e.target.value as University["type"])}
          >
            <option value="national">国立</option>
            <option value="public">公立</option>
            <option value="private">私立</option>
          </Select>
        </Field>
        <Field label="地域">
          <Select value={region} onChange={(e) => setRegion(e.target.value)}>
            {["北海道", "東北", "関東", "中部", "関西", "中国", "四国", "九州"].map(
              (r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ),
            )}
          </Select>
        </Field>
      </div>
      <Field label="学校コード" hint="文科省 13桁・任意">
        <TextInput
          value={schoolCode}
          onChange={(e) => setSchoolCode(e.target.value)}
          placeholder="例：8300001"
        />
      </Field>
      <div className="rounded-xl bg-cream-50 p-3">
        <div className="text-[10px] font-bold text-ink-500 mb-1">学部（任意）</div>
        <div className="grid grid-cols-3 gap-2">
          <TextInput
            value={facultyName}
            onChange={(e) => setFacultyName(e.target.value)}
            placeholder="学部名"
            className="col-span-2"
          />
          <TextInput
            type="number"
            value={deviation}
            onChange={(e) =>
              setDeviation(e.target.value ? Number(e.target.value) : "")
            }
            placeholder="偏差値"
          />
        </div>
      </div>
      <SubmitButton disabled={!name.trim()} />
    </form>
  );
}

// ─── 高校 ────────────────────────────────
function HighschoolForm({
  initialName,
  onSubmit,
}: {
  initialName?: string;
  onSubmit: (d: Omit<Highschool, "id" | "searchText" | "source">) => void;
}) {
  const [name, setName] = useState(initialName ?? "");
  const [kana, setKana] = useState("");
  const [prefecture, setPrefecture] = useState("東京都");
  const [city, setCity] = useState("");
  const [type, setType] = useState<Highschool["type"]>("public");
  const [schoolCode, setSchoolCode] = useState("");
  const [semester, setSemester] = useState<Highschool["semesterSystem"]>("3-term");
  const [deviation, setDeviation] = useState<number | "">("");

  function handle(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      name,
      kana: kana || undefined,
      prefecture,
      city: city || undefined,
      type,
      schoolCode: schoolCode || undefined,
      semesterSystem: semester ?? undefined,
      deviation: typeof deviation === "number" ? deviation : undefined,
    });
  }

  return (
    <form onSubmit={handle} className="space-y-3">
      <Field label="高校名" hint="必須">
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例：○○高等学校"
          required
        />
      </Field>
      <Field label="ふりがな">
        <TextInput
          value={kana}
          onChange={(e) => setKana(e.target.value)}
          placeholder="ひらがな"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="都道府県">
          <Select
            value={prefecture}
            onChange={(e) => setPrefecture(e.target.value)}
          >
            {PREFECTURES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="市区町村">
          <TextInput
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="○○市"
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="種別">
          <Select
            value={type}
            onChange={(e) => setType(e.target.value as Highschool["type"])}
          >
            <option value="national">国立</option>
            <option value="public">公立</option>
            <option value="private">私立</option>
          </Select>
        </Field>
        <Field label="学期制">
          <Select
            value={semester ?? "unknown"}
            onChange={(e) =>
              setSemester(e.target.value as Highschool["semesterSystem"])
            }
          >
            <option value="3-term">3学期制</option>
            <option value="2-term">2学期制</option>
            <option value="quarter">クォーター制</option>
            <option value="unknown">不明</option>
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="学校コード" hint="13桁・任意">
          <TextInput
            value={schoolCode}
            onChange={(e) => setSchoolCode(e.target.value)}
            placeholder="13100A005340"
          />
        </Field>
        <Field label="偏差値" hint="任意">
          <TextInput
            type="number"
            value={deviation}
            onChange={(e) =>
              setDeviation(e.target.value ? Number(e.target.value) : "")
            }
          />
        </Field>
      </div>
      <SubmitButton disabled={!name.trim()} />
    </form>
  );
}

// ─── 参考書 ────────────────────────────────
function TextbookForm({
  initialName,
  onSubmit,
}: {
  initialName?: string;
  onSubmit: (d: Omit<Textbook, "id" | "searchText" | "source">) => void;
}) {
  const [name, setName] = useState(initialName ?? "");
  const [isbn, setIsbn] = useState("");
  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState("");
  const [subject, setSubject] = useState("math");
  const [level, setLevel] = useState<TextbookLevel>("standard");
  const [reps, setReps] = useState<number | "">("");

  function handle(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      name,
      isbn: isbn || undefined,
      author: author || undefined,
      publisher,
      subject,
      level,
      forGrades: ["h2", "h3", "ronin"],
      usageTags: ["drill"],
      recommendedReps: typeof reps === "number" ? reps : undefined,
      legacyTags: [],
    });
  }

  return (
    <form onSubmit={handle} className="space-y-3">
      <Field label="書名" hint="必須">
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例：○○問題集"
          required
        />
      </Field>
      <Field label="ISBN" hint="13桁・後で書影自動取得に使う">
        <TextInput
          value={isbn}
          onChange={(e) => setIsbn(e.target.value)}
          placeholder="9784..."
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="著者">
          <TextInput
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
        </Field>
        <Field label="出版社" hint="必須">
          <TextInput
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
            required
          />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="科目">
          <Select value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="japanese">国語</option>
            <option value="math">数学</option>
            <option value="english">英語</option>
            <option value="science">理科</option>
            <option value="social">社会</option>
            <option value="info">情報</option>
          </Select>
        </Field>
        <Field label="難易度">
          <Select
            value={level}
            onChange={(e) => setLevel(e.target.value as TextbookLevel)}
          >
            <option value="basic">基礎</option>
            <option value="standard">標準</option>
            <option value="advanced">応用</option>
            <option value="top">最難関</option>
          </Select>
        </Field>
        <Field label="周回">
          <TextInput
            type="number"
            value={reps}
            onChange={(e) =>
              setReps(e.target.value ? Number(e.target.value) : "")
            }
            placeholder="3"
          />
        </Field>
      </div>
      <SubmitButton disabled={!name.trim() || !publisher.trim()} />
    </form>
  );
}

// ─── 模試 ────────────────────────────────
function MockExamForm({
  initialName,
  onSubmit,
}: {
  initialName?: string;
  onSubmit: (d: Omit<MockExam, "id" | "searchText" | "source">) => void;
}) {
  const [name, setName] = useState(initialName ?? "");
  const [provider, setProvider] = useState<MockExamProvider>("school");
  const [year, setYear] = useState(new Date().getFullYear());
  const [examDate, setExamDate] = useState("");
  const [grade, setGrade] = useState("h3");

  function handle(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      name,
      provider,
      year,
      examDate: examDate || undefined,
      targetGrades: [grade],
      format: "mark-descriptive",
    });
  }

  return (
    <form onSubmit={handle} className="space-y-3">
      <Field label="模試名" hint="必須">
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例：○○模試 第1回"
          required
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="主催">
          <Select
            value={provider}
            onChange={(e) => setProvider(e.target.value as MockExamProvider)}
          >
            <option value="kawai">河合塾</option>
            <option value="sundai">駿台</option>
            <option value="toshin">東進</option>
            <option value="yozemi">代ゼミ</option>
            <option value="benesse">ベネッセ</option>
            <option value="shinken">進研模試</option>
            <option value="school">校内実施</option>
            <option value="other">その他</option>
          </Select>
        </Field>
        <Field label="年度">
          <TextInput
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="実施日">
          <TextInput
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
          />
        </Field>
        <Field label="対象学年">
          <Select value={grade} onChange={(e) => setGrade(e.target.value)}>
            <option value="h1">高1</option>
            <option value="h2">高2</option>
            <option value="h3">高3</option>
            <option value="ronin">浪人</option>
          </Select>
        </Field>
      </div>
      <SubmitButton disabled={!name.trim()} />
    </form>
  );
}

const PREFECTURES = [
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県",
];
