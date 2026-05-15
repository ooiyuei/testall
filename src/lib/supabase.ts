// Supabase クライアント
// 環境変数:
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY
//
// 未設定の場合は null を返し、呼び出し側で sessionStorage フォールバックに切り替える

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    client = null;
    return null;
  }
  client = createClient(url, key, {
    auth: {
      persistSession: true,
      // PKCE フローを明示 (デフォルトは implicit でハッシュフラグメントに token が来る)
      flowType: "pkce",
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return client;
}

export function isSupabaseEnabled(): boolean {
  return getSupabase() !== null;
}
