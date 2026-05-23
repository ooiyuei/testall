"use client";

import { useEffect } from "react";

interface ShortcutSpec {
  /** "k", "n", "/" など */
  key: string;
  /** Cmd (Mac) or Ctrl (Win/Linux) を必須にする */
  meta?: boolean;
  /** Shift キーが押されている時のみ反応 */
  shift?: boolean;
  /** input/textarea にフォーカス中も発火させる (デフォルト false) */
  allowInInput?: boolean;
  handler: (e: KeyboardEvent) => void;
}

/**
 * グローバルキーボードショートカットを登録するフック。
 *
 * 使い方:
 *   useKeyboardShortcut({ key: "k", meta: true, handler: () => openSearch() });
 *   useKeyboardShortcut({ key: "/", handler: () => focusSearchInput() });
 */
export function useKeyboardShortcut(spec: ShortcutSpec): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // input/textarea 内では基本無効（spec.allowInInput で許可可）
      const target = e.target as HTMLElement | null;
      if (target && !spec.allowInInput) {
        const tag = target.tagName?.toLowerCase();
        const editable = target.isContentEditable;
        if (tag === "input" || tag === "textarea" || tag === "select" || editable) return;
      }
      const metaMatch = spec.meta ? e.metaKey || e.ctrlKey : !(e.metaKey || e.ctrlKey);
      const shiftMatch = spec.shift ? e.shiftKey : true;
      const keyMatch = e.key.toLowerCase() === spec.key.toLowerCase();
      if (metaMatch && shiftMatch && keyMatch) {
        e.preventDefault();
        spec.handler(e);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [spec.key, spec.meta, spec.shift, spec.allowInInput, spec.handler]);
}
