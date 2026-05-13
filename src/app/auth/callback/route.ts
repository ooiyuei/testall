import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";

  if (!code) {
    return NextResponse.redirect(`${origin}/signin?error=missing_code`);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.redirect(`${origin}/signin?error=supabase_not_configured`);
  }

  // Server-side client (no persistent session needed here — we exchange code for session via cookies)
  const cookieStore = await cookies();
  const supabase = createClient(url, key, {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/signin?error=auth_failed`);
  }

  // Determine destination: new users go to onboarding, existing users go to /app
  // We treat any user without a profile as new (profile check happens client-side)
  const isNewUser = data.user.created_at === data.user.last_sign_in_at;
  const destination = isNewUser ? "/onboarding" : next;

  const response = NextResponse.redirect(`${origin}${destination}`);

  // Forward Set-Cookie headers from Supabase response to the browser
  const authCookies = [
    `sb-access-token=${data.session.access_token}; Path=/; HttpOnly; SameSite=Lax`,
    `sb-refresh-token=${data.session.refresh_token}; Path=/; HttpOnly; SameSite=Lax`,
  ];
  for (const cookie of authCookies) {
    response.headers.append("Set-Cookie", cookie);
  }

  return response;
}
