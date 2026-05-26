"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  MoreHorizontal,
  Pause,
  Play,
  RotateCcw,
  Star,
  Target,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/hooks/useStore";
import { logBlock } from "@/lib/store";
import type { Block } from "@/lib/types";
import { LoadingState } from "@/components/ui/LoadingState";
import { confirm } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";
import { haptic } from "@/lib/haptic";
import { sound } from "@/lib/sound";
import { notify } from "@/lib/notify";
import { focusSession } from "@/lib/focus-session";

const DEFAULT_DURATION_SEC = 25 * 60;

type Phase = "idle" | "running" | "paused" | "finished";

export function FocusRun() {
  const router = useRouter();
  const params = useSearchParams();
  const { state, hydrated } = useStore();

  const testId = params.get("testId");
  const blockIdxParam = params.get("block");
  const blockIdx = blockIdxParam !== null ? Number(blockIdxParam) : null;

  const block: Block | null = useMemo(() => {
    if (!testId || blockIdx === null) return null;
    const test = state.tests.find((t) => t.id === testId);
    if (!test) return null;
    return test.diagnosis.todayBlocks[blockIdx] ?? null;
  }, [state.tests, testId, blockIdx]);

  const alreadyLogged = useMemo(() => {
    if (!testId || blockIdx === null) return false;
    return state.blockLogs.some(
      (l) => l.testId === testId && l.blockIdx === blockIdx,
    );
  }, [state.blockLogs, testId, blockIdx]);

  const [phase, setPhase] = useState<Phase>("idle");
  const [remaining, setRemaining] = useState<number>(DEFAULT_DURATION_SEC);
  const [rating, setRating] = useState<number>(0);
  const [note, setNote] = useState<string>("");
  const startedAtRef = useRef<number | null>(null);
  const totalElapsedRef = useRef<number>(0);

  // タイマー駆動 (副作用は updater 内で行わない)
  useEffect(() => {
    if (phase !== "running") return;
    const interval = setInterval(() => {
      setRemaining((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // 残り 0 になったら finished に遷移 + 完走 haptic + chime + 通知
  useEffect(() => {
    if (phase === "running" && remaining === 0) {
      haptic.success();
      sound.chime();
      // バックグラウンドでも見えるよう通知（許可済みなら）
      notify.send("25分、完走！", {
        body: "お疲れさま。次はどう振り返る？",
        tag: "focus-finish",
        url: "/app",
      });
      setPhase("finished");
    }
  }, [phase, remaining]);

  // Wake Lock — タイマー走ってる間は画面スリープを抑止
  useEffect(() => {
    if (phase !== "running") return;
    if (typeof navigator === "undefined") return;
    type WakeLockSentinel = { release: () => Promise<void> };
    type WakeLockNavigator = Navigator & {
      wakeLock?: { request: (kind: "screen") => Promise<WakeLockSentinel> };
    };
    const nav = navigator as WakeLockNavigator;
    if (!nav.wakeLock) return;
    let sentinel: WakeLockSentinel | null = null;
    nav.wakeLock
      .request("screen")
      .then((s) => {
        sentinel = s;
      })
      .catch(() => {
        // 権限がない/サポート外 — 静かに失敗
      });
    return () => {
      sentinel?.release().catch(() => {});
    };
  }, [phase]);

  // 表示用ラベルと戻り先 (FocusRun を離れてもミニバーで識別/復帰可能にする)
  const sessionLabel = block ? `${block.subject} / ${block.topic}` : "自由学習";
  const sessionReturnHref =
    testId !== null && blockIdx !== null
      ? `/app/focus/run?testId=${testId}&block=${blockIdx}`
      : "/app/focus/run";

  function start() {
    haptic.medium();
    startedAtRef.current = Date.now();
    setPhase("running");
    focusSession.write({
      startedAt: startedAtRef.current,
      totalSec: DEFAULT_DURATION_SEC,
      phase: "running",
      elapsedAtPause: 0,
      label: sessionLabel,
      returnHref: sessionReturnHref,
    });
  }

  function pause() {
    haptic.light();
    if (startedAtRef.current !== null) {
      totalElapsedRef.current += Date.now() - startedAtRef.current;
      startedAtRef.current = null;
    }
    setPhase("paused");
    focusSession.write({
      startedAt: Date.now(),
      totalSec: DEFAULT_DURATION_SEC,
      phase: "paused",
      elapsedAtPause: Math.floor(totalElapsedRef.current / 1000),
      label: sessionLabel,
      returnHref: sessionReturnHref,
    });
  }

  function resume() {
    haptic.medium();
    startedAtRef.current = Date.now();
    setPhase("running");
    focusSession.write({
      startedAt: startedAtRef.current,
      totalSec: DEFAULT_DURATION_SEC,
      phase: "running",
      elapsedAtPause: Math.floor(totalElapsedRef.current / 1000),
      label: sessionLabel,
      returnHref: sessionReturnHref,
    });
  }

  function reset() {
    haptic.light();
    startedAtRef.current = null;
    totalElapsedRef.current = 0;
    setRemaining(DEFAULT_DURATION_SEC);
    setPhase("idle");
    focusSession.clear();
  }

  function finishEarly() {
    haptic.medium();
    if (startedAtRef.current !== null) {
      totalElapsedRef.current += Date.now() - startedAtRef.current;
      startedAtRef.current = null;
    }
    setPhase("finished");
    focusSession.clear();
  }

  // 完了/離脱 でセッションを必ずクリーンアップ
  useEffect(() => {
    if (phase === "finished") focusSession.clear();
  }, [phase]);

  function elapsedSec(): number {
    const live =
      startedAtRef.current !== null
        ? Date.now() - startedAtRef.current
        : 0;
    return Math.round((totalElapsedRef.current + live) / 1000);
  }

  function saveAndExit() {
    if (rating === 0) return;
    haptic.heavy();
    const effectiveTestId = testId ?? "free-study";
    const effectiveBlockIdx =
      blockIdx !== null ? blockIdx : Math.floor(Date.now() / 1000);
    logBlock({
      testId: effectiveTestId,
      blockIdx: effectiveBlockIdx,
      completedAt: new Date().toISOString(),
      rating,
      note: note.trim() || undefined,
      durationSec: elapsedSec(),
    });
    toast.success("記録しました");
    router.push(testId ? `/app/test/${testId}` : "/app");
  }

  if (!hydrated) {
    return <LoadingState />;
  }

  const elapsedRatio = 1 - remaining / DEFAULT_DURATION_SEC;

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(160deg, #14130f 0%, #1c1a17 40%, #0f2a4a 80%, #0a1e36 100%)",
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-safe-top pt-4">
        <button
          type="button"
          onClick={async () => {
            // タイマー稼働中は誤バック防止
            if (phase === "running" || phase === "paused") {
              const ok = await confirm({
                title: "タイマーを止めて戻りますか?",
                body: "現在の進捗は破棄されます。",
                confirmLabel: "戻る",
                danger: true,
              });
              if (!ok) return;
            }
            router.push(testId ? `/app/test/${testId}` : "/app/focus");
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur-sm transition hover:bg-white/15 active:scale-95"
          aria-label="戻る"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/85">
          <span className="h-1.5 w-1.5 rounded-full bg-mint-500" />
          {phase === "running" ? "集中中" : phase === "paused" ? "一時停止" : phase === "finished" ? "完了" : "準備"}
        </span>
        <button
          type="button"
          onClick={() => router.push("/app")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur-sm transition hover:bg-white/15 active:scale-95"
          aria-label="閉じる"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-5 pb-12 pt-6">
        {phase !== "finished" ? (
          <TimerView
            block={block}
            phase={phase}
            remaining={remaining}
            ratio={elapsedRatio}
            onStart={start}
            onPause={pause}
            onResume={resume}
            onReset={reset}
            onFinish={finishEarly}
          />
        ) : (
          <FinishView
            block={block}
            rating={rating}
            setRating={setRating}
            note={note}
            setNote={setNote}
            onSave={saveAndExit}
            disabled={rating === 0 || alreadyLogged}
            alreadyLogged={alreadyLogged}
            hasContext={!!testId && blockIdx !== null}
          />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TimerView                                                           */
/* ------------------------------------------------------------------ */

function TimerView({
  block,
  phase,
  remaining,
  ratio,
  onStart,
  onPause,
  onResume,
  onReset,
  onFinish,
}: {
  block: Block | null;
  phase: Phase;
  remaining: number;
  ratio: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onFinish: () => void;
}) {
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const minsLeft = Math.ceil(remaining / 60);

  return (
    <>
      <GoalCard block={block} />

      {/* Timer */}
      <section className="mt-10 flex flex-col items-center">
        <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
          <RingTimer ratio={ratio} phase={phase} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div
              className="font-mono text-[52px] font-black tabular-nums leading-none text-white"
              style={{ letterSpacing: "-0.02em" }}
              aria-live="polite"
              aria-label={`残り時間 ${mins}分${secs}秒`}
            >
              <span>{String(mins).padStart(2, "0")}</span>
              <span className="text-white/30">:</span>
              <span>{String(secs).padStart(2, "0")}</span>
            </div>
            <TimerLabel phase={phase} minsLeft={minsLeft} ratio={ratio} />
          </div>
        </div>
      </section>

      {/* Controls */}
      <Controls
        phase={phase}
        onStart={onStart}
        onPause={onPause}
        onResume={onResume}
        onReset={onReset}
        onFinish={onFinish}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  GoalCard                                                            */
/* ------------------------------------------------------------------ */

function GoalCard({ block }: { block: Block | null }) {
  return (
    <section
      className="rounded-2xl p-4 text-white"
      style={{
        background: "rgba(255,255,255,0.07)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.10)",
      }}
      aria-label="今回の学習目標"
    >
      {block ? (
        <>
          <div
            className="text-[10px] font-bold"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            {block.subject} / {block.topic}
          </div>
          <div className="mt-1 text-base font-bold text-white/90">
            {block.source}
          </div>
          <div
            className="mt-3 flex items-start gap-2.5 rounded-xl p-3"
            style={{ background: "rgba(77,155,255,0.15)" }}
          >
            <Target
              className="mt-0.5 h-4 w-4 flex-none"
              style={{ color: "#7bb8ff" }}
              aria-hidden="true"
            />
            <div>
              <div
                className="text-[10px] font-bold"
                style={{ color: "#7bb8ff" }}
              >
                完了条件
              </div>
              <div className="mt-0.5 text-sm font-bold leading-relaxed text-white">
                {block.completion}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-white/90">
            自由学習モード
          </div>
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
            style={{
              background: "rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            Free Focus
          </span>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  TimerLabel                                                          */
/* ------------------------------------------------------------------ */

function TimerLabel({
  phase,
  minsLeft,
  ratio,
}: {
  phase: Phase;
  minsLeft: number;
  ratio: number;
}) {
  const labelText =
    phase === "idle"
      ? "集中時間"
      : phase === "running"
        ? ratio < 0.8
          ? `あと ${minsLeft} 分`
          : "もうすぐ完了"
        : "一時停止中";

  return (
    <div
      className="mt-2 text-[11px] font-bold"
      style={{ color: "rgba(255,255,255,0.35)" }}
    >
      {labelText}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  RingTimer                                                           */
/* ------------------------------------------------------------------ */

function RingTimer({ ratio, phase }: { ratio: number; phase: Phase }) {
  const clamped = Math.max(0, Math.min(1, ratio));
  const size = 220;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped);

  const ringColor =
    clamped < 0.5
      ? "#4d9bff"
      : clamped < 0.8
        ? "#6fd4a0"
        : "#ffd047";

  const glowColor =
    clamped < 0.5
      ? "rgba(77,155,255,0.35)"
      : clamped < 0.8
        ? "rgba(111,212,160,0.35)"
        : "rgba(255,208,71,0.35)";

  return (
    <svg
      width={size}
      height={size}
      className="-rotate-90"
      style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
      aria-hidden="true"
    >
      {/* track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={stroke}
      />
      {/* progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={ringColor}
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={phase === "idle" ? c : offset}
        strokeLinecap="round"
        style={{
          transition: "stroke-dashoffset 1s linear, stroke 0.8s ease",
          willChange: "transform",
        }}
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Controls                                                            */
/* ------------------------------------------------------------------ */

function Controls({
  phase,
  onStart,
  onPause,
  onResume,
  onReset,
  onFinish,
}: {
  phase: Phase;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onFinish: () => void;
}) {
  const secondaryBtn =
    "flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/15 active:scale-95";

  const mainBtn =
    "flex h-16 w-16 items-center justify-center rounded-full bg-white text-ink-900 transition hover:shadow-[0_12px_32px_rgba(0,0,0,0.35)] active:scale-95";

  // PDF原則 05: 危険操作は端へ
  // 終了は ⋯ ボタン (右端) に隔離し、長押し (700ms) で実行。誤タップで25分が消えない。
  const [pressingFinish, setPressingFinish] = useState(false);
  const pressTimerRef = useRef<number | null>(null);

  function startFinishPress() {
    haptic.medium();
    setPressingFinish(true);
    pressTimerRef.current = window.setTimeout(() => {
      haptic.success();
      setPressingFinish(false);
      pressTimerRef.current = null;
      onFinish();
    }, 700);
  }
  function cancelFinishPress() {
    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    setPressingFinish(false);
  }
  useEffect(
    () => () => {
      if (pressTimerRef.current !== null) window.clearTimeout(pressTimerRef.current);
    },
    [],
  );

  return (
    <>
      <section
        className="mt-10 flex items-center justify-center gap-5"
        aria-label="タイマーコントロール"
      >
        {phase === "idle" && (
          <button
            type="button"
            onClick={onStart}
            className={mainBtn}
            style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}
            aria-label="集中タイマーを開始"
          >
            <Play className="h-7 w-7" fill="currentColor" aria-hidden="true" />
          </button>
        )}

        {phase === "running" && (
          <>
            <button
              type="button"
              onClick={onReset}
              className={secondaryBtn}
              aria-label="タイマーをリセット"
            >
              <RotateCcw className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onPause}
              className={mainBtn}
              style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}
              aria-label="一時停止"
            >
              <Pause className="h-7 w-7" fill="currentColor" aria-hidden="true" />
            </button>
            <button
              type="button"
              onPointerDown={startFinishPress}
              onPointerUp={cancelFinishPress}
              onPointerCancel={cancelFinishPress}
              onPointerLeave={cancelFinishPress}
              className={cn(
                secondaryBtn,
                pressingFinish && "bg-coral-500/30 ring-2 ring-coral-400",
              )}
              aria-label="長押しでタイマーを終了"
            >
              <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
            </button>
          </>
        )}

        {phase === "paused" && (
          <>
            <button
              type="button"
              onClick={onReset}
              className={secondaryBtn}
              aria-label="タイマーをリセット"
            >
              <RotateCcw className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onResume}
              className={mainBtn}
              style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}
              aria-label="タイマーを再開"
            >
              <Play className="h-7 w-7" fill="currentColor" aria-hidden="true" />
            </button>
            <button
              type="button"
              onPointerDown={startFinishPress}
              onPointerUp={cancelFinishPress}
              onPointerCancel={cancelFinishPress}
              onPointerLeave={cancelFinishPress}
              className={cn(
                secondaryBtn,
                pressingFinish && "bg-coral-500/30 ring-2 ring-coral-400",
              )}
              aria-label="長押しでタイマーを終了"
            >
              <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
            </button>
          </>
        )}
      </section>
      {(phase === "running" || phase === "paused") && (
        <p className="mt-4 text-center text-[11px] text-white/40">
          長押しで終了
        </p>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  FinishView                                                          */
/* ------------------------------------------------------------------ */

function FinishView({
  block,
  rating,
  setRating,
  note,
  setNote,
  onSave,
  disabled,
  alreadyLogged,
  hasContext,
}: {
  block: Block | null;
  rating: number;
  setRating: (n: number) => void;
  note: string;
  setNote: (s: string) => void;
  onSave: () => void;
  disabled: boolean;
  alreadyLogged: boolean;
  hasContext: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* お疲れさまカード — セレブレーション演出付き */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-mint-50/50 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] animate-fade-in-up">
        {/* 装飾スパークル (絶対配置の dot 4つ) */}
        <span
          className="pointer-events-none absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-mint-400 pulse-soft"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute right-12 top-6 h-1 w-1 rounded-full bg-sun-300 pulse-soft"
          style={{ animationDelay: "0.4s" }}
          aria-hidden
        />
        <span
          className="pointer-events-none absolute right-7 top-10 h-1 w-1 rounded-full bg-sky-300 pulse-soft"
          style={{ animationDelay: "0.8s" }}
          aria-hidden
        />
        <span
          className="pointer-events-none absolute right-16 top-3 h-1 w-1 rounded-full bg-mint-300 pulse-soft"
          style={{ animationDelay: "1.2s" }}
          aria-hidden
        />
        <h2 className="text-2xl font-black text-ink-900 leading-tight">
          25分、完走
        </h2>
        {block ? (
          <div className="mt-4 rounded-xl bg-sky-50 p-3">
            <div className="text-[10px] font-bold text-sky-600">
              振り返り：完了条件
            </div>
            <p className="mt-1 text-sm font-bold text-ink-900 leading-relaxed">
              {block.completion}
            </p>
          </div>
        ) : null}
      </section>

      {/* 自己評価 */}
      <section className="rounded-2xl bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.10)]">
        <div className="text-[13px] font-bold text-ink-900">今回の達成度</div>
        <div
          className="mt-3 flex items-center justify-center gap-3"
          role="group"
          aria-label="集中度の自己評価"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                haptic.light();
                setRating(n);
              }}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl transition hover:scale-110 active:scale-95",
                rating >= n
                  ? "bg-sun-300 text-ink-900"
                  : "bg-cream-100 text-ink-300",
              )}
              aria-label={`${n}点`}
              aria-pressed={rating >= n}
            >
              <Star
                className="h-6 w-6"
                fill={rating >= n ? "currentColor" : "none"}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      </section>

      {/* メモ */}
      <section className="rounded-2xl bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.10)]">
        <div className="text-[10px] font-bold text-ink-400">
          Memo（任意）
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="ひっかかった点・次に試したいこと"
          rows={3}
          aria-label="振り返りメモ"
          className="mt-2 w-full rounded-xl border border-cream-200 bg-cream-50 px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      </section>

      {alreadyLogged ? (
        <div className="rounded-2xl border border-mint-200 bg-mint-50 p-3 text-xs text-mint-600">
          このブロックは記録済みです。新しい記録には上書きされません。
        </div>
      ) : null}

      {/* 保存ボタン — disabled 理由を明示 */}
      <button
        type="button"
        onClick={onSave}
        disabled={disabled}
        aria-label={hasContext ? "集中記録を保存して戻る" : "集中セッションを完了する"}
        className={cn(
          "flex h-14 w-full items-center justify-center rounded-2xl text-base font-black text-white transition",
          disabled
            ? "bg-ink-300 cursor-not-allowed"
            : "bg-mint-500 shadow-[0_4px_20px_rgba(15,155,94,0.35)] active:scale-[0.98] hover:shadow-[0_6px_24px_rgba(15,155,94,0.45)]",
        )}
      >
        {disabled ? "★ で達成度を選んで記録" : hasContext ? "記録して戻る" : "完了"}
      </button>
    </div>
  );
}
