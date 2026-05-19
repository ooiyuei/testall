"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 数字を滑らかにカウントアップ/ダウンするフック。
 * value が変わるたびに duration ミリ秒かけて遷移する。
 *
 * - prefers-reduced-motion 時は即値返却
 * - 初回ロードは即時 (initial 表示の点滅を防ぐ)
 */
export function useCountUp(value: number, duration: number = 600): number {
  const [display, setDisplay] = useState<number>(value);
  const startedAt = useRef<number | null>(null);
  const startValue = useRef<number>(value);
  const rafId = useRef<number | null>(null);
  const isFirstRender = useRef<boolean>(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setDisplay(value);
      return;
    }
    if (typeof window !== "undefined") {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setDisplay(value);
        return;
      }
    }
    startValue.current = display;
    startedAt.current = null;

    const tick = (ts: number): void => {
      if (startedAt.current === null) startedAt.current = ts;
      const elapsed = ts - startedAt.current;
      const t = Math.min(1, elapsed / duration);
      // ease-out-quart
      const eased = 1 - Math.pow(1 - t, 4);
      const next = startValue.current + (value - startValue.current) * eased;
      setDisplay(Math.round(next));
      if (t < 1) {
        rafId.current = requestAnimationFrame(tick);
      }
    };

    rafId.current = requestAnimationFrame(tick);
    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return display;
}
