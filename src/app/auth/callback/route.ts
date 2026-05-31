// OAuth コールバック (server route) — @supabase/ssr の公式 Next.js パターン
// PKCE flow の code_verifier は Cookie に保存されているので、
// next/headers の cookies() 経由で createServerClient が読み取れる。

import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  // OAuth プロバイダー (Google) からのエラーをそのまま signin に転送
  const oauthError = searchParams.get("error");
  const oauthErrorDesc = searchParams.get("error_description");
  if (oauthError) {
    const params = new URLSearchParams({
      error: oauthError,
      ...(oauthErrorDesc ? { error_description: oauthErrorDesc } : {}),
    });
    return NextResponse.redirect(`${origin}/signin?${params.toString()}`);
  }

  // OAuth/PKCE は ?code=、Magic Link/OTP は ?token_hash=&type= で返ってくる。
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const otpType = searchParams.get("type") as EmailOtpType | null;
  if (!code && !tokenHash) {
    return NextResponse.redirect(`${origin}/signin?error=missing_code`);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.redirect(`${origin}/signin?error=supabase_not_configured`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Action 外では cookies.set が使えない場合がある
        }
      },
    },
  });

  // code があれば OAuth/PKCE、なければ Magic Link(token_hash) を検証する。
  const { data, error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({ type: otpType ?? "email", token_hash: tokenHash! });

  if (error || !data.session || !data.user) {
    const params = new URLSearchParams({
      error: "auth_failed",
      ...(error?.message ? { error_description: error.message } : {}),
    });
    return NextResponse.redirect(`${origin}/signin?${params.toString()}`);
  }

  // 新規/既存の判定は「タイムスタンプ比較」でなく profile 行の有無で確実に行う。
  // profile 未作成 = オンボーディング未完了 → /onboarding、作成済み → /app。
  const { data: profileRow } = await supabase
    .from("user_profiles")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();
  const destination = profileRow ? "/app" : "/onboarding";
  return NextResponse.redirect(`${origin}${destination}`);
}
