"use client";

// ルート遷移時にトップに進行バーを表示する NProgress 風。
// next/navigation の Link クリック → useEffect(usePathname) の再実行を活用。
// Pathname が変わると 0 → 100% を 600ms かけて流す。

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function RouteProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState<number>(0);
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    setVisible(true);
    setProgress(20);
    const t1 = window.setTimeout(() => {
      if (mounted) setProgress(70);
    }, 120);
    const t2 = window.setTimeout(() => {
      if (mounted) setProgress(100);
    }, 360);
    const t3 = window.setTimeout(() => {
      if (mounted) {
        setVisible(false);
        setProgress(0);
      }
    }, 620);
    return () => {
      mounted = false;
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [pathname]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] mx-auto h-[2px] max-w-[480px]"
    >
      <div
        className="h-full bg-sky-500 transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
          boxShadow:
            visible && progress < 100
              ? "0 0 8px var(--color-sky-500)"
              : "none",
        }}
      />
    </div>
  );
}
