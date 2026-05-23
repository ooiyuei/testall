"use client";

// 左スワイプで赤い削除ボタンが現れるリストアイテム。Apple Mail/Reminders 風。
// 一定閾値（dismissThreshold）を超えると自動的に onDelete を呼ぶ（フルスワイプ削除）。
// 軽く左にスワイプしただけなら削除ボタンが見えるだけで、タップして削除される。
//
// 使い方:
//   <SwipeableRow onDelete={() => deleteTask(id)}>
//     <TaskRow ... />
//   </SwipeableRow>

import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { haptic } from "@/lib/haptic";

interface SwipeableRowProps {
  onDelete: () => void;
  /** スワイプで表示する削除ボタンの幅。デフォルト 84px. */
  actionWidth?: number;
  /** 自動削除の閾値 (px)。デフォルト 160 (フルスワイプ判定). */
  dismissThreshold?: number;
  children: React.ReactNode;
  /** 削除ボタンのラベル */
  deleteLabel?: string;
}

export function SwipeableRow({
  onDelete,
  actionWidth = 84,
  dismissThreshold = 160,
  children,
  deleteLabel = "削除",
}: SwipeableRowProps) {
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const startOffset = useRef<number>(0);
  const dragging = useRef<boolean>(false);
  // 縦/横の方向を先頭数px で確定
  const direction = useRef<"unknown" | "horizontal" | "vertical">("unknown");
  const passedThresholdRef = useRef<boolean>(false);
  const [offset, setOffset] = useState<number>(0); // 負の値 = 左にスワイプ
  const [animating, setAnimating] = useState<boolean>(false);

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    startOffset.current = offset;
    dragging.current = true;
    direction.current = "unknown";
    setAnimating(false);
    passedThresholdRef.current = false;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!dragging.current) return;
    if (direction.current === "vertical") return; // 縦スクロールなら譲る
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    // 8px 移動で方向確定
    if (direction.current === "unknown" && Math.hypot(dx, dy) > 8) {
      direction.current = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
      if (direction.current === "vertical") return;
    }

    const next = Math.min(0, startOffset.current + dx);
    setOffset(next);
    if (next <= -dismissThreshold && !passedThresholdRef.current) {
      passedThresholdRef.current = true;
      haptic.medium();
    } else if (next > -dismissThreshold && passedThresholdRef.current) {
      passedThresholdRef.current = false;
    }
  }

  function onTouchEnd() {
    dragging.current = false;
    setAnimating(true);
    if (offset <= -dismissThreshold) {
      // フルスワイプ → 削除
      haptic.heavy();
      setOffset(-window.innerWidth);
      window.setTimeout(() => {
        onDelete();
      }, 180);
    } else if (offset <= -actionWidth / 2) {
      // 削除ボタンを開いた状態で停止
      setOffset(-actionWidth);
    } else {
      setOffset(0);
    }
  }

  function handleDeleteClick() {
    haptic.medium();
    setAnimating(true);
    setOffset(-window.innerWidth);
    window.setTimeout(() => onDelete(), 180);
  }

  function handleRowClick() {
    // スワイプで開いている時、本体タップで閉じる (タップ vs スワイプの誤判定対策はブラウザに任せる)
    if (offset < -8) {
      setAnimating(true);
      setOffset(0);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* 背後の削除ボタン (最小高さ 44px 確保 = HIG準拠) */}
      <button
        type="button"
        onClick={handleDeleteClick}
        aria-label={deleteLabel}
        className="absolute inset-y-0 right-0 flex min-h-[44px] items-center justify-center bg-coral-500 px-5 text-[12px] font-bold text-white"
        style={{ width: actionWidth }}
      >
        <Trash2 className="mr-1 h-4 w-4" strokeWidth={2.2} />
        {deleteLabel}
      </button>
      {/* 前面の本体 */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onClick={handleRowClick}
        style={{
          transform: `translateX(${offset}px)`,
          transition: animating
            ? "transform 200ms cubic-bezier(0.2, 0.7, 0.2, 1)"
            : undefined,
        }}
        className="relative bg-cream-50"
      >
        {children}
      </div>
    </div>
  );
}
