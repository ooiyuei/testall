"use client";

// Pull-to-refresh コンポーネント。
// スクロール位置が頂上 (scrollY=0) かつ touchmove で下方向にドラッグした時のみ発動。
// 閾値到達でハプティック、release で onRefresh() を呼ぶ。
//
// 使い方:
//   <PullToRefresh onRefresh={async () => { await reload(); }}>
//     <YourContent />
//   </PullToRefresh>

import { useRef, useState } from "react";
import { Loader2, ArrowDown } from "lucide-react";
import { haptic } from "@/lib/haptic";

interface PullToRefreshProps {
  onRefresh: () => void | Promise<void>;
  /** ドラッグの引き下げ閾値 (px)。デフォルト 64. */
  threshold?: number;
  /** ドラッグの「重さ」(>1 で重くなる)。デフォルト 2.2. */
  resistance?: number;
  children: React.ReactNode;
}

type Phase = "idle" | "pulling" | "ready" | "refreshing";

export function PullToRefresh({
  onRefresh,
  threshold = 64,
  resistance = 2.2,
  children,
}: PullToRefreshProps) {
  const startY = useRef<number>(0);
  const offset = useRef<number>(0);
  const [pull, setPull] = useState<number>(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const passedThresholdRef = useRef<boolean>(false);

  function onTouchStart(e: React.TouchEvent) {
    if (window.scrollY > 0) return;
    if (phase === "refreshing") return;
    startY.current = e.touches[0].clientY;
    offset.current = 0;
    passedThresholdRef.current = false;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (phase === "refreshing") return;
    if (window.scrollY > 0) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy <= 0) {
      if (pull > 0) setPull(0);
      if (phase !== "idle") setPhase("idle");
      return;
    }
    const eased = dy / resistance;
    offset.current = eased;
    setPull(eased);
    if (eased >= threshold && !passedThresholdRef.current) {
      passedThresholdRef.current = true;
      haptic.medium();
      setPhase("ready");
    } else if (eased < threshold && passedThresholdRef.current) {
      passedThresholdRef.current = false;
      setPhase("pulling");
    } else if (phase === "idle") {
      setPhase("pulling");
    }
  }

  async function onTouchEnd() {
    if (phase === "ready") {
      setPhase("refreshing");
      setPull(threshold);
      try {
        await Promise.resolve(onRefresh());
      } finally {
        setPhase("idle");
        setPull(0);
        passedThresholdRef.current = false;
      }
    } else {
      setPhase("idle");
      setPull(0);
      passedThresholdRef.current = false;
    }
  }

  const showIndicator = phase !== "idle" || pull > 0;
  const indicatorOpacity = Math.min(1, pull / threshold);
  const ringRotate = Math.min(1, pull / threshold) * 360;

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      {showIndicator ? (
        <div
          className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 flex items-center justify-center"
          style={{
            top: `${Math.max(8, pull - 32)}px`,
            opacity: indicatorOpacity,
          }}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-card">
            {phase === "refreshing" ? (
              <Loader2 className="h-4 w-4 text-sky-500 ptr-spin" />
            ) : (
              <ArrowDown
                className="h-4 w-4 text-sky-500 transition-transform"
                style={{
                  transform: `rotate(${phase === "ready" ? 180 : ringRotate / 2}deg)`,
                }}
              />
            )}
          </div>
        </div>
      ) : null}
      <div
        style={{
          transform: pull > 0 ? `translateY(${pull * 0.5}px)` : undefined,
          transition: phase === "idle" || phase === "refreshing"
            ? "transform 220ms cubic-bezier(0.2, 0.7, 0.2, 1)"
            : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
