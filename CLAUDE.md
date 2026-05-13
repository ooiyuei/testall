# Testall — Claude への指示書

## このアプリは何か
「テスト結果を、次の45分でやるべき勉強に変える」受験戦略OS。

ターゲット: 高校生・浪人生（スマホメイン）
LP + スマホアプリ風UI（下部5タブナビ）
localhost:3010 で開発中

## 現在の構造
```
src/app/
├── page.tsx          ← LP
├── app/              ← アプリ本体（スマホUI）
│   ├── page.tsx      ← ホーム
│   ├── test/         ← テスト一覧・追加
│   ├── plan/         ← 週計画
│   ├── focus/        ← 集中モード
│   └── me/           ← マイページ
├── api/
│   ├── diagnose/     ← Claude AI診断
│   └── waitlist/     ← 先行登録
└── start/            ← /app へリダイレクト
```

## 開発ルール

### 1. 実装の優先順位（この順で進める）
1. テスト追加フォーム実体化（/app/test/new）
2. 集中モード本体（/app/focus/run）
3. AI診断結果ページ（/app/test/[id]）
4. データ永続化（Supabase接続）
5. Stripe課金

### 2. ブランチ運用
- `main` — 動くものだけ
- 機能追加は必ずブランチを切る: `feature/テスト追加フォーム` など
- 動作確認 → main にマージ

### 3. コミットのタイミング
- 1機能が動いたらコミット（ビルドが通る状態で）
- ダミーデータのままコミットしない

### 4. ダミーデータの扱い
- ダミーは `// TODO: 実データに置き換え` コメント必須
- Supabase 接続前は sessionStorage で仮実装OK

### 5. AI（Claude API）の使い方
- /api/diagnose — テスト結果の弱点分析
- プロンプトは src/lib/prompts/ に集約
- モデル: claude-sonnet-4-6（速度重視）→ 深い分析はopus

## 環境変数（.env.local に設定）
```
ANTHROPIC_API_KEY=    ← console.anthropic.com で取得済みか確認
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## 次にやること
→ README.md の「次にやること」セクションを常に最新に保つ
