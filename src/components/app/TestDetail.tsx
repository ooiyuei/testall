"use client";

import { useState } from "react";
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
  Target,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/hooks/useStore";
import { deleteTest } from "@/lib/store";
import type { MissCause, Weakness } from "@/lib/types";
import { LoadingState } from "@/components/ui/LoadingState";
import { IconBadge } from "@/components/ui/IconBadge";
import { toast } from "@/components/ui/Toast";

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

const SEVERITY_LEFT_BORDER: Record<Weakness["severity"], string> = {
  high: "border-l-[3px] border-l-coral-500",
  mid: "border-l-[3px] border-l-sun-400",
  low: "border-l-[3px] border-l-mint-400",
};

const SEVERITY_LABEL: Record<Weakness["severity"], string> = {
  high: "最優先",
  mid: "次点",
  low: "余裕あり",
};

const SEVERITY_BADGE_TONE: Record<Weakness["severity"], string> = {
  high: "bg-coral-500 text-white",
  mid: "bg-sun-300 text-ink-900",
  low: "bg-mint-100 text-mint-600",
};

export function TestDetail({ id }: { id: string }) {
  const router = useRouter();
  const { state, hydrated } = useStore();
  const [deleteStep, setDeleteStep] = useState<0 | 1>(0);

  if (!hydrated) {
    return <LoadingState />;
  }

  const test = state.tests.find((t) => t.id === id);

  if (!test) {
    return (
      <div className="px-4 pt-10">
        <div className="rounded-2xl border border-cream-200 bg-white p-6 text-center shadow-soft">
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
    if (deleteStep === 0) {
      setDeleteStep(1);
      toast.info("もう一度タップで削除します", "この操作は取り消せません");
      return;
    }
    deleteTest(id);
    toast.error("診断を削除しました");
    router.push("/app/test");
  }

  return (
    <div className="px-5 pb-10 pt-3 space-y-5">
      {/* Score header */}
      <ScoreHeader
        subject={input.subject}
        testName={input.testName}
        createdAt={test.createdAt}
        pct={pct}
        score={input.score}
        fullScore={input.fullScore}
        summary={diagnosis.summary}
        trend={computeTrend(state.tests, test.id, input.subject)}
      />

      {/* Level / Gap */}
      <section className="grid grid-cols-1 gap-3">
        <InfoCard
          icon={<Target strokeWidth={1.75} className="h-4 w-4" />}
          tone="primary"
          title="現在地"
          body={diagnosis.level}
        />
        <InfoCard
          icon={<Flame strokeWidth={1.75} className="h-4 w-4" />}
          tone="info"
          title="志望校とのギャップ"
          body={diagnosis.gap}
        />
      </section>

      {/* Today blocks */}
      <TodayBlocks
        blocks={diagnosis.todayBlocks}
        blockLogs={state.blockLogs}
        testId={id}
        completed={completed}
      />

      {/* Weaknesses */}
      <WeaknessList weaknesses={diagnosis.weaknesses} />

      {/* Strengths */}
      {diagnosis.strengths.length > 0 && (
        <section className="rounded-2xl border border-ink-100/80 bg-white p-5">
          <SectionTitle>強みになっているところ</SectionTitle>
          <ul className="mt-3 space-y-2">
            {diagnosis.strengths.map((s, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-[13px] text-ink-700"
              >
                <Sparkles
                  strokeWidth={1.75}
                  className="mt-0.5 h-3.5 w-3.5 flex-none text-mint-500"
                />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Textbook plan */}
      <TextbookPlan plan={diagnosis.textbookPlan} />

      {/* Week plan */}
      <WeekPlan weekPlan={diagnosis.weekPlan} />

      {/* Encouragement */}
      <section className="rounded-2xl border border-mint-200 bg-mint-50 p-5">
        <div className="flex items-start gap-3">
          <Sparkles
            strokeWidth={1.75}
            className="mt-0.5 h-5 w-5 flex-none text-mint-600"
          />
          <p className="text-sm font-bold text-ink-900">
            {diagnosis.encouragement}
          </p>
        </div>
      </section>

      {/* CTA */}
      <Link
        href="/app/focus"
        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 text-[15px] font-black text-white shadow-[0_6px_18px_-8px_var(--color-sky-500)]"
      >
        <Play strokeWidth={0} fill="currentColor" className="h-4 w-4" />
        今日の25分を始める
      </Link>

      {/* Delete */}
      <button
        type="button"
        onClick={handleDelete}
        className={cn(
          "flex h-10 w-full items-center justify-center gap-1.5 rounded-2xl border text-xs font-bold transition-colors",
          deleteStep === 1
            ? "border-coral-300 bg-coral-50 text-coral-600"
            : "border-cream-200 text-ink-400 hover:bg-cream-100",
        )}
      >
        <Trash2 strokeWidth={1.75} className="h-3.5 w-3.5" />
        {deleteStep === 1 ? "もう一度タップで削除" : "この診断を削除"}
      </button>
    </div>
  );
}

/* ---------- Score Header ---------- */

type Trend = {
  delta: number;          // 前回比 % (符号付き)
  prevTestName: string;
  prevPct: number;
} | null;

type ScoreHeaderProps = {
  subject: string;
  testName: string;
  createdAt: string;
  pct: number;
  score: number;
  fullScore: number;
  summary: string;
  trend?: Trend;
};

function ScoreHeader({
  subject,
  testName,
  createdAt,
  pct,
  score,
  fullScore,
  summary,
  trend,
}: ScoreHeaderProps) {
  return (
    <section className="rounded-2xl border border-cream-200 bg-gradient-to-br from-sky-50/80 to-mint-50/40 p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-sky-700">
            {subject}
          </div>
          <h2 className="mt-0.5 text-lg font-black leading-snug text-ink-900">
            {testName}
          </h2>
          <div className="mt-1 text-[11px] text-ink-400">
            {new Date(createdAt).toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
        <div className="flex-none text-right">
          <div className="text-4xl font-black tabular-nums tracking-[-0.02em] text-ink-900">
            {pct}
            <span className="ml-0.5 text-sm font-bold text-ink-500">%</span>
          </div>
          <div className="mt-0.5 text-[11px] text-ink-400 tabular-nums">
            {score} / {fullScore}
          </div>
          {/* 前回比トレンド */}
          {trend ? (
            <div
              className={cn(
                "mt-1.5 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums",
                trend.delta > 0
                  ? "bg-mint-100 text-mint-600"
                  : trend.delta < 0
                    ? "bg-coral-300/20 text-coral-500"
                    : "bg-cream-100 text-ink-500",
              )}
              title={`前回 ${trend.prevTestName}: ${trend.prevPct}%`}
            >
              {trend.delta > 0 ? "↑" : trend.delta < 0 ? "↓" : "—"}
              {trend.delta > 0 ? "+" : ""}{trend.delta}%
            </div>
          ) : null}
        </div>
      </div>
      <blockquote className="mt-4 border-l-2 border-sky-300 pl-3">
        <p className="text-[13px] leading-relaxed text-ink-700">{summary}</p>
      </blockquote>
    </section>
  );
}

// 同科目の直前テストとの差分計算
function computeTrend(
  tests: { id: string; createdAt: string; input: { subject: string; testName: string; score: number; fullScore: number } }[],
  currentId: string,
  subject: string,
): Trend {
  const sameSubject = tests
    .filter((t) => t.input.subject === subject)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const idx = sameSubject.findIndex((t) => t.id === currentId);
  if (idx < 0 || idx + 1 >= sameSubject.length) return null;
  const current = sameSubject[idx];
  const prev = sameSubject[idx + 1];
  const currentPct =
    current.input.fullScore > 0
      ? Math.round((current.input.score / current.input.fullScore) * 100)
      : 0;
  const prevPct =
    prev.input.fullScore > 0
      ? Math.round((prev.input.score / prev.input.fullScore) * 100)
      : 0;
  return {
    delta: currentPct - prevPct,
    prevTestName: prev.input.testName,
    prevPct,
  };
}

/* ---------- Info Card ---------- */

type InfoCardProps = {
  icon: React.ReactNode;
  tone: "primary" | "info";
  title: string;
  body: string;
};

function InfoCard({ icon, tone, title, body }: InfoCardProps) {
  return (
    <div className="rounded-2xl border border-cream-200 bg-white p-5 shadow-soft">
      <div className="flex items-center gap-2.5">
        <IconBadge tone={tone} size="sm">
          {icon}
        </IconBadge>
        <span className="text-[11px] font-semibold text-ink-500">{title}</span>
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-ink-700">{body}</p>
    </div>
  );
}

/* ---------- Today Blocks ---------- */

type BlockLog = { testId: string; blockIdx: number };
type Block = {
  startTime: string;
  subject: string;
  topic: string;
  source: string;
  completion: string;
};

type TodayBlocksProps = {
  blocks: Block[];
  blockLogs: BlockLog[];
  testId: string;
  completed: number;
};

function TodayBlocks({
  blocks,
  blockLogs,
  testId,
  completed,
}: TodayBlocksProps) {
  return (
    <section>
      <SectionTitle>今日の25分ブロック</SectionTitle>
      <ul className="mt-3 space-y-2">
        {blocks.map((b, i) => {
          const done = blockLogs.some(
            (log) => log.testId === testId && log.blockIdx === i,
          );
          const isActive = !done && i === completed;
          return (
            <li
              key={i}
              className={cn(
                "rounded-2xl border p-4 shadow-soft transition-opacity",
                done
                  ? "border-cream-200 bg-cream-50 opacity-50"
                  : isActive
                    ? "border-sky-300 bg-white ring-1 ring-sky-200"
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
                  <span className="text-[9px] font-semibold text-current/70">
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
                  <CheckCircle2
                    strokeWidth={1.75}
                    className="h-6 w-6 flex-none self-center text-mint-500"
                  />
                ) : (
                  <Link
                    href={`/app/focus/run?testId=${testId}&block=${i}`}
                    className="flex h-9 flex-none items-center justify-center gap-1.5 self-center rounded-full bg-sky-500 px-4 text-[12px] font-black text-white shadow-soft"
                    aria-label="開始"
                  >
                    <Play
                      strokeWidth={0}
                      fill="currentColor"
                      className="h-3 w-3"
                    />
                    開始
                  </Link>
                )}
              </div>
              <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-sky-50 px-3 py-2">
                <Clock
                  strokeWidth={1.75}
                  className="h-3.5 w-3.5 flex-none text-sky-500"
                />
                <span className="text-[12px] text-sky-900">
                  完了条件：{b.completion}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      {blocks.length > 0 && (
        <div className="mt-2 text-[11px] text-ink-400">
          {completed} / {blocks.length} ブロック完了
        </div>
      )}
    </section>
  );
}

/* ---------- Weakness List ---------- */

type WeaknessListProps = {
  weaknesses: Weakness[];
};

function WeaknessList({ weaknesses }: WeaknessListProps) {
  return (
    <section>
      <SectionTitle>弱点と回復ルート</SectionTitle>
      <ul className="mt-3 space-y-2">
        {weaknesses.map((w, i) => (
          <WeaknessItem key={i} weakness={w} />
        ))}
      </ul>
    </section>
  );
}

function WeaknessItem({ weakness: w }: { weakness: Weakness }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li
      className={cn(
        "rounded-2xl border border-cream-200 bg-white pl-0 shadow-soft overflow-hidden",
        SEVERITY_LEFT_BORDER[w.severity],
      )}
    >
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-black",
              SEVERITY_BADGE_TONE[w.severity],
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
          <span className="text-sm font-black text-ink-900">{w.unit}</span>
        </div>
        <p className="mt-2.5 text-[12px] leading-relaxed text-ink-700">
          {w.reason}
        </p>
        <div className="mt-3 rounded-xl bg-sky-50 p-3">
          <div className="text-[10px] font-semibold text-sky-600">
            回復ルート
          </div>
          <p
            className={cn(
              "mt-1 text-[12px] leading-relaxed text-sky-900 transition-all",
              expanded ? "" : "line-clamp-1",
            )}
          >
            {w.recovery}
          </p>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 text-[10px] font-bold text-sky-600"
          >
            {expanded ? "折りたたむ" : "続きを見る"}
          </button>
        </div>
      </div>
    </li>
  );
}

/* ---------- Textbook Plan ---------- */

type TextbookEntry = {
  name: string;
  units: string[];
  pace: string;
  reps: string;
};

function TextbookPlan({ plan }: { plan: TextbookEntry[] }) {
  return (
    <section>
      <SectionTitle>参考書ルート</SectionTitle>
      <ul className="mt-3 space-y-2">
        {plan.map((p, i) => (
          <li
            key={i}
            className="rounded-2xl border border-cream-200 bg-white p-4 shadow-soft"
          >
            <div className="flex items-center gap-2">
              <BookOpen
                strokeWidth={1.75}
                className="h-4 w-4 flex-none text-mint-500"
              />
              <span className="text-sm font-black text-ink-900">{p.name}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {p.units.map((u, j) => (
                <span
                  key={j}
                  className="rounded-full bg-cream-100 px-2 py-0.5 text-[10px] font-bold text-ink-700"
                >
                  {u}
                </span>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-xl bg-cream-50 p-2.5">
                <div className="text-[10px] font-semibold text-ink-400">
                  ペース
                </div>
                <div className="mt-0.5 text-ink-700">{p.pace}</div>
              </div>
              <div className="rounded-xl bg-cream-50 p-2.5">
                <div className="text-[10px] font-semibold text-ink-400">
                  回し方
                </div>
                <div className="mt-0.5 text-ink-700">{p.reps}</div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Week Plan ---------- */

type DayEntry = {
  day: string;
  focus: string;
  subjects: string[];
  blocks: number;
};

function WeekPlan({ weekPlan }: { weekPlan: DayEntry[] }) {
  return (
    <section>
      <SectionTitle>1週間の計画</SectionTitle>
      <ul className="mt-3 space-y-1.5">
        {weekPlan.map((d, i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-2xl border border-cream-200 bg-white p-3 shadow-soft"
          >
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-cream-100 text-sm font-black text-ink-700">
              {d.day}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-bold text-ink-900">{d.focus}</div>
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
  );
}

/* ---------- Section Title ---------- */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold text-ink-400">{children}</h3>
  );
}
