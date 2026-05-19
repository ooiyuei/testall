# Supabase Auth 実装セッションのハンドオフ

> 2026-05-17 Windows 開発拠点立ち上げ時に作成。

## 現状

- v0.4 まで完成、認証はスタブ（[signup/](src/app/signup/), [signin/](src/app/signin/) — Google/Apple/メールボタンは未接続）
- Supabase プロジェクト確保済み: `https://qpckkyjawjmeumnynynt.supabase.co`
- `.env.local` に `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` 入り
- `SUPABASE_SERVICE_ROLE_KEY` は **未設定** — Supabase ダッシュボードからコピーが必要
- 依存: `@supabase/ssr ^0.10.3`, `@supabase/supabase-js ^2.105.4` は package.json にある

## ゴール

[CLAUDE.md](CLAUDE.md) の優先順位3:「Supabase Auth (Google/Apple OAuth)」を実装する。

## 実装スコープ

1. **Supabase クライアント** — `src/lib/supabase/client.ts` (browser) と `server.ts` (RSC/API用、@supabase/ssr の `createServerClient`)
2. **middleware.ts** — セッショントークンを cookie で持ち回す
3. **OAuth callback** — `src/app/auth/callback/route.ts` で `exchangeCodeForSession`
4. **Google OAuth プロバイダ設定** — Supabase ダッシュボードで有効化 + Google Cloud Console で redirect URI を登録
5. **Apple OAuth プロバイダ設定** — Apple Developer で Service ID + Sign In with Apple 設定（手間多）
6. **既存 signup/signin ページ** — Google/Apple/メール ボタンを `supabase.auth.signInWithOAuth` / `signInWithOtp` に接続
7. **オンボーディング遷移** — `auth/callback` 成功後、profile が空なら `/onboarding`、埋まってれば `/app`
8. **profile テーブル** — `supabase/migrations/` にスキーマ追加、RLSで自分のレコードしか触れないように

## 推奨フロー (CEO自走)

```
1. planner → 上の8項目をタスク分解
2. tdd-guide → 各APIルートの統合テストを先書き
3. database-reviewer → profile テーブル設計レビュー
4. builder → 実装
5. code-reviewer → 仕上げ
6. security-reviewer → RLS と Service Role Key の取り扱い確認
7. e2e-runner → Google OAuth フロー (Apple は環境準備重いので後回し可)
```

## ブロッカー想定

- **Apple Developer 登録**: $99/年 + Service ID 設定が面倒。Google だけで MVP に絞るのもアリ
- **Google Cloud Console redirect URI**: 本番ドメイン未確定なら `http://localhost:3010/auth/callback` だけで進める
- **profile テーブル設計**: 既存の `src/lib/store.ts` の profile 型を Supabase 側にどうマッピングするか

## 次セッション開始の合言葉

```
cd C:\Users\Owner\business\アプリ\testall
claude code
> このアプリの Supabase Auth (Google) を実装して。HANDOFF_AUTH.md を読んで CEO モードで進めて。
```
