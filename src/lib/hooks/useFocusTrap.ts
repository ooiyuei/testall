"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * モーダル/シート内で Tab キーが循環するように focus を閉じ込めるフック。
 * open=true の間だけアクティブ。Esc キーは別途扱う（呼び出し元責任）。
 *
 * 使い方:
 *   const ref = useFocusTrap<HTMLDivElement>(open);
 *   <div ref={ref}>...</div>
 */
export function useFocusTrap<T extends HTMLElement>(
  active: boolean,
): React.RefObject<T | null> {
  const containerRef = useRef<T | null>(null);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    // 最初のフォーカス可能要素にフォーカスを送る
    const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    if (focusables.length > 0) {
      // setTimeout で React の autoFocus と競合しないように後送り
      const id = window.setTimeout(() => focusables[0]?.focus(), 0);

      const handleKey = (e: KeyboardEvent) => {
        if (e.key !== "Tab") return;
        const list = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (list.length === 0) return;
        const first = list[0];
        const last = list[list.length - 1];
        const activeEl = document.activeElement as HTMLElement | null;
        if (e.shiftKey) {
          if (activeEl === first || !container.contains(activeEl)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (activeEl === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };

      document.addEventListener("keydown", handleKey);
      return () => {
        window.clearTimeout(id);
        document.removeEventListener("keydown", handleKey);
        // 閉じる時、元のフォーカス位置に戻す
        previouslyFocused?.focus?.();
      };
    }
    return () => {
      previouslyFocused?.focus?.();
    };
  }, [active]);

  return containerRef;
}
