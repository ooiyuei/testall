"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, Mail } from "lucide-react";
import { cn } from "@/lib/cn";
import { signInWithGoogle, signInWithMagicLink } from "@/lib/auth";

type Mode = "signin" | "signup";

export function AuthScreen({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [emailMode, setEmailMode] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const isSignup = mode === "signup";

  async function continueAs(method: string) {
    setErrorMsg(null);
    setSubmitting(method);
    try {
      if (method === "google") {
        await signInWithGoogle();
        // signInWithGoogle redirects; no further action needed here
      }
    } catch (err) {
      setErrorMsg("ログインに失敗しました。もう一度お試しください。");
      setSubmitting(null);
    }
  }

  async function submitEmail() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("正しいメールアドレスを入力してください");
      return;
    }
    setErrorMsg(null);
    setSubmitting("email");
    try {
      await signInWithMagicLink(email);
      setEmailSent(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "メール送信に失敗しました");
    } finally {
      setSubmitting(null);
    }
  }

  function continueAsGuest() {
    // Supabase 未接続でも sessionStorage で動く
    router.push("/onboarding");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-cream-50 px-5 py-6">
      <header className="flex items-center">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink-700 hover:bg-cream-100"
          aria-label="戻る"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
      </header>

      <main className="mt-12 flex flex-1 flex-col">
        <h1 className="text-[28px] font-black leading-tight text-ink-900">
          {isSignup ? "Testallをはじめる" : "おかえりなさい"}
        </h1>
        <p className="mt-2 text-sm text-ink-600">
          {isSignup
            ? "テストを次の45分に変える、受験戦略OSへ。"
            : "サインインして続きから。"}
        </p>

        {emailSent ? (
          <div className="mt-10 rounded-2xl border border-mint-200 bg-mint-50 p-5 text-center">
            <Mail className="mx-auto h-8 w-8 text-mint-600" strokeWidth={2.2} />
            <h2 className="mt-3 text-base font-bold text-ink-900">
              メールを送りました
            </h2>
            <p className="mt-1 text-[12px] leading-[1.7] text-ink-600">
              {email} 宛のリンクから {isSignup ? "登録" : "サインイン"} を完了してください。
            </p>
            <button
              type="button"
              onClick={() => {
                setEmailSent(false);
                setEmailMode(false);
                setEmail("");
              }}
              className="mt-4 text-[11px] font-bold text-sky-600 underline-offset-2 hover:underline"
            >
              別の方法で続ける
            </button>
          </div>
        ) : emailMode ? (
          <div className="mt-10 space-y-3">
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
                メールアドレス
              </span>
              <input
                type="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                inputMode="email"
                autoComplete="email"
                className="mt-1.5 h-12 w-full rounded-xl border border-cream-200 bg-white px-3 text-base text-ink-900 outline-none focus:border-sky-400"
              />
            </label>
            <button
              type="button"
              onClick={submitEmail}
              disabled={submitting === "email"}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 text-sm font-black text-white shadow-soft active:scale-[0.98] transition disabled:opacity-50"
            >
              {submitting === "email"
                ? "送信中…"
                : isSignup
                  ? "登録リンクを送る"
                  : "サインインリンクを送る"}
            </button>
            <button
              type="button"
              onClick={() => setEmailMode(false)}
              className="block w-full text-center text-[12px] font-medium text-ink-500"
            >
              戻る
            </button>
          </div>
        ) : (
          <div className="mt-10 space-y-3">
            <AuthButton
              provider="google"
              submitting={submitting === "google"}
              onClick={() => continueAs("google")}
            />
            <AuthButton
              provider="apple"
              submitting={false}
              disabled
              label="Appleで続ける（準備中）"
              onClick={() => {}}
            />

            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-cream-200" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-ink-400">
                または
              </span>
              <div className="h-px flex-1 bg-cream-200" />
            </div>

            <AuthButton
              provider="email"
              submitting={false}
              label={isSignup ? "メールで登録" : "メールでサインイン"}
              onClick={() => setEmailMode(true)}
            />

            <button
              type="button"
              onClick={continueAsGuest}
              className="mt-2 block w-full rounded-2xl border border-cream-200 bg-cream-50/50 py-3 text-center text-[12px] font-bold text-ink-700 transition hover:bg-cream-100"
            >
              アカウントなしで試す
            </button>
          </div>
        )}

        {errorMsg ? (
          <p className="mt-4 rounded-xl bg-coral-300/10 px-4 py-3 text-sm font-bold text-coral-500">
            {errorMsg}
          </p>
        ) : null}

        <div className="mt-auto pt-12 text-center text-xs text-ink-500">
          {isSignup ? (
            <>
              すでにアカウントをお持ち？{" "}
              <Link href="/signin" className="font-bold text-sky-600">
                サインイン
              </Link>
            </>
          ) : (
            <>
              アカウントがまだ？{" "}
              <Link href="/signup" className="font-bold text-sky-600">
                登録
              </Link>
            </>
          )}
        </div>
        <p className="mt-3 text-center text-[10px] text-ink-400 leading-relaxed">
          続行すると、Testallの
          <Link href="/terms" className="underline">
            利用規約
          </Link>
          ・
          <Link href="/privacy" className="underline">
            プライバシーポリシー
          </Link>
          に同意したものとみなされます。
        </p>
      </main>
    </div>
  );
}

