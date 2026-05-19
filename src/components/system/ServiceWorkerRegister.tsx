"use client";

// Service Worker 登録 — 本番 (HTTPS) のみ
// 開発中は自動で登録解除して、HMR / Turbopack を邪魔しない

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const isDev = process.env.NODE_ENV !== "production";

    if (isDev) {
      // 開発中は登録解除
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const r of regs) r.unregister();
      });
      return;
    }

    // 本番: /sw.js を登録
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch(() => {
        /* noop */
      });
  }, []);

  return null;
}
