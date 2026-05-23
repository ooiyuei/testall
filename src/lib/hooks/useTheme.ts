"use client";

// ダークモード/ライトモード切替フック。
// "light" | "dark" | "system" の 3 状態を localStorage に保存。
// system は prefers-color-scheme に追従。
//
// html.dark クラスを切り替えるだけで globals.css の CSS variable が反転し、
// 既存の bg-cream-50 / text-ink-900 が全コンポーネントで dark 化される。

import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

const KEY = "testall.theme";

function readStored(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const v = window.localStorage.getItem(KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {}
  return "system";
}

function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme !== "system") return theme;
  if (typeof window === "undefined") return "light";
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

function applyTheme(resolved: "light" | "dark"): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
    root.setAttribute("data-theme", "dark");
  } else {
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
  }
  // meta[theme-color] も追従させて iOS Safari のステータスバー色を合わせる
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", resolved === "dark" ? "#14130f" : "#fbfaf7");
  }
}

export function useTheme(): {
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (t: Theme) => void;
} {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  // 初期化: localStorage から読み込み、適用
  useEffect(() => {
    const t = readStored();
    setThemeState(t);
    const r = resolveTheme(t);
    setResolved(r);
    applyTheme(r);
  }, []);

  // system 設定時は prefers-color-scheme の変化を購読
  useEffect(() => {
    if (theme !== "system") return;
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (): void => {
      const r = resolveTheme("system");
      setResolved(r);
      applyTheme(r);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try {
      window.localStorage.setItem(KEY, t);
    } catch {}
    const r = resolveTheme(t);
    setResolved(r);
    applyTheme(r);
  }, []);

  return { theme, resolved, setTheme };
}

/**
 * FOUC (Flash Of Unstyled Content) 防止用のインラインスクリプト。
 * layout.tsx の <head> に dangerouslySetInnerHTML で先に注入する。
 * React の hydrate より先に html.dark を付けることでチカチカを防ぐ。
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('testall.theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d){document.documentElement.classList.add('dark');document.documentElement.setAttribute('data-theme','dark');var m=document.querySelector('meta[name=theme-color]');if(m)m.setAttribute('content','#14130f');}}catch(e){}})();`;
