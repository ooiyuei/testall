"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
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

const DEFAULT_DURATION_SEC = 25 * 60; // ポモドーロ 25分

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

  // Tick
  useEffect(() => {
    if (phase !== "running") return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setPhase("finished");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  function start() {
    startedAtRef.current = Date.now();
    setPhase("running");
  }

  function pause() {
    if (startedAtRef.current !== null) {
      totalElapsedRef.current += Date.now() - startedAtRef.current;
      startedAtRef.current = null;
    }
    setPhase("paused");
  }

  function resume() {
    startedAtRef.current = Date.now();
    setPhase("running");
  }

  function reset() {
    startedAtRef.current = null;
    totalElapsedRef.current = 0;
    setRemaining(DEFAULT_DURATION_SEC);
    setPhase("idle");
  }

  function finishEarly() {
    if (startedAtRef.current !== null) {
      totalElapsedRef.current += Date.now() - startedAtRef.current;
      startedAtRef.current = null;
    }
    setPhase("finished");
  }

  function elapsedSec(): number {
    const live =
      startedAtRef.current !== null
        ? Date.now() - startedAtRef.current
        : 0;
    return Math.round((totalElapsedRef.current + live) / 1000);
  }

  function saveAndExit() {
    if (rating === 0) return;
    // testId が無い場合は「自由学習」として記録 (連続日数・ヒートマップに反映)
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
    router.push(testId ? `/app/test/${testId}` : "/app");
  }

  if (!hydrated) {
    return <LoadingState />;
  }

  const elapsedRatio = 1 - remaining / DEFAULT_DURATION_SEC;

  return (
    <div className="min-h-screen bg-gradient-to-br from-ink-900 via-ink-800 to-sky-700">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4">
        <Link
          href={testId ? `/app/test/${testId}` : "/app/focus"}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white"
          aria-label="戻る"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
          集中モード
        </span>
        <button
          type="button"
          onClick={() => router.push("/app")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white"
          aria-label="閉じる"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-5 pb-10 pt-6">
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

  return (
    <>
      {/* Goal */}
      <section className="rounded-2xl bg-white/10 p-4 text-white backdrop-blur">
        {block ? (
          <>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/60">
              {block.subject} / {block.topic}
            </div>
            <div className="mt-1 text-base font-black">{block.source}</div>
            <div className="mt-3 flex items-start gap-2 rounded-2xl bg-sky-400/20 p-3">
              <Target className="mt-0.5 h-4 w-4 flex-none text-sky-200" />
              <div className="text-[12px] leading-relaxed text-white">
                <div className="text-[10px] font-bold uppercase tracking-widest text-sky-200">
                  完了条件
                </div>
                <div className="mt-0.5 font-bold">{block.completion}</div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-sm font-bold">
            自由学習 25分。終わったら自己評価してください。
          </div>
        )}
      </section>

      {/* Timer */}
      <section className="mt-8 flex flex-col items-center">
        <RingTimer ratio={ratio} />
        <div className="mt-6 flex items-baseline gap-1 font-mono text-6xl font-black tabular-nums text-white">
          <span>{String(mins).padStart(2, "0")}</span>
          <span className="text-white/40">:</span>
          <span>{String(secs).padStart(2, "0")}</span>
        </div>
        <div className="mt-2 text-[11px] font-bold uppercase tracking-widest text-white/50">
          {phase === "idle"
            ? "スタンバイ"
            : phase === "running"
            ? "進行中"
            : "一時停止中"}
        </div>
      </section>

      {/* Controls */}
      <section className="mt-10 flex items-center justify-center gap-3">
        {phase === "idle" ? (
          <button
            type="button"
            onClick={onStart}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-ink-900 shadow-[0_8px_24px_rgba(0,0,0,0.25)] active:scale-95 transition"
            aria-label="開始"
          >
            <Play className="h-7 w-7" fill="currentColor" />
          </button>
        ) : null}

        {phase === "running" ? (
          <>
            <button
              type="button"
              onClick={onReset}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white"
              aria-label="リセット"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onPause}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-ink-900 shadow-[0_8px_24px_rgba(0,0,0,0.25)] active:scale-95 transition"
              aria-label="一時停止"
            >
              <Pause className="h-7 w-7" fill="currentColor" />
            </button>
            <button
              type="button"
              onClick={onFinish}
              aria-label="タイマーを終了"
              className="flex h-12 items-center justify-center gap-1 rounded-full bg-white/10 px-4 text-xs font-bold text-white/80 transition hover:bg-white/15 active:scale-[0.96]"
            >
              終了
            </button>
          </>
        ) : null}

        {phase === "paused" ? (
          <>
            <button
              type="button"
              onClick={onReset}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white"
              aria-label="リセット"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onResume}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-ink-900 shadow-[0_8px_24px_rgba(0,0,0,0.25)] active:scale-95 transition"
              aria-label="再開"
            >
              <Play className="h-7 w-7" fill="currentColor" />
            </button>
            <button
              type="button"
              onClick={onFinish}
              className="flex h-12 items-center justify-center gap-1 rounded-full bg-white/10 px-4 text-xs font-bold text-white"
            >
              終了
            </button>
          </>
        ) : null}
      </section>
    </>
  );
}

function RingTimer({ ratio }: { ratio: number }) {
  const clamped = Math.max(0, Math.min(1, ratio));
  const size = 220;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped);

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="white"
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s linear" }}
      />
    </svg>
  );
}

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
    <div className="space-y-5">
      <section className="rounded-2xl bg-white p-5 shadow-soft">
        <div className="text-[10px] font-bold uppercase tracking-widest text-mint-600">
          お疲れさま
        </div>
        <h2 className="mt-1 text-lg font-black text-ink-900">
          25分、走り切りました
        </h2>
        {block ? (
          <div className="mt-3 rounded-2xl bg-sky-50 p-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-sky-700">
              振り返り：完了条件
            </div>
            <p className="mt-0.5 text-sm font-bold text-ink-900">
              {block.completion}
            </p>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-soft">
        <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
          自己評価
        </div>
        <p className="mt-1 text-[11px] text-ink-500">
          完了条件にどれくらい届いた？（1：ぜんぜん〜5：完璧）
        </p>
        <div className="mt-3 flex items-center justify-center gap-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl transition",
                rating >= n
                  ? "bg-sun-300 text-ink-900"
                  : "bg-cream-100 text-ink-300",
              )}
              aria-label={`${n}点`}
            >
              <Star
                className="h-6 w-6"
                fill={rating >= n ? "currentColor" : "none"}
              />
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-soft">
        <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
          メモ（任意）
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="ひっかかった点・次に試したいこと"
          rows={3}
          className="mt-2 w-full rounded-xl border border-cream-200 bg-cream-50 px-3 py-2 text-sm text-ink-900 outline-none focus:border-sky-400"
        />
      </section>

      {alreadyLogged ? (
        <div className="rounded-2xl border border-mint-200 bg-mint-50 p-3 text-xs text-mint-600">
          このブロックは記録済みです。新しい記録には上書きされません。
        </div>
      ) : null}

      <button
        type="button"
        onClick={onSave}
        disabled={disabled}
        className={cn(
          "flex h-14 w-full items-center justify-center rounded-2xl text-base font-black text-white shadow-soft transition",
          disabled
            ? "bg-ink-300"
            : "bg-mint-500 active:scale-[0.98]",
        )}
      >
        {hasContext ? "記録して戻る" : "完了"}
      </button>
    </div>
  );
}
