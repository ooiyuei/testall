// Supabase クライアント (SSR/CSR 両対応 — Cookie ベース)
// 環境変数:
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY
//
// 未設定の場合は null を返し、呼び出し側で localStorage フォールバックに切り替える
// @supabase/ssr を使うことで:
// - PKCE code_verifier が Cookie に保存される
// - server / client 両方から読めるためコールバックが詰まらない

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    client = null;
    return null;
  }
  // createBrowserClient は cookie ベースで PKCE code_verifier を保存
  client = createBrowserClient(url, key);
  return client;
}

export function isSupabaseEnabled(): boolean {
  return getSupabase() !== null;
}
