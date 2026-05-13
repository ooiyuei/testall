# Auth Setup — Supabase Dashboard 手順

Supabase MCP では Auth Provider の有効化ができないため、以下を手動で行う。

## 1. Google OAuth Provider を有効化

1. https://supabase.com/dashboard/project/qpckkyjawjmeumnynynt/auth/providers を開く
2. "Google" を展開して **Enable** をオンにする
3. Google Cloud Console で OAuth クライアント ID / シークレットを取得し貼り付ける
   - https://console.cloud.google.com/apis/credentials
   - アプリケーションの種類: ウェブアプリケーション
   - 承認済みリダイレクト URI に Supabase のコールバック URL を追加:
     `https://qpckkyjawjmeumnynynt.supabase.co/auth/v1/callback`
4. 保存

## 2. Redirect URLs を許可

1. https://supabase.com/dashboard/project/qpckkyjawjmeumnynynt/auth/url-configuration を開く
2. **Redirect URLs** に以下を追加:
   - `http://localhost:3010/auth/callback`
   - `https://testall-ten.vercel.app/auth/callback`
3. 保存

## 3. ローカル開発での認証ガード

`.env.local` で `NEXT_PUBLIC_AUTH_REQUIRED` を設定していない場合、認証ガードはオフ。
既存の UX を壊さずに開発できる。

本番 (Vercel) では環境変数に `NEXT_PUBLIC_AUTH_REQUIRED=true` を追加すると有効化される。

## 4. 動作確認

1. `pnpm dev` で localhost:3010 を起動
2. `/signin` → "Googleで続ける" → Google OAuth → `/auth/callback` → `/app` (既存ユーザー) or `/onboarding` (新規)
3. `/app/me/settings` → "サインアウト" → `/signin` にリダイレクト
