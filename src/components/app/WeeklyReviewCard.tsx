"use client";

// 週次振り返り — 日曜 or 月曜の早い時間に表示
// weeklyReviewAndReplan() で達成率・トレンド・次週推奨を算出
// ユーザーは「気持ち」を 4 択で選ぶ → next-week goal を upsert して閉じる

import { useEffect, useMemo, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/hooks/useStore";
import {
  weeklyReviewAndReplan,
  type WeeklyExecutionLog,
  type WeeklyGoal,
} from "@/lib/planning";
import { saveWeeklyExecution, saveWeeklyGoal, startOfWeek } from "@/lib/store";

const SHOWN_KEY = "testall:weekly-review-shown";

// 「今週のレビューを今出すべきか」判定
// - 日曜 or 月曜の朝
// - 今週のレビューを既に表示済みなら出さない
function shouldShowReview(now = new Date()): boolean {
  const dow = now.getDay(); // 0=日
  if (dow !== 0 && dow !== 1) return false;
  if (typeof window === "undefined") return false;
  try {
    const week = startOfWeek(now);
    const last = sessionStorage.getItem(SHOWN_KEY);
    if (last === week) return false;
  } catch {
    /* noop */
  }
  return true;
}

const FEEL_OPTIONS = [
  { id: "ahead",   label: "想像より頑張れた", tone: "bg-mint-100 text-mint-600" },
  { id: "ontrack", label: "予定通り",         tone: "bg-sky-100 text-sky-600" },
  { id: "behind",  label: "少し遅れた",       tone: "bg-peach-100 text-peach-500" },
  { id: "broken",  label: "崩れた",           tone: "bg-coral-300 text-white" },
] as const;
type Feel = (typeof FEEL_OPTIONS)[number]["id"];

export function WeeklyReviewCard() {
  const { state, hydrated } = useStore();
  const [open, setOpen] = useState(false);
  const [feel, setFeel] = useState<Feel>("ontrack");
  const [comprehension, setComprehension] = useState<"low" | "mid" | "high">("mid");

  // 先週の週開始 ISO
  const lastWeekISO = useMemo(() => {
    const today = new Date();
    const last = new Date(today);
    last.setDate(last.getDate() - 7);
    return startOfWeek(last);
  }, []);

  // 先週の goal 取得
  const lastGoal: WeeklyGoal | undefined = useMemo(
    () => (state.weeklyGoals ?? []).find((g) => g.weekStartISO === lastWeekISO),
    [state.weeklyGoals, lastWeekISO],
  );

  // 先週中の完了ブロック数を集計
  const completed = useMemo(() => {
    const startMs = new Date(lastWeekISO + "T00:00:00").getTime();
    const endMs = startMs + 7 * 24 * 60 * 60 * 1000;
    return (state.blockLogs ?? []).filter((b) => {
      const t = new Date(b.completedAt).getTime();
      return t >= startMs && t < endMs;
    }).length;
  }, [state.blockLogs, lastWeekISO]);

  useEffect(() => {
    if (!hydrated) return;
    if (!lastGoal) return;
    if (shouldShowReview()) setOpen(true);
  }, [hydrated, lastGoal]);

  if (!hydrated || !open || !lastGoal) return null;

  const log: WeeklyExecutionLog = {
    weekStartISO: lastWeekISO,
    completedBlocks: completed,
    byArea: [],
    uncompleted: [],
    comprehension,
  };
  const review = weeklyReviewAndReplan(lastGoal, log);

  function close() {
    try {
      sessionStorage.setItem(SHOWN_KEY, startOfWeek(new Date()));
    } catch {
      /* noop */
    }
    setOpen(false);
  }

  function confirm() {
    if (!lastGoal) return;
    // 実行ログを保存
    saveWeeklyExecution(log);
    // 次週の goal を保存 (推奨値を反映)
    const nextWeekISO = startOfWeek(new Date());
    saveWeeklyGoal({
      ...lastGoal,
      subjectAllocation: lastGoal.subjectAllocation ?? [],
      weekStartISO: nextWeekISO,
      targetBlocks: review.nextWeekTargetBlocks,
      minimumBlocks: Math.max(1, Math.round(review.nextWeekTargetBlocks * 0.7)),
      stretchBlocks: Math.round(review.nextWeekTargetBlocks * 1.2),
    });
    close();
  }

  return (
    <section className="rounded-2xl border border-sky-200/70 bg-gradient-to-br from-sky-50/70 to-mint-50/40 p-5 shadow-soft">
      <div className="flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-sky-500" />
          <h2 className="text-[15px] font-bold tracking-tight text-ink-900">
            先週の振り返り
          </h2>
        </div>
        <button
          type="button"
          onClick={close}
          className="flex h-7 w-7 items-center justify-center rounded-full text-ink-400"
          aria-label="閉じる"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 数値サマリ */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="目標" value={lastGoal.targetBlocks} unit="blk" />
        <Stat label="完了" value={completed} unit="blk" />
        <Stat label="達成率" value={Math.round(review.achievementRate * 100)} unit="%" />
      </div>

      {/* 気分 */}
      <div className="mt-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
          どうだった？
        </div>
        <ul className="mt-2 grid grid-cols-2 gap-1.5">
          {FEEL_OPTIONS.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => setFeel(o.id)}
                className={cn(
                  "flex h-10 w-full items-center justify-center rounded-xl text-[12px] font-bold transition",
                  feel === o.id ? o.tone : "bg-white border border-ink-100/80 text-ink-600",
                )}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 理解度 */}
      <div className="mt-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
          理解度
        </div>
        <ul className="mt-2 flex gap-1 rounded-xl bg-cream-100/70 p-1">
          {([
            { id: "low", label: "薄い" },
            { id: "mid", label: "ふつう" },
            { id: "high", label: "しっかり" },
          ] as const).map((o) => (
            <li key={o.id} className="flex-1">
              <button
                type="button"
                onClick={() => setComprehension(o.id)}
                className={cn(
                  "flex h-9 w-full items-center justify-center rounded-lg text-[11px] font-bold transition",
                  comprehension === o.id ? "bg-white text-ink-900 shadow-soft" : "text-ink-500",
                )}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* AI 推奨 */}
      <div className="mt-4 rounded-xl bg-white p-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
          次週の推奨
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-[13px] font-bold text-ink-900">
            目標 {review.nextWeekTargetBlocks} ブロック
          </span>
          <span className="text-[10px] font-medium text-ink-500">
            {review.recommendation === "increase"
              ? "10%増を提案"
              : review.recommendation === "decrease"
              ? "少し下げて継続"
              : review.recommendation === "stabilize"
              ? "まず継続最優先"
              : "同水準を維持"}
          </span>
        </div>
        {review.notes.length > 0 ? (
          <ul className="mt-2 space-y-0.5 text-[11px] leading-[1.6] text-ink-600">
            {review.notes.slice(0, 3).map((n, i) => (
              <li key={i}>・{n}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <button
        type="button"
        onClick={confirm}
        className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-ink-900 text-[13px] font-bold text-white"
      >
        次週の目標を確定
      </button>
    </section>
  );
}

function Stat({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-xl bg-white p-2">
      <div className="text-[10px] font-medium text-ink-500">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-0.5">
        <span className="text-xl font-bold tabular-nums text-ink-900">{value}</span>
        <span className="text-[10px] font-medium text-ink-400">{unit}</span>
      </div>
    </div>
  );
}
