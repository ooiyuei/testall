"use client";

// 共通コンポーネント + Steps 1–2 (学年・高校) + Steps 7–10 (勉強時間・スケジュール・休日・得意苦手)

import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { GRADES } from "@/lib/subjects";
import { searchHighschools } from "@/lib/master/highschools";
import { remoteEnabled, remoteSearchHighschools } from "@/lib/master/remote";
import { mergedHighschools } from "@/lib/master/userAdditions";
import type { Highschool } from "@/lib/master";
import { DEVIATION_BUCKETS } from "@/lib/store";
import type { DeviationBucket, SubjectAreaId } from "@/lib/store";

// ── 共通データ ────────────────────────────────────────
export const SUBJECT_AREAS: { id: SubjectAreaId; label: string }[] = [
  { id: "japanese", label: "国語" },
  { id: "math", label: "数学" },
  { id: "english", label: "英語" },
  { id: "science", label: "理科" },
  { id: "social", label: "社会" },
];

export const FACULTY_CATEGORIES = [
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

export const WEEKDAY_OPTIONS = [
  { label: "〜1h", minutes: 45 },
  { label: "1〜2h", minutes: 90 },
  { label: "2〜3h", minutes: 150 },
  { label: "3〜4h", minutes: 210 },
  { label: "4h〜", minutes: 270 },
];

export const WEEKEND_OPTIONS = [
  { label: "〜2h", minutes: 60 },
  { label: "2〜4h", minutes: 180 },
  { label: "4〜6h", minutes: 300 },
  { label: "6〜8h", minutes: 420 },
  { label: "8h〜", minutes: 540 },
];

function minutesToTime(totalMin: number): string {
  const h = Math.floor(totalMin / 60) % 24;
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function makeTimeOptions(startMin: number, endMin: number, stepMin = 30): string[] {
  const opts: string[] = [];
  for (let m = startMin; m <= endMin; m += stepMin) opts.push(minutesToTime(m));
  return opts;
}

export const WAKEUP_OPTIONS = makeTimeOptions(5 * 60, 10 * 60);
export const RETURN_OPTIONS = makeTimeOptions(14 * 60, 23 * 60);
export const BED_OPTIONS = makeTimeOptions(20 * 60, 26 * 60);

// ── 共通: StepHeader ─────────────────────────────────
export function StepHeader({
  title,
  subtitle,
  step,
}: {
  title: string;
  subtitle?: string;
  step?: string;
}) {
  return (
    <div className="mb-7">
      {step ? (
        <div className="text-[11px] font-extrabold tracking-[0.04em] text-sky-500">
          {step}
        </div>
      ) : null}
      <h1
        className="mt-2 text-[28px] font-extrabold leading-[1.15] tracking-[-0.025em] text-ink-900"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2.5 text-[13px] leading-[1.75] text-ink-500">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

// ── 共通: BucketPicker ───────────────────────────────
// PDF/Design Canvas 準拠: 中央に大きな数字 + バケツグリッド(黒選択)
const BUCKET_DESCRIPTIONS: Record<string, string> = {
  lt45: "まだまだ",
  "45-50": "少し",
  "50-55": "まあまあ",
  "55-60": "普通",
  "60-65": "よく",
  "65-70": "かなり",
  "70-75": "トップ",
  gte75: "最上位",
};
export function BucketPicker({
  value,
  onChange,
}: {
  label?: string;
  value: DeviationBucket;
  onChange: (v: DeviationBucket) => void;
  tone?: "sky" | "peach";
}) {
  const current = DEVIATION_BUCKETS.find((b) => b.id === value) ?? DEVIATION_BUCKETS[3];
  return (
    <div>
      {/* 大きな数字 + ±2 */}
      <div className="text-center">
        <div className="inline-flex items-baseline gap-1">
          <span
            className="text-[88px] font-extrabold leading-[0.95] tracking-[-0.04em] tabular-nums text-ink-900"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {current.mid}
          </span>
          <span className="text-[20px] font-semibold text-ink-400">± 2</span>
        </div>
      </div>
      {/* 4列 × 2行 グリッド */}
      <div className="mt-8 grid grid-cols-4 gap-2">
        {DEVIATION_BUCKETS.map((b) => {
          const active = b.id === value;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onChange(b.id)}
              aria-pressed={active}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-3 transition active:scale-[0.97]",
                active
                  ? "bg-ink-900 text-white"
                  : "border border-ink-100 bg-white text-ink-900 hover:bg-cream-50",
              )}
            >
              <span className="text-[12px] font-bold tabular-nums tracking-[-0.01em]">
                {b.label}
              </span>
              <span className={cn("text-[10px] font-medium", active ? "text-white/60" : "text-ink-400")}>
                {BUCKET_DESCRIPTIONS[b.id] ?? ""}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 1: 学年 ─────────────────────────────────────
// PDF/Design Canvas 準拠: 2x2 グリッド、選択=黒背景+白文字
export function GradeStep({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <>
      <StepHeader
        title="学年を教えて"
        subtitle="学年に合った単元・参考書ルートを準備します。"
      />
      <div className="grid grid-cols-2 gap-2">
        {GRADES.map((g) => {
          const active = value === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => onChange(g.id)}
              aria-pressed={active}
              className={cn(
                "flex h-14 items-center justify-center rounded-xl text-[14px] font-bold transition active:scale-[0.98]",
                active
                  ? "bg-ink-900 text-white"
                  : "border border-ink-100 bg-cream-50 text-ink-900 hover:bg-white",
              )}
            >
              {g.name}
            </button>
          );
        })}
      </div>
    </>
  );
}

// ── Step 2: 高校 ─────────────────────────────────────
export function SchoolStep({
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

  const localResults = useMemo((): Highschool[] => {
    if (!query.trim()) return [];
    const base = searchHighschools(query.trim(), 30);
    const merged = mergedHighschools([]);
    const userAdded = merged.filter((h) => h.searchText?.includes(query.toLowerCase()));
    return [...userAdded, ...base];
  }, [query]);

  useEffect(() => {
    if (!useRemote) return;
    const q = query.trim();
    if (!q) { setRemoteResults([]); return; }
    const t = setTimeout(async () => {
      const rs = await remoteSearchHighschools(q, 30);
      setRemoteResults(rs);
    }, 300);
    return () => clearTimeout(t);
  }, [query, useRemote]);

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

  function pick(name: string) { onChange(name); setQuery(name); }

  return (
    <>
      <StepHeader
        title="通っている学校"
        subtitle="任意。同じ学校の人と比較するのに使います。"
      />
      <label htmlFor="school-search" className="sr-only">高校名を検索</label>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" strokeWidth={1.75} />
        <input
          id="school-search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); }}
          placeholder="高校名を検索（例：日比谷）"
          className="h-12 w-full rounded-xl border border-cream-200 bg-white pl-10 pr-3 text-[15px] text-ink-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
          autoComplete="off"
        />
      </div>

      {results.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {results.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => pick(h.name)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl p-3.5 text-left transition",
                  value === h.name ? "bg-sky-50 ring-2 ring-sky-400/30" : "bg-white hover:bg-cream-50",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-bold text-ink-900">{h.name}</div>
                  <div className="mt-0.5 text-[11px] text-ink-500">
                    {h.prefecture}{h.city ? ` · ${h.city}` : ""} ·{" "}
                    {h.type === "private" ? "私立" : h.type === "national" ? "国立" : "公立"}
                    {h.deviation ? ` · 偏差値 ${h.deviation}` : ""}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {query.trim() && results.length === 0 && (
        <button
          type="button"
          onClick={onAdd}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-cream-200 bg-white p-4 text-[13px] text-ink-500 hover:border-sky-300 hover:bg-sky-50 transition"
        >
          <Plus className="h-4 w-4" strokeWidth={1.75} />
          「{query}」が見つからない — 追加する
        </button>
      )}
      <p className="mt-4 text-[12px] text-ink-400">空欄でも構いません。後から設定で変えられます。</p>
    </>
  );
}

// ── Step 7: 勉強時間 ─────────────────────────────────
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
    <div className="rounded-2xl border border-cream-200 bg-white p-4">
      <p className="mb-3 text-[13px] font-bold text-ink-800">{label}</p>
      <div className="grid grid-cols-5 gap-1.5">
        {options.map((o, i) => (
          <button
            key={o.label}
            type="button"
            onClick={() => onChange(i)}
            aria-pressed={selectedIdx === i}
            className={cn(
              "flex flex-col items-center justify-center rounded-xl py-3 text-[12px] font-bold transition active:scale-[0.97]",
              selectedIdx === i ? "bg-sky-500 text-white shadow-sm" : "bg-cream-50 text-ink-600 hover:bg-cream-100",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function StudyTimeStep({
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
      <StepHeader title="1日の勉強時間" subtitle="おおよそでOK。AIが現実的な計画を組みます。" />
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

// ── Step 8: スケジュール ─────────────────────────────
function TimeScroller({
  label,
  inputId,
  options,
  value,
  onChange,
}: {
  label: string;
  inputId: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const step = Math.max(1, Math.floor(options.length / 4));
  const presets: string[] = [];
  for (let i = 0; i < options.length; i += step) presets.push(options[i]);
  if (presets[presets.length - 1] !== options[options.length - 1]) {
    presets.push(options[options.length - 1]);
  }
  const display = presets.slice(0, 5);

  return (
    <div className="rounded-2xl border border-ink-100/80 bg-white p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <label htmlFor={inputId} className="text-[13px] font-bold text-ink-800">{label}</label>
        <span className="text-[18px] font-bold tabular-nums text-ink-900">{value}</span>
      </div>
      <ul className="grid grid-cols-5 gap-1.5">
        {display.map((t) => (
          <li key={t}>
            <button
              type="button"
              onClick={() => onChange(t)}
              aria-pressed={value === t}
              className={cn(
                "h-10 w-full rounded-xl text-[12px] font-bold tabular-nums transition active:scale-[0.97]",
                value === t ? "bg-ink-900 text-white" : "bg-cream-50 text-ink-700 hover:bg-cream-100",
              )}
            >
              {t}
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2.5 flex items-center gap-2">
        <input
          id={inputId}
          type="time"
          step={1800}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 flex-1 rounded-xl border border-ink-100/80 bg-cream-50 px-2.5 text-[13px] text-ink-900 outline-none focus:border-sky-400 focus:bg-white"
        />
        <span className="text-[11px] text-ink-400">詳細入力</span>
      </div>
    </div>
  );
}

export function ScheduleStep({
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
      <StepHeader title="平日のスケジュール" subtitle="勉強できる時間帯を把握して、計画に反映します。" />
      <TimeScroller label="起床" inputId="sched-wakeup" options={WAKEUP_OPTIONS} value={wakeup} onChange={onChangeWakeup} />
      <div className="mt-3" />
      <TimeScroller label="帰宅" inputId="sched-return" options={RETURN_OPTIONS} value={returnT} onChange={onChangeReturn} />
      <div className="mt-3" />
      <TimeScroller label="就寝" inputId="sched-bed" options={BED_OPTIONS} value={bed} onChange={onChangeBed} />
    </>
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

export function WeekendStep({
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
      <StepHeader title="休日の使い方" subtitle="勉強に使える日・時間帯を教えてください。" />
      <div className="grid gap-3">
        {WEEKEND_DAY_OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => toggle(o.id)}
            aria-pressed={value.includes(o.id)}
            className={cn(
              "flex h-14 items-center justify-between rounded-2xl border-2 px-5 text-left transition active:scale-[0.99]",
              value.includes(o.id)
                ? "border-sky-500 bg-sky-50 ring-2 ring-sky-500/20"
                : "border-cream-200 bg-white hover:bg-cream-50",
            )}
          >
            <div>
              <div className="text-[15px] font-bold text-ink-900">{o.label}</div>
              <div className="text-[12px] text-ink-500">{o.sub}</div>
            </div>
            <span className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full border-2",
              value.includes(o.id) ? "border-sky-500 bg-sky-500" : "border-cream-300 bg-white",
            )}>
              {value.includes(o.id) && <span className="h-2 w-2 rounded-full bg-white" />}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-4 text-[12px] text-ink-400">どれも選ばなくてもOKです。</p>
    </>
  );
}

// ── Step 10: 得意・苦手 ──────────────────────────────
type Proficiency = "good" | "fair" | "weak" | "bad";

const PROFICIENCY_OPTIONS: { id: Proficiency; label: string; active: string }[] = [
  { id: "good", label: "得意", active: "bg-mint-100 text-mint-600 border-mint-300" },
  { id: "fair", label: "まあまあ", active: "bg-sky-100 text-sky-600 border-sky-200" },
  { id: "weak", label: "苦手", active: "bg-sun-100 text-amber-600 border-amber-200" },
  { id: "bad", label: "超苦手", active: "bg-coral-100 text-red-500 border-red-200" },
];

export function StrengthsStep({
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
      <StepHeader title="教科の得意・苦手" subtitle="AIが重点的に補強する教科を判断します。" />
      <div className="space-y-3">
        {SUBJECT_AREAS.map((s) => (
          <div key={s.id} className="rounded-2xl border border-cream-200 bg-white p-4">
            <div className="mb-3 text-[14px] font-bold text-ink-900">{s.label}</div>
            <div className="grid grid-cols-4 gap-1.5">
              {PROFICIENCY_OPTIONS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => set(s.id, p.id)}
                  aria-pressed={value[s.id] === p.id}
                  className={cn(
                    "rounded-xl border py-3 text-[12px] font-bold transition active:scale-[0.97]",
                    value[s.id] === p.id
                      ? p.active
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
      <p className="mt-4 text-[12px] text-ink-400">未選択のままでもOK。後から変えられます。</p>
    </>
  );
}
