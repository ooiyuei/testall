"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  Play,
  Sparkles,
  Trash2,
  Target,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/hooks/useStore";
import { deleteTest } from "@/lib/store";
import type { MissCause, Weakness } from "@/lib/types";

const CAUSE_LABEL: Record<MissCause, string> = {
  knowledge: "知識不足",
  understanding: "理解不足",
  time: "時間不足",
  careless: "ケアレス",
};

const CAUSE_TONE: Record<MissCause, string> = {
  knowledge: "bg-peach-100 text-peach-500",
  understanding: "bg-coral-300/30 text-coral-500",
  time: "bg-sun-200 text-ink-900",
  careless: "bg-sky-100 text-sky-700",
};

const SEVERITY_TONE: Record<Weakness["severity"], string> = {
  high: "bg-coral-500 text-white",
  mid: "bg-sun-300 text-ink-900",
  low: "bg-mint-100 text-mint-600",
};

const SEVERITY_LABEL: Record<Weakness["severity"], string> = {
  high: "最優先",
  mid: "次点",
  low: "余裕あり",
};

export function TestDetail({ id }: { id: string }) {
  const router = useRouter();
  const { state, hydrated } = useStore();

  if (!hydrated) {
    return <div className="px-4 pt-10 text-sm text-ink-500">読み込み中…</div>;
  }

  const test = state.tests.find((t) => t.id === id);

  if (!test) {
    return (
      <div className="px-4 pt-10">
        <div className="rounded-3xl border border-cream-200 bg-white p-6 text-center shadow-soft">
          <AlertTriangle className="mx-auto h-7 w-7 text-coral-400" />
          <div className="mt-2 text-sm font-bold text-ink-900">
            この診断は見つかりませんでした
          </div>
          <p className="mt-1 text-xs text-ink-500">
            sessionStorageに保存されていない可能性があります。
          </p>
          <Link
            href="/app/test/new"
            className="mt-4 inline-flex h-10 items-center gap-1 rounded-full bg-sky-500 px-4 text-xs font-black text-white shadow-soft"
          >
            新しいテストを追加
          </Link>
        </div>
      </div>
    );
  }

  const { input, diagnosis } = test;
  const pct = Math.round((input.score / input.fullScore) * 100);
  const completed = state.blockLogs.filter((b) => b.testId === id).length;

  function handleDelete() {
    if (!confirm("この診断を削除しますか？")) return;
    deleteTest(id);
    router.push("/app/test");
  }

  return (
    <div className="px-5 pb-8 pt-3 space-y-5">
      {/* Score header */}
      <section className="rounded-3xl border border-cream-200 bg-gradient-to-br from-sky-50 to-peach-50 p-5 shadow-soft">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-sky-700">
              {input.subject}
            </div>
            <h2 className="mt-1 text-lg font-black text-ink-900">
              {input.testName}
            </h2>
            <div className="mt-1 text-[11px] text-ink-500">
              {new Date(test.createdAt).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-ink-900 tabular-nums">
              {pct}
              <span className="ml-0.5 text-sm font-bold text-ink-500">%</span>
            </div>
            <div className="text-[10px] text-ink-500 tabular-nums">
              {input.score} / {input.fullScore}
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm text-ink-700">{diagnosis.summary}</p>
      </section>

      {/* Level / Gap */}
      <section className="grid grid-cols-1 gap-3">
        <InfoCard
          icon={<Target className="h-4 w-4" />}
          tone="bg-sky-100 text-sky-600"
          title="現在地"
          body={diagnosis.level}
        />
        <InfoCard
          icon={<Flame className="h-4 w-4" />}
          tone="bg-peach-100 text-peach-500"
          title="志望校とのギャップ"
          body={diagnosis.gap}
        />
      </section>

      {/* Today blocks */}
      <section>
        <SectionTitle>今日の45分ブロック</SectionTitle>
        <ul className="mt-2 space-y-2">
          {diagnosis.todayBlocks.map((b, i) => {
            const done = state.blockLogs.some(
              (log) => log.testId === id && log.blockIdx === i,
            );
            return (
              <li
                key={i}
                className={cn(
                  "rounded-2xl border p-3 shadow-soft",
                  done
                    ? "border-cream-200 bg-cream-50"
                    : "border-cream-200 bg-white",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex w-14 flex-none flex-col items-center justify-center rounded-xl py-1.5",
                      done
                        ? "bg-mint-100 text-mint-600"
                        : "bg-sky-100 text-sky-600",
                    )}
                  >
                    <span className="font-mono text-sm font-black tabular-nums">
                      {b.startTime}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-widest">
                      {done ? "完了" : "予定"}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className={cn(
                        "text-sm font-black",
                        done ? "text-ink-400 line-through" : "text-ink-900",
                      )}
                    >
                      {b.subject} / {b.topic}
                    </div>
                    <div className="mt-0.5 text-[11px] text-ink-500">
                      {b.source}
                    </div>
                  </div>
                  {done ? (
                    <CheckCircle2 className="h-6 w-6 flex-none self-center text-mint-500" />
                  ) : (
                    <Link
                      href={`/app/focus/run?testId=${id}&block=${i}`}
                      className="flex h-9 flex-none items-center justify-center gap-1 self-center rounded-full bg-sky-500 px-3 text-xs font-black text-white shadow-soft"
                      aria-label="開始"
                    >
                      <Play className="h-3.5 w-3.5" />
                      開始
                    </Link>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-1.5 rounded-xl bg-cream-100 px-2.5 py-1.5">
                  <Clock className="h-3 w-3 flex-none text-ink-400" />
                  <span className="text-[11px] text-ink-700">
                    完了条件：{b.completion}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
        {diagnosis.todayBlocks.length > 0 ? (
          <div className="mt-2 text-[11px] text-ink-500">
            {completed} / {diagnosis.todayBlocks.length} ブロック完了
          </div>
        ) : null}
      </section>

      {/* Weaknesses */}
      <section>
        <SectionTitle>弱点と回復ルート</SectionTitle>
        <ul className="mt-2 space-y-2">
          {diagnosis.weaknesses.map((w, i) => (
            <li
              key={i}
              className="rounded-2xl border border-cream-200 bg-white p-3.5 shadow-soft"
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-black",
                    SEVERITY_TONE[w.severity],
                  )}
                >
                  {SEVERITY_LABEL[w.severity]}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                    CAUSE_TONE[w.cause],
                  )}
                >
                  {CAUSE_LABEL[w.cause]}
                </span>
                <span className="text-sm font-black text-ink-900">
                  {w.unit}
                </span>
              </div>
              <p className="mt-2 text-[12px] text-ink-700">{w.reason}</p>
              <div className="mt-2 rounded-xl bg-sky-50 p-2.5 text-[12px] text-sky-900">
                <div className="text-[10px] font-bold uppercase tracking-widest text-sky-700">
                  回復ルート
                </div>
                <p className="mt-0.5">{w.recovery}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Strengths */}
      {diagnosis.strengths.length > 0 ? (
        <section className="rounded-2xl border border-ink-100/80 bg-white p-4">
          <SectionTitle small>強みになっているところ</SectionTitle>
          <ul className="mt-2 space-y-1.5">
            {diagnosis.strengths.map((s, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-[12px] text-ink-700"
              >
                <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-none text-mint-500" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Textbook plan */}
      <section>
        <SectionTitle>参考書ルート</SectionTitle>
        <ul className="mt-2 space-y-2">
          {diagnosis.textbookPlan.map((p, i) => (
            <li
              key={i}
              className="rounded-2xl border border-cream-200 bg-white p-3.5 shadow-soft"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 flex-none text-mint-500" />
                <span className="text-sm font-black text-ink-900">
                  {p.name}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {p.units.map((u, j) => (
                  <span
                    key={j}
                    className="rounded-full bg-cream-100 px-2 py-0.5 text-[10px] font-bold text-ink-700"
                  >
                    {u}
                  </span>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-xl bg-cream-50 p-2">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-ink-400">
                    ペース
                  </div>
                  <div className="mt-0.5 text-ink-700">{p.pace}</div>
                </div>
                <div className="rounded-xl bg-cream-50 p-2">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-ink-400">
                    回し方
                  </div>
                  <div className="mt-0.5 text-ink-700">{p.reps}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Week plan */}
      <section>
        <SectionTitle>1週間の計画</SectionTitle>
        <ul className="mt-2 space-y-1.5">
          {diagnosis.weekPlan.map((d, i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-2xl border border-cream-200 bg-white p-2.5 shadow-soft"
            >
              <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-cream-100 text-sm font-black text-ink-700">
                {d.day}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-bold text-ink-900">
                  {d.focus}
                </div>
                <div className="mt-0.5 text-[10px] text-ink-500">
                  {d.subjects.join(" · ")}
                </div>
              </div>
              <span className="flex-none rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 tabular-nums">
                {d.blocks}ブロック
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Encouragement */}
      <section className="rounded-3xl border border-mint-200 bg-mint-50 p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 flex-none text-mint-600" />
          <p className="text-sm font-bold text-ink-900">
            {diagnosis.encouragement}
          </p>
        </div>
      </section>

      <button
        type="button"
        onClick={handleDelete}
        className="flex h-10 w-full items-center justify-center gap-1 rounded-2xl border border-cream-200 text-xs font-bold text-ink-400 hover:bg-cream-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
        この診断を削除
      </button>
    </div>
  );
}

function SectionTitle({
  children,
  small,
}: {
  children: React.ReactNode;
  small?: boolean;
}) {
  return (
    <h3
      className={cn(
        "font-bold uppercase tracking-widest text-ink-500",
        small ? "text-[10px]" : "text-xs",
      )}
    >
      {children}
    </h3>
  );
}

function InfoCard({
  icon,
  tone,
  title,
  body,
}: {
  icon: React.ReactNode;
  tone: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-cream-200 bg-white p-4 shadow-soft">
      <div className="flex items-center gap-2">
        <span
          className={cn("flex h-7 w-7 items-center justify-center rounded-xl", tone)}
        >
          {icon}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
          {title}
        </span>
      </div>
      <p className="mt-2 text-[13px] text-ink-700">{body}</p>
    </div>
  );
}
