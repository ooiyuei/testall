"use client";

// AuthScreen — SignIn / SignUp 統一デザイン (⑫⑬)
// 上: 「T」バッジ + Testall
// 中: 大見出し + サブ
// 中段: Apple/Google ボタン + or + メールリンク
// 下: 利用規約 + 反対モードへの導線
//
// mode prop で「サインイン」「サインアップ」を切り替え。

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, Mail } from "lucide-react";
import { cn } from "@/lib/cn";
import { signInWithApple, signInWithGoogle, signInWithMagicLink } from "@/lib/auth";
import { haptic } from "@/lib/haptic";

type Mode = "signin" | "signup";

export function AuthScreen({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [emailMode, setEmailMode] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const isSignup = mode === "signup";

  // OAuth callback で帰ってきたエラーを表示
  useEffect(() => {
    const err = searchParams.get("error");
    const desc = searchParams.get("error_description");
    if (!err) return;
    if (err === "access_denied") {
      setErrorMsg("ログインがキャンセルされました");
    } else if (err === "redirect_uri_mismatch") {
      setErrorMsg("リダイレクトURL の設定が一致しません。Google Cloud Console の認可済みリダイレクトURIをご確認ください。");
    } else if (err === "auth_failed") {
      setErrorMsg(desc ? `認証エラー: ${desc}` : "認証に失敗しました");
    } else if (err === "missing_code") {
      setErrorMsg("認証コードが返ってきませんでした。再度お試しください。");
    } else if (err === "supabase_not_configured") {
      setErrorMsg("Supabase が未設定です (環境変数)。");
    } else {
      setErrorMsg(desc ? `${err}: ${desc}` : `エラー: ${err}`);
    }
  }, [searchParams]);

  async function continueAs(method: string) {
    haptic.medium();
    setErrorMsg(null);
    setSubmitting(method);
    try {
      if (method === "google") {
        await signInWithGoogle();
      } else if (method === "apple") {
        await signInWithApple();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      // 開発・本番問わず詳細を画面に表示してデバッグ可能に
      console.error("[auth] signInWithOAuth failed:", e);
      haptic.error();
      if (msg.includes("not configured")) {
        setErrorMsg("Supabase が未設定です。NEXT_PUBLIC_SUPABASE_URL を Vercel に設定してください。");
      } else if (msg.includes("provider") || msg.includes("not enabled") || msg.includes("validation_failed")) {
        const provider = method === "google" ? "Google" : "Apple";
        setErrorMsg(`${provider} ログインプロバイダーが Supabase で未有効です。`);
      } else {
        // 原因不明 → エラーメッセージを生表示
        setErrorMsg(`ログイン失敗: ${msg || "原因不明"}`);
      }
      setSubmitting(null);
    }
  }

  async function submitEmail() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      haptic.error();
      setErrorMsg("正しいメールアドレスを入力してください");
      return;
    }
    haptic.medium();
    setErrorMsg(null);
    setSubmitting("email");
    try {
      await signInWithMagicLink(email);
      haptic.success();
      setEmailSent(true);
    } catch (err) {
      haptic.error();
      setErrorMsg(err instanceof Error ? err.message : "メール送信に失敗しました");
    } finally {
      setSubmitting(null);
    }
  }

  function continueAsGuest() {
    haptic.light();
    router.push("/onboarding");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-cream-50 px-6 pt-6 pb-8">
      {/* Top: back + brand */}
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink-700 transition active:scale-[0.92] active:bg-cream-200/60"
          aria-label="戻る"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2.2} />
        </Link>
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-900 text-[14px] font-extrabold text-white">
            T
          </span>
          <span className="text-[15px] font-extrabold tracking-[-0.02em] text-ink-900">
            Testall
          </span>
        </div>
        <div className="h-9 w-9" />
      </header>

      <main className="mt-12 flex flex-1 flex-col">
        {/* Headline */}
        {isSignup ? (
          <>
            <h1
              className="text-[30px] font-extrabold leading-[1.15] tracking-[-0.03em] text-ink-900"
              style={{ fontFamily: "var(--font-display)" }}
            >
              90秒で診断、
              <br />
              受験戦略を始めよう。
            </h1>
            <p className="mt-2.5 text-[13px] leading-[1.7] text-ink-500">
              無料で使えます。クレジットカード不要。
            </p>

            {/* What you get */}
            <div className="mt-5 rounded-2xl bg-cream-100/60 p-4">
              <Benefit emoji="🎯" label="志望校との差分が分かる" />
              <Benefit emoji="📚" label="参考書ルートが届く" />
              <Benefit emoji="⏱" label="今日の25分が決まる" />
            </div>
          </>
        ) : (
          <>
            <h1
              className="text-[32px] font-extrabold leading-[1.15] tracking-[-0.03em] text-ink-900"
              style={{ fontFamily: "var(--font-display)" }}
            >
              おかえりなさい。
            </h1>
            <p className="mt-2.5 text-[13px] leading-[1.7] text-ink-500">
              続きから受験戦略を整えましょう。
            </p>
          </>
        )}

        {/* Body */}
        {emailSent ? (
          <div
            role="status"
            aria-live="polite"
            className="mt-8 rounded-2xl border border-mint-200 bg-mint-50 p-5 text-center"
          >
            <Mail className="mx-auto h-8 w-8 text-mint-600" strokeWidth={2.2} />
            <h2 className="mt-3 text-[15px] font-bold text-ink-900">
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
          <div className="mt-8 space-y-3">
            <label className="block">
              <span className="text-[11px] font-semibold text-ink-500">
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
                className="mt-1.5 h-[52px] w-full rounded-[14px] border border-ink-100 bg-white px-3.5 text-[14px] text-ink-900 outline-none focus:border-sky-400"
              />
            </label>
            <button
              type="button"
              onClick={submitEmail}
              disabled={submitting === "email"}
              className="flex h-[52px] w-full items-center justify-center gap-1.5 rounded-[14px] bg-ink-900 text-[14px] font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
            >
              {submitting === "email" ? (
                "送信中…"
              ) : (
                <>
                  {isSignup ? "登録リンクを送る" : "メールでサインイン"}
                  <ArrowRight className="h-[15px] w-[15px]" strokeWidth={2.3} />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setEmailMode(false)}
              className="block w-full pt-1 text-center text-[12px] font-medium text-ink-500"
            >
              戻る
            </button>
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-2.5">
            {isSignup ? (
              <>
                <SocialButton
                  variant="apple"
                  submitting={submitting === "apple"}
                  onClick={() => continueAs("apple")}
                  label="Apple で登録"
                />
                <SocialButton
                  variant="google"
                  submitting={submitting === "google"}
                  onClick={() => continueAs("google")}
                  label="Google で登録"
                />
                <button
                  type="button"
                  onClick={() => setEmailMode(true)}
                  className="h-[52px] rounded-[14px] bg-transparent text-[14px] font-semibold text-ink-700 transition active:bg-cream-100"
                >
                  メールで登録
                </button>
              </>
            ) : (
              <>
                <SocialButton
                  variant="google"
                  submitting={submitting === "google"}
                  onClick={() => continueAs("google")}
                  label="Google で続ける"
                />
                <SocialButton
                  variant="apple"
                  submitting={submitting === "apple"}
                  onClick={() => continueAs("apple")}
                  label="Apple で続ける"
                />

                <div className="mt-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-ink-100" />
                  <span className="text-[11px] font-medium text-ink-400">
                    または
                  </span>
                  <div className="h-px flex-1 bg-ink-100" />
                </div>

                <label className="mt-4 block">
                  <span className="text-[11px] font-semibold text-ink-500">
                    メールアドレス
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    inputMode="email"
                    autoComplete="email"
                    className="mt-1.5 h-[52px] w-full rounded-[14px] border border-ink-100 bg-white px-3.5 text-[14px] text-ink-900 outline-none focus:border-sky-400"
                  />
                </label>
                <button
                  type="button"
                  onClick={submitEmail}
                  disabled={submitting === "email"}
                  className="flex h-[52px] w-full items-center justify-center gap-1.5 rounded-[14px] bg-ink-900 text-[14px] font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
                >
                  {submitting === "email" ? (
                    "送信中…"
                  ) : (
                    <>
                      メールでサインイン
                      <ArrowRight className="h-[15px] w-[15px]" strokeWidth={2.3} />
                    </>
                  )}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={continueAsGuest}
              className="mt-3 block w-full rounded-[14px] py-3 text-center text-[12px] font-bold text-ink-500 transition active:bg-cream-100"
            >
              アカウントなしで試す
            </button>
          </div>
        )}

        {errorMsg ? (
          <p
            role="alert"
            aria-live="assertive"
            className="mt-4 rounded-xl bg-coral-300/10 px-4 py-3 text-[12px] font-bold text-coral-500"
          >
            {errorMsg}
          </p>
        ) : null}

        <div className="flex-1" />

        {/* Terms */}
        <p className="mt-8 text-center text-[11px] leading-[1.7] text-ink-400">
          続けることで{" "}
          <Link href="/terms" className="font-semibold text-sky-500">
            利用規約
          </Link>{" "}
          および{" "}
          <Link href="/privacy" className="font-semibold text-sky-500">
            プライバシーポリシー
          </Link>{" "}
          に同意したものとみなされます。
        </p>

        {/* Switch mode */}
        <div className="mt-6 text-center text-[13px] text-ink-600">
          {isSignup ? (
            <>
              すでに登録済み？{" "}
              <Link href="/signin" className="font-bold text-ink-900">
                サインイン ›
              </Link>
            </>
          ) : (
            <>
              はじめての方は{" "}
              <Link href="/signup" className="font-bold text-ink-900">
                無料登録 ›
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function Benefit({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <span className="text-[16px]">{emoji}</span>
      <span className="text-[13px] font-semibold text-ink-900">{label}</span>
    </div>
  );
}

function SocialButton({
  variant,
  submitting,
  onClick,
  label,
  disabled,
}: {
  variant: "google" | "apple";
  submitting?: boolean;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  const isApple = variant === "apple";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={submitting || disabled}
      className={cn(
        "flex h-[52px] w-full items-center justify-center gap-2.5 rounded-[14px] text-[14px] font-semibold transition active:scale-[0.98]",
        isApple
          ? "bg-ink-900 text-white"
          : "border border-ink-200 bg-white text-ink-900",
        (submitting || disabled) && "opacity-50 cursor-not-allowed",
      )}
    >
      {isApple ? <AppleIcon /> : <GoogleIcon />}
      <span>{submitting ? "接続中…" : label}</span>
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.6 32.9 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.2 8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7L13 19.6C14.7 15.1 19 12 24 12c3 0 5.8 1.2 8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.3c-2 1.4-4.5 2.2-7.3 2.2-5.2 0-9.6-3.1-11.3-7.5l-6.6 5.1C9.5 39.5 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.5l6.2 5.3c-.4.4 6.7-4.8 6.7-14.8 0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" aria-hidden>
      <path d="M16.5 12.3c0-2.7 2.2-4 2.3-4.1-1.3-1.8-3.2-2.1-3.9-2.1-1.6-.2-3.2.9-4 .9-.8 0-2.1-.9-3.5-.9-1.8 0-3.5 1.1-4.4 2.7-1.9 3.3-.5 8.1 1.3 10.8.9 1.3 2 2.7 3.4 2.6 1.4-.1 1.9-.9 3.5-.9s2.1.9 3.5.9c1.5 0 2.4-1.3 3.3-2.6 1-1.5 1.5-3 1.5-3.1-.1 0-2.9-1.1-2.9-4.3zM14 4.3c.7-.9 1.2-2.1 1.1-3.3-1 .1-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.2 1.1.1 2.3-.6 3-1.5z" />
    </svg>
  );
}
