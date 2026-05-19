// Haptic feedback ユーティリティ
// navigator.vibrate を薄くラップ。Android/対応端末では振動、それ以外（iOS Safari 等）では無視される。
// 5種類の強度をAppleのHaptic Engine分類になぞらえて命名。
//
// 使い方:
//   import { haptic } from "@/lib/haptic";
//   haptic.light();       // タップフィードバック
//   haptic.medium();      // 状態変更（チェック・タブ切替）
//   haptic.heavy();       // 重要アクション（提出・確定）
//   haptic.success();     // タスク完了・タイマー完走
//   haptic.error();       // バリデーション失敗・破壊操作キャンセル
//
// prefers-reduced-motion または "testall.haptic" === "off" で無効化される。

type HapticKind = "light" | "medium" | "heavy" | "success" | "error";

const PATTERNS: Record<HapticKind, number | number[]> = {
  light: 8,
  medium: 14,
  heavy: 22,
  success: [10, 50, 10],
  error: [25, 60, 25, 60, 25],
};

function isEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return false;
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    if (window.localStorage.getItem("testall.haptic") === "off") return false;
  } catch {
    // private モード等で localStorage が読めない場合は許可
  }
  return true;
}

function fire(kind: HapticKind): void {
  if (!isEnabled()) return;
  try {
    navigator.vibrate(PATTERNS[kind]);
  } catch {
    // 一部端末で型エラーや権限エラー → 静かに失敗
  }
}

export const haptic = {
  light: () => fire("light"),
  medium: () => fire("medium"),
  heavy: () => fire("heavy"),
  success: () => fire("success"),
  error: () => fire("error"),
  /** ユーザー設定で OFF にする */
  disable: (): void => {
    try {
      window.localStorage.setItem("testall.haptic", "off");
    } catch {}
  },
  /** OFF を解除 */
  enable: (): void => {
    try {
      window.localStorage.removeItem("testall.haptic");
    } catch {}
  },
  /** 現在 ON かどうか */
  isOn: (): boolean => isEnabled(),
};
