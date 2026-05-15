"use client";

// OAuth コールバックを **クライアント側** で処理する。
// PKCE フローでは code_verifier がブラウザの localStorage に保持されているため、
// 必ずクライアント側で exchangeCodeForSession を呼ぶ必要がある。
// (server-side で呼ぶと code_verifier がなく必ず失敗する)

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      router.replace("/signin?error=supabase_not_configured");
      return;
    }

    // OAuth プロバイダーからのエラーを優先で処理
    const oauthError = searchParams.get("error");
    const oauthErrorDesc = searchParams.get("error_description");
    if (oauthError) {
      const params = new URLSearchParams({
        error: oauthError,
        ...(oauthErrorDesc ? { error_description: oauthErrorDesc } : {}),
      });
      router.replace(`/signin?${params.toString()}`);
      return;
    }

    const code = searchParams.get("code");

    // 並列ケース: 1) PKCE → ?code, 2) Implicit → #access_token, 3) detectSessionInUrl 自動
    async function handle() {
      try {
        if (code) {
          // PKCE フロー: code を session に交換
          const { error } = await supabase!.auth.exchangeCodeForSession(code);
          if (error) {
            setStatus("error");
            setErrorMsg(error.message);
            setTimeout(() => router.replace(`/signin?error=auth_failed&error_description=${encodeURIComponent(error.message)}`), 1200);
            return;
          }
        } else {
          // Implicit フロー or session 既にハッシュから取得済みの場合
          // detectSessionInUrl が自動で処理してくれるのを待つ
          await new Promise((r) => setTimeout(r, 400));
          const { data } = await supabase!.auth.getSession();
          if (!data.session) {
            setStatus("error");
            setErrorMsg("セッションが取得できませんでした");
            setTimeout(() => router.replace("/signin?error=missing_code"), 1200);
            return;
          }
        }

        // セッション取得成功 → 新規ユーザーは onboarding へ
        const { data: userData } = await supabase!.auth.getUser();
        const user = userData.user;
        const isNewUser = user
          ? user.created_at === user.last_sign_in_at
          : false;
        router.replace(isNewUser ? "/onboarding" : "/app");
      } catch (e) {
        setStatus("error");
        setErrorMsg(e instanceof Error ? e.message : String(e));
        setTimeout(() => router.replace("/signin?error=auth_failed"), 1500);
      }
    }

    void handle();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-50 px-4">
      <div className="text-center">
        {status === "loading" ? (
          <>
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-ink-900" />
            <p className="mt-4 text-[13px] font-medium text-ink-600">ログイン中...</p>
          </>
        ) : (
          <>
            <p className="text-[13px] font-medium text-coral-500">
              ログインに失敗しました
            </p>
            {errorMsg ? (
              <p className="mt-2 max-w-[280px] text-[11px] text-ink-500">
                {errorMsg}
              </p>
            ) : null}
            <p className="mt-3 text-[11px] text-ink-400">サインインに戻ります...</p>
          </>
        )}
      </div>
    </div>
  );
}
