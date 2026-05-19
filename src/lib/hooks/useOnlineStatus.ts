"use client";

import { useEffect, useState } from "react";

/**
 * オンライン/オフライン状態を購読するフック。
 * SSR では true を返す（ハイドレーション時に正しい値に更新）。
 *
 * navigator.onLine + online/offline イベントで監視。
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState<boolean>(true);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    setOnline(navigator.onLine);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return online;
}
