"use client";

import { useMemo } from "react";
import { Plus, Lightbulb } from "lucide-react";
import { saveTask } from "@/lib/store";
import type { StoreState, StoredTask } from "@/lib/store";

type Suggestion = {
  id: string;
  title: string;
  subjectArea: string;
  blocks: number;
  reason: string;
};

const SUBJECT_LABEL: Record<string, string> = {
  math: "数学",
  english: "英語",
  japanese: "国語",
  science: "理科",
  social: "社会",
  other: "その他",
};

function buildSuggestions(state: StoreState): Suggestion[] {
  const today = new Date().toISOString().slice(0, 10);
  const in7days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  // 直近 7 日以内のイベントを抽出
  const upcomingEvents = (state.events ?? []).filter((e) => {
    const endDate = e.endDate ?? e.date;
    return endDate >= today && e.date <= in7days;
  });

  // テスト得点率を科目ごとに集計して弱点科目を抽出
  const buckets: Record<string, number[]> = {};
  for (const t of state.tests ?? []) {
    if (!t?.input) continue;
    const subjectName = t.input.subject ?? "";
    const fullScore = t.input.fullScore ?? 0;
    const score = t.input.score ?? 0;
    const pct = fullScore > 0 ? Math.round((score / fullScore) * 100) : null;
    if (pct === null) continue;
    if (!buckets[subjectName]) buckets[subjectName] = [];
    buckets[subjectName].push(pct);
  }

  const subjectRates = Object.entries(buckets).map(([name, pcts]) => ({
    name,
    avg: pcts.reduce((s, v) => s + v, 0) / pcts.length,
  }));
  subjectRates.sort((a, b) => a.avg - b.avg);
  const weakSubjects = subjectRates.slice(0, 2);

  const suggestions: Suggestion[] = [];

  // 弱点 × 直近テストの組み合わせで提案を生成
  for (const weak of weakSubjects) {
    const event = upcomingEvents.find(
      (e) =>
        e.kind === "regular-test" || e.kind === "mock-exam",
    );
    const eventLabel = event ? `「${event.title}」` : "次のテスト";
    suggestions.push({
      id: `sug-${weak.name}-${today}`,
      title: `${weak.name} の弱点を復習`,
      subjectArea: weak.name,
      blocks: 2,
      reason: `${eventLabel}に向けて得点率 ${Math.round(weak.avg)}% の ${weak.name} を強化しましょう`,
    });
  }

  // 直近イベントがある場合に総復習提案を追加
  if (upcomingEvents.length > 0 && suggestions.length < 3) {
    const e = upcomingEvents[0];
    const daysLeft = Math.ceil(
      (new Date(e.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    suggestions.push({
      id: `sug-event-${e.id}-${today}`,
      title: `${e.title} 対策`,
      subjectArea: e.subject ?? "other",
      blocks: 3,
      reason: `${daysLeft} 日後の「${e.title}」に備えて集中演習`,
    });
  }

  return suggestions.slice(0, 3);
}

function isAlreadyAdded(state: StoreState, suggestionId: string): boolean {
  return (state.tasks ?? []).some((t) => t.id === suggestionId);
}

export function TodaySuggestion({ state }: { state: StoreState }) {
  const suggestions = useMemo(() => buildSuggestions(state), [state]);

  if (suggestions.length === 0) return null;

  function addToTodo(sug: Suggestion) {
    const task: StoredTask = {
      id: sug.id,
      title: sug.title,
      blocks: sug.blocks,
      tag: "elective",
      subjectArea: sug.subjectArea,
      priority: 1,
      due: "today",
      status: "todo",
      createdAt: new Date().toISOString(),
    };
    saveTask(task);
  }

  return (
    <section className="mt-4 mb-1">
      <div className="flex items-center gap-1.5 mb-2">
        <Lightbulb className="h-3.5 w-3.5 text-amber-500" strokeWidth={2.5} />
        <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-400">
          今日のおすすめ
        </h2>
      </div>
      <ul className="space-y-2">
        {suggestions.map((sug) => {
          const added = isAlreadyAdded(state, sug.id);
          return (
            <li
              key={sug.id}
              className="flex items-start gap-3 rounded-2xl border border-amber-100/80 bg-amber-50/40 p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold text-ink-900">
                  {sug.title}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                    {SUBJECT_LABEL[sug.subjectArea] ?? sug.subjectArea}
                  </span>
                  <span className="text-[10px] text-ink-400">
                    {sug.blocks} ブロック
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] leading-[1.6] text-ink-500">
                  {sug.reason}
                </p>
              </div>
              <button
                type="button"
                disabled={added}
                onClick={() => addToTodo(sug)}
                className="mt-0.5 flex flex-none items-center gap-1 rounded-full border border-amber-300/70 bg-white px-3 py-1.5 text-[11px] font-bold text-amber-600 transition disabled:opacity-40"
              >
                <Plus className="h-3 w-3" strokeWidth={2.5} />
                {added ? "追加済み" : "TODO"}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