function AuthButton({
  provider,
  submitting,
  onClick,
  label,
  disabled,
}: {
  provider: "google" | "apple" | "email";
  submitting: boolean;
  onClick: () => void;
  label?: string;
  disabled?: boolean;
}) {
  const meta = {
    google: {
      label: label ?? "Googleで続ける",
      bg: "bg-white border-2 border-cream-200 text-ink-900",
      icon: <GoogleIcon />,
    },
    apple: {
      label: label ?? "Appleで続ける",
      bg: "bg-ink-900 text-white",
      icon: <AppleIcon />,
    },
    email: {
      label: label ?? "メールで続ける",
      bg: "bg-sky-500 text-white",
      icon: null,
    },
  }[provider];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={submitting || disabled}
      className={cn(
        "flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-sm font-black shadow-soft transition active:scale-[0.98]",
        meta.bg,
        (submitting || disabled) && "opacity-50 cursor-not-allowed",
      )}
    >
      {meta.icon}
      <span>{submitting ? "接続中…" : meta.label}</span>
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.12-.84 2.07-1.79 2.71v2.26h2.9c1.7-1.56 2.69-3.86 2.69-6.61z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.81 5.96-2.19l-2.9-2.26c-.81.54-1.84.86-3.06.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.96 10.7A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.16.28-1.7V4.97H.96A8.997 8.997 0 0 0 0 9c0 1.45.35 2.82.96 4.03l3-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A8.997 8.997 0 0 0 .96 4.97l3 2.33C4.67 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.05 12.04c-.03-3.16 2.58-4.68 2.7-4.75-1.47-2.15-3.76-2.45-4.58-2.48-1.95-.2-3.81 1.15-4.8 1.15-.99 0-2.52-1.12-4.14-1.09C4.13 4.9 2.18 6.1 1.13 8c-2.18 3.77-.56 9.36 1.58 12.43 1.05 1.5 2.29 3.19 3.92 3.13 1.57-.06 2.17-1.02 4.07-1.02 1.9 0 2.43 1.02 4.1.99 1.69-.03 2.76-1.53 3.8-3.04 1.2-1.74 1.69-3.44 1.72-3.53-.04-.02-3.3-1.27-3.33-5.02zM14.06 3.13c.86-1.05 1.45-2.5 1.29-3.95-1.25.05-2.78.84-3.68 1.88-.8.93-1.5 2.42-1.31 3.84 1.4.11 2.83-.71 3.7-1.77z" />
    </svg>
  );
}
