// Next.js middleware — Supabase Auth セッション同期
// @supabase/ssr が cookie 経由で PKCE code_verifier やセッションを保存するため、
// すべてのリクエストで cookie を同期する必要がある。
//
// 防御方針: Supabase が一時停止/障害でも middleware が25秒で死ぬとサイト全体が
// 504 になるため、3秒で打ち切って Auth 同期は諦め、ページ配信は続行する。

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUPABASE_AUTH_TIMEOUT_MS = 3000;

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  let user: { id: string } | null = null;
  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("supabase_auth_timeout")), SUPABASE_AUTH_TIMEOUT_MS),
      ),
    ]);
    user = (result as Awaited<ReturnType<typeof supabase.auth.getUser>>).data.user;
  } catch (e) {
    console.warn("[middleware] supabase auth skipped:", (e as Error).message);
  }

  // ルート保護: NEXT_PUBLIC_AUTH_REQUIRED='true' のときだけ /app 配下を認証必須にする。
  // デフォルト(未設定/false)では匿名利用(localStorage)を許可し、挙動は変えない。
  if (process.env.NEXT_PUBLIC_AUTH_REQUIRED === "true" && !user) {
    const path = request.nextUrl.pathname;
    if (path === "/app" || path.startsWith("/app/")) {
      const signin = new URL("/signin", request.url);
      signin.searchParams.set("redirect", path);
      return NextResponse.redirect(signin);
    }
  }

  return response;
}

export const config = {
  matcher: [
    // _next, favicon, 静的アセット以外
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
