"use client";

// Steps 3–6: 偏差値・目標偏差値・大学タイプ・志望校

import { useMemo, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  TIER_LABEL,
  UNIVERSITIES as MASTER_UNIVERSITIES,
} from "@/lib/master/universities";
import { mergedUniversities } from "@/lib/master/userAdditions";
import type { University } from "@/lib/master";
import { DEVIATION_BUCKETS } from "@/lib/store";
import type { DeviationBucket, SubjectAreaId, TargetUniversity } from "@/lib/store";
import { StepHeader, BucketPicker, SUBJECT_AREAS, FACULTY_CATEGORIES } from "./OnboardingStepsCommon";

// ── Step 3: 現在の偏差値 ────────────────────────────
export function DeviationStep({
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
      <StepHeader
        title="今の偏差値は？"
        subtitle="おおよその帯でOK。模試結果から自動補正されます。"
      />
      <BucketPicker label="平均偏差値" value={current} onChange={onChangeCurrent} tone="sky" />
      <div className="mt-6">
        <p className="mb-3 text-[12px] font-medium text-ink-500">
          教科ごとに違う場合は任意で設定（空欄なら平均値を使います）
        </p>
        <div className="space-y-3">
          {SUBJECT_AREAS.map((s) => (
            <div key={s.id} className="rounded-2xl border border-cream-200 bg-white p-4">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-[14px] font-bold text-ink-800">{s.label}</span>
                {byArea[s.id] && (
                  <button
                    type="button"
                    onClick={() => setArea(s.id, undefined)}
                    className="text-[11px] text-ink-400 hover:text-ink-600"
                  >
                    クリア
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DEVIATION_BUCKETS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setArea(s.id, b.id)}
                    className={cn(
                      "rounded-lg px-2.5 py-1.5 text-[12px] font-bold transition",
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
export function TargetDevStep({
  value,
  onChange,
}: {
  value: DeviationBucket;
  onChange: (v: DeviationBucket) => void;
}) {
  return (
    <>
      <StepHeader
        title="目指す偏差値は？"
        subtitle="志望校の合格ラインに必要な偏差値を選んでください。"
      />
      <BucketPicker label="目標偏差値" value={value} onChange={onChange} tone="coral" />
      <p className="mt-4 text-[12px] text-ink-400">
        偏差値は模試ごとに意味が変わるため、内部では帯の中央値で扱います。
      </p>
    </>
  );
}

// ── Step 5: 大学タイプ ───────────────────────────────
export function UnivTypesStep({
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

  const typeOptions: { id: "national" | "public" | "private"; label: string }[] = [
    { id: "national", label: "国立" },
    { id: "public", label: "公立" },
    { id: "private", label: "私立" },
  ];

  return (
    <>
      <StepHeader title="志望校のタイプ" subtitle="複数選択OK。絞り込みに使います。" />
      <div className="mb-5 rounded-2xl border border-cream-200 bg-white p-4">
        <p className="mb-3 text-[12px] font-medium text-ink-500">大学タイプ</p>
        <div className="flex gap-2.5">
          {typeOptions.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => toggleType(o.id)}
              aria-pressed={types.includes(o.id)}
              className={cn(
                "flex-1 rounded-xl py-3 text-[14px] font-bold transition active:scale-[0.98]",
                types.includes(o.id)
                  ? "bg-sky-500 text-white shadow-sm"
                  : "bg-cream-50 text-ink-600 hover:bg-cream-100",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-cream-200 bg-white p-4">
        <p className="mb-3 text-[12px] font-medium text-ink-500">興味のある学部</p>
        <div className="flex flex-wrap gap-2">
          {FACULTY_CATEGORIES.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => toggleFaculty(f.id)}
              aria-pressed={faculties.includes(f.id)}
              className={cn(
                "rounded-xl px-3.5 py-2 text-[13px] font-bold transition active:scale-[0.97]",
                faculties.includes(f.id)
                  ? "bg-sky-500 text-white"
                  : "bg-cream-50 text-ink-600 hover:bg-cream-100",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-3 text-[12px] text-ink-400">どれも選ばなくてもOKです。後から変えられます。</p>
    </>
  );
}

// ── Step 6: 志望校選択 ───────────────────────────────
function facultyDevRange(u: University): { min: number; max: number } | null {
  const devs = u.faculties.map((f) => f.deviation).filter((v): v is number => typeof v === "number");
  if (devs.length === 0) return null;
  return { min: Math.min(...devs), max: Math.max(...devs) };
}

function reachTone(reach: string): string {
  if (reach === "挑戦") return "bg-coral-300 text-white";
  if (reach === "やや上") return "bg-sun-300 text-ink-900";
  if (reach === "適正") return "bg-sky-100 text-sky-700";
  if (reach === "安全") return "bg-mint-100 text-mint-600";
  return "bg-cream-100 text-ink-500";
}

export function TargetUnisStep({
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

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    return allMerged
      .filter((u) => u.searchText?.includes(query.toLowerCase()))
      .map((u) => ({ u, range: facultyDevRange(u) }))
      .slice(0, 30);
  }, [query, allMerged]);

  const recommendations = useMemo(() => {
    type Candidate = { u: University; minDev: number; range: ReturnType<typeof facultyDevRange> };
    const byTypes = univTypes.length > 0
      ? allMerged.filter((u) => univTypes.includes(u.type))
      : allMerged;
    const candidates = byTypes
      .map((u): Candidate | null => {
        const range = facultyDevRange(u);
        return range ? { u, minDev: range.min, range } : null;
      })
      .filter((x): x is Candidate => x !== null);

    function pickN(filter: (c: Candidate) => boolean, n: number): Candidate[] {
      return candidates
        .filter(filter)
        .sort((a, b) => Math.abs(a.minDev - deviation) - Math.abs(b.minDev - deviation))
        .slice(0, n);
    }

    const challenge = pickN((c) => c.minDev > deviation + 5 && c.minDev <= deviation + 12, 2);
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
    ? searchResults.map((r) => ({ u: r.u, minDev: r.range?.min ?? 50, range: r.range, recLabel: undefined as string | undefined }))
    : recommendations.map((r) => ({ u: r.c.u, minDev: r.c.minDev, range: r.c.range, recLabel: r.label as string | undefined }));

  function toggle(uniId: string) {
    if (value.some((v) => v.universityId === uniId)) {
      onChange(value.filter((v) => v.universityId !== uniId));
    } else if (value.length < 3) {
      onChange([...value, { universityId: uniId, priority: (value.length + 1) as 1 | 2 | 3 }]);
    }
  }

  function remove(uniId: string) {
    onChange(
      value
        .filter((v) => v.universityId !== uniId)
        .map((v, i) => ({ ...v, priority: (i + 1) as 1 | 2 | 3 })),
    );
  }

  const empty = query.trim() && results.length === 0;

  return (
    <>
      <StepHeader title="志望校を3つまで" subtitle="第1〜第3志望。後から変えてOK。" />

      {/* 検索バー — 先頭に固定してレイアウトシフトを防ぐ */}
      <label htmlFor="uni-search" className="sr-only">大学名を検索</label>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" strokeWidth={1.75} />
        <input
          id="uni-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="大学名や略称を検索"
          className="h-12 w-full rounded-xl border border-cream-200 bg-white pl-10 pr-3 text-[15px] text-ink-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
          autoComplete="off"
        />
      </div>

      {/* 選択済リスト — 検索バーの下に表示 */}
      {value.length > 0 && (
        <ul className="mt-3 space-y-2">
          {value.map((tu, i) => {
            const u = allMerged.find((x) => x.id === tu.universityId);
            if (!u) return null;
            const range = facultyDevRange(u);
            return (
              <li key={tu.universityId} className="flex items-center gap-3 rounded-xl bg-ink-900 px-3 py-2.5">
                <span className="flex-none rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  第{i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold text-white">{u.name}</div>
                  <div className="text-[10px] text-white/65">
                    {u.tier ? `${TIER_LABEL[u.tier]} · ` : ""}{u.region}
                  </div>
                </div>
                {range ? (
                  <span className="flex-none text-[16px] font-extrabold tabular-nums text-white">
                    {range.min}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => remove(tu.universityId)}
                  className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-white/60 hover:bg-white/10 transition"
                  aria-label="外す"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* 結果リスト — PDF mock: 各行に大学名/学部 + 偏差値数字 (sky-500) */}
      <ul className="mt-3 space-y-1.5">
        {results.map(({ u, minDev, range, recLabel }) => {
          const selected = value.some((v) => v.universityId === u.id);
          const disabled = !selected && value.length >= 3;
          return (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => toggle(u.id)}
                disabled={disabled}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition active:scale-[0.99]",
                  selected
                    ? "bg-ink-900 text-white"
                    : disabled
                      ? "border border-ink-100 bg-cream-50 opacity-50"
                      : "border border-ink-100 bg-cream-50 hover:bg-white",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className={cn("text-[13px] font-bold", selected ? "text-white" : "text-ink-900")}>
                    {u.name}
                  </div>
                  <div className={cn("mt-0.5 text-[10px]", selected ? "text-white/65" : "text-ink-500")}>
                    {u.tier ? `${TIER_LABEL[u.tier]} · ` : ""}
                    {u.region}
                    {recLabel ? ` · ${recLabel}` : ""}
                  </div>
                </div>
                {range ? (
                  <span
                    className={cn(
                      "flex-none text-[16px] font-extrabold tabular-nums",
                      selected ? "text-white" : "text-sky-500",
                    )}
                  >
                    {range.min}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>

      {empty ? (
        <button
          type="button"
          onClick={onAdd}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-cream-200 bg-white p-4 text-[13px] text-ink-500 hover:border-sky-300 hover:bg-sky-50 transition"
        >
          <Plus className="h-4 w-4" strokeWidth={1.75} />
          見つからない場合は手動で追加
        </button>
      ) : (
        <button
          type="button"
          onClick={onAdd}
          className="mt-3 flex w-full items-center justify-center gap-1.5 text-[12px] font-medium text-ink-400 hover:text-ink-600 transition"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
          一覧にない大学を追加する
        </button>
      )}
    </>
  );
}
