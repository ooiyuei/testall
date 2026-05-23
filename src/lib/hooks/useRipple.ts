"use client";

// Material 風タッチ・リップル波紋を生成するフック。
// onPointerDown を要素に紐づけると、クリック座標から円形 ripple がフェードして広がる。
//
// 使い方:
//   const { ripples, onPointerDown } = useRipple();
//   <button onPointerDown={onPointerDown} className="relative overflow-hidden">
//     ...
//     {ripples}
//   </button>
//
// reduce-motion 環境では無効。

import { useCallback, useState } from "react";

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

let nextId = 0;

export function useRipple(): {
  ripples: React.ReactNode;
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
} {
  const [list, setList] = useState<Ripple[]>([]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (typeof window !== "undefined") {
      try {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      } catch {}
    }
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 1.6;
    const id = ++nextId;
    setList((prev) => [...prev, { id, x, y, size }]);
    window.setTimeout(() => {
      setList((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  }, []);

  const ripples = list.map((r) => (
    <span
      key={r.id}
      aria-hidden
      className="pointer-events-none absolute rounded-full bg-current opacity-25"
      style={{
        left: r.x - r.size / 2,
        top: r.y - r.size / 2,
        width: r.size,
        height: r.size,
        animation: "ripple 600ms cubic-bezier(0.2, 0.7, 0.2, 1) forwards",
      }}
    />
  ));

  return { ripples, onPointerDown };
}
