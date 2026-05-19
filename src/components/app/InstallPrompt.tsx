"use client";

// PWA インストールプロンプト
// Android Chrome: beforeinstallprompt → ネイティブダイアログ
// iOS Safari: 「共有」→「ホーム画面に追加」を案内

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { cn } from "@/lib/cn";

const DISMISSED_KEY = "testall:install-prompt-dismissed";
const SHOWN_DELAY_MS = 1500;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  // iPad は新OSで Mac と区別しづらいので touchPoint チェックも併用
  const isIPad =
    ua.includes("Macintosh") &&
    typeof navigator !== "undefined" &&
    "maxTouchPoints" in navigator &&
    navigator.maxTouchPoints > 1;
  return /iPhone|iPad|iPod/.test(ua) || isIPad;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  // iOS は navigator.standalone、その他は display-mode: standalone
  // @ts-expect-error - navigator.standalone is iOS-specific
  if (navigator.standalone) return true;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  return false;
}

export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [iosMode, setIosMode] = useState(false);
  const [deferredEvent, setDeferredEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;
    try {
      if (localStorage.getItem(DISMISSED_KEY)) return;
    } catch {
      /* noop */
    }

    const ios = detectIOS();
    let timer: number | null = null;

    if (ios) {
      setIosMode(true);
      timer = window.setTimeout(() => setVisible(true), SHOWN_DELAY_MS);
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
      timer = window.setTimeout(() => setVisible(true), SHOWN_DELAY_MS);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      if (timer !== null) window.clearTimeout(timer);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      /* noop */
    }
  }

  async function promptInstall() {
    if (!deferredEvent) return;
    await deferredEvent.prompt();
    const { outcome } = await deferredEvent.userChoice;
    if (outcome === "accepted") dismiss();
    setDeferredEvent(null);
  }

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-3 bottom-24 z-40 mx-auto max-w-[460px] rounded-2xl border border-sky-200 bg-white p-4 shadow-[0_18px_40px_-16px_rgba(50,46,41,0.25)] animate-slideDown",
      )}
      role="dialog"
      aria-label="ホーム画面に追加"
    >
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-ink-400"
        aria-label="閉じる"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="flex items-start gap-3 pr-7">
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-sky-100 text-sky-600">
          {iosMode ? (
            <Share className="h-4 w-4" strokeWidth={2.4} />
          ) : (
            <Download className="h-4 w-4" strokeWidth={2.4} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-bold text-ink-900">
            ホーム画面に追加できます
          </div>
          {iosMode ? (
            <p className="mt-1 text-[11px] leading-[1.7] text-ink-600">
              下の <Share className="inline h-3 w-3" /> 共有 →「ホーム画面に追加」
              <br />
              アプリのように起動できます。
            </p>
          ) : (
            <p className="mt-1 text-[11px] leading-[1.7] text-ink-600">
              1タップでアプリのように起動できます。
            </p>
          )}
        </div>
      </div>

      {!iosMode && deferredEvent ? (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={dismiss}
            className="flex h-9 flex-1 items-center justify-center rounded-xl border border-cream-200 text-[11px] font-bold text-ink-700"
          >
            あとで
          </button>
          <button
            type="button"
            onClick={promptInstall}
            className="flex h-9 flex-1 items-center justify-center rounded-xl bg-ink-900 text-[11px] font-bold text-white"
          >
            追加する
          </button>
        </div>
      ) : null}
    </div>
  );
}
