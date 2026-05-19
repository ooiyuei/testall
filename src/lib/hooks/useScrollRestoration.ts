"use client";

// ページごとにスクロール位置を sessionStorage に保存・復元するフック。
// Next.js App Router はデフォルトでルート遷移時 scroll: 0 に戻すため、
// タブ切替時のスクロール位置保持を独自に実装する。

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "testall.scroll";

type ScrollMap = Record<string, number>;

function read(): ScrollMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as ScrollMap;
    return {};
  } catch {
    return {};
  }
}

function write(map: ScrollMap): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // private モード等で書けない場合は無視
  }
}

/**
 * 現在のパスのスクロール位置を保存・復元する。
 * layout 直下のクライアントコンポーネントで一度呼ぶ想定。
 */
export function useScrollRestoration(): void {
  const pathname = usePathname();

  // マウント時/パス変更時に復元
  useEffect(() => {
    const map = read();
    const y = map[pathname];
    if (typeof y === "number") {
      // 描画が落ち着いてから戻す
      requestAnimationFrame(() => {
        window.scrollTo(0, y);
      });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  // スクロール毎に保存（throttle）
  useEffect(() => {
    let ticking = false;
    const onScroll = (): void => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const map = read();
        map[pathname] = window.scrollY;
        write(map);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);
}
