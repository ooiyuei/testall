// OAuth コールバック (server route) — @supabase/ssr の公式 Next.js パターン
// PKCE flow の code_verifier は Cookie に保存されているので、
// next/headers の cookies() 経由で createServerClient が読み取れる。

import { createServerClient } from "@supabase/ssr";
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

  const code = searchParams.get("code");
  if (!code) {
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

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.session) {
    const params = new URLSearchParams({
      error: "auth_failed",
      ...(error?.message ? { error_description: error.message } : {}),
    });
    return NextResponse.redirect(`${origin}/signin?${params.toString()}`);
  }

  // 新規ユーザーは onboarding へ、既存は /app へ
  const isNewUser = data.user.created_at === data.user.last_sign_in_at;
  const destination = isNewUser ? "/onboarding" : "/app";
  return NextResponse.redirect(`${origin}${destination}`);
}
