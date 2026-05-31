"use client";

// レベルアップの祝祭オーバーレイ。紙吹雪 + ハプティクス + レベル数字の spring。
// Victory Sequence の最高潮。prefers-reduced-motion は globals.css のセーフティネットで
// アニメが無効化され、紙吹雪/ハプティクスも自動で抑制される。
import { useEffect } from "react";
import { burstConfetti } from "@/lib/confetti";
import { haptic } from "@/lib/haptic";

export function LevelUpOverlay({
  level,
  onDone,
}: {
  level: number;
  onDone: () => void;
}) {
  useEffect(() => {
    haptic.heavy();
    const h = window.setTimeout(() => haptic.success(), 200);
    burstConfetti({ count: 130, origin: { x: 0.5, y: 0.42 } });
    const t = window.setTimeout(onDone, 3400);
    return () => {
      window.clearTimeout(h);
      window.clearTimeout(t);
    };
  }, [onDone]);

  return (
    <div
      role="alertdialog"
      aria-live="assertive"
      aria-label={`レベル ${level} に到達しました`}
      onClick={onDone}
      className="fixed inset-0 z-[9998] flex flex-col items-center justify-center bg-ink-900/85 px-8 text-center backdrop-blur-sm"
    >
      <p className="animate-fade-in-up text-[13px] font-black tracking-[0.3em] text-sun-300">
        LEVEL UP
      </p>
      <div className="mt-3 flex items-end gap-2">
        <span className="mb-2 text-[20px] font-bold text-white/60">Lv</span>
        <span
          className="lvl-pop text-[92px] font-black leading-none text-white tabular-nums"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {level}
        </span>
      </div>
      <p className="animate-fade-in-up mt-5 text-[14px] leading-relaxed text-white/80">
        走り続けてる。
        <br />
        この調子で、次の25分へ。
      </p>
      <p className="mt-10 text-[11px] text-white/40">タップで閉じる</p>
    </div>
  );
}
