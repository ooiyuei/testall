"use client";

// Spotify Now Playing 風の集中タイマーミニバー。
// タイマーが走っていれば、BottomNav の上に固定表示。タップで FocusRun に戻る。
// FocusRun 自体（/app/focus/run）では非表示。

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Pause, Play, Timer } from "lucide-react";
import { focusSession, remainingSec, type FocusSession } from "@/lib/focus-session";
import { haptic } from "@/lib/haptic";

function fmtMMSS(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function MiniFocusBar() {
  const pathname = usePathname();
  const [session, setSession] = useState<FocusSession | null>(null);
  const [tick, setTick] = useState<number>(0);

  // localStorage の変化を購読
  useEffect(() => {
    setSession(focusSession.read());
    const onChange = () => setSession(focusSession.read());
    window.addEventListener("storage", onChange);
    window.addEventListener("testall:focus-session", onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener("testall:focus-session", onChange);
    };
  }, []);

  // running 中は 1 秒ごとに再描画
  useEffect(() => {
    if (!session || session.phase !== "running") return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [session?.phase, session?.startedAt]);

  // FocusRun 自体では出さない
  if (pathname.startsWith("/app/focus/run")) return null;
  if (!session) return null;

  const remaining = remainingSec(session);
  const ratio = 1 - remaining / session.totalSec;
  const isRunning = session.phase === "running";

  // 残り 0 のまま放置されてたらクリア
  if (remaining <= 0 && session.phase === "running") {
    focusSession.clear();
    return null;
  }

  return (
    <Link
      href={session.returnHref}
      onClick={() => haptic.light()}
      className="pb-safe fixed inset-x-0 bottom-[64px] z-30 mx-auto block w-full max-w-[480px] px-3"
      // tick を value にして再描画
      data-tick={tick}
    >
      <div className="relative flex items-center gap-3 rounded-2xl border border-ink-100/80 bg-white/95 px-3 py-2.5 shadow-[0_-2px_12px_-4px_rgba(20,19,15,0.12)] backdrop-blur-xl transition active:scale-[0.99]">
        <div
          className={
            "flex h-9 w-9 flex-none items-center justify-center rounded-full " +
            (isRunning
              ? "bg-sky-500 text-white"
              : "bg-cream-100 text-ink-500")
          }
        >
          {isRunning ? (
            <Timer className="h-4 w-4" strokeWidth={2.2} />
          ) : (
            <Pause className="h-4 w-4" strokeWidth={2.2} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-[15px] font-extrabold tabular-nums tracking-tight text-ink-900">
              {fmtMMSS(remaining)}
            </span>
            <span className="text-[10px] font-medium text-ink-400">
              {isRunning ? "残り" : "一時停止中"}
            </span>
          </div>
          <div className="mt-0.5 truncate text-[10px] text-ink-500">
            {session.label ?? "自由学習"}
          </div>
          {/* 細い progress bar */}
          <div className="mt-1 h-[2px] w-full overflow-hidden rounded-full bg-cream-100">
            <div
              className={isRunning ? "h-full bg-sky-500" : "h-full bg-ink-300"}
              style={{
                width: `${Math.min(100, Math.max(0, ratio * 100))}%`,
                transition: "width 0.5s linear",
              }}
            />
          </div>
        </div>
        <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-cream-100 text-ink-700">
          <Play className="h-3 w-3" fill="currentColor" strokeWidth={0} />
        </span>
      </div>
    </Link>
  );
}
