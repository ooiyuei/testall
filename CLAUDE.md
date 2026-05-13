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
│   ├── test/         ← テスト一覧・追加・[id]診断
│   ├── plan/         ← 週計画
│   ├── focus/        ← 集中モード一覧・/run タイマー
│   └── me/           ← マイページ
├── api/
│   ├── diagnose/     ← Claude AI診断
│   └── waitlist/     ← 先行登録
└── start/            ← /app へリダイレクト

src/components/app/   ← クライアント側ビュー（HomeView, TestListView, PlanView, MeView, FocusListView, NewTestForm, TestDetail, FocusRun, AppShell, AppHeader, BottomNav）
src/lib/
├── store.ts          ← sessionStorageベース永続化（TODO: Supabaseへ）
├── hooks/useStore.ts ← Storeリアクティブ購読フック
├── diagnose.ts       ← /api/diagnose のロジック（Claude + rule-based fallback）
├── types.ts, subjects.ts, cn.ts
```

## できること（v0.2 現在）
- [x] テスト入力（プロフィール→テスト→単元の3ステップ手入力フォーム）
- [x] AI診断（Claude API or rule-based fallback）
- [x] 診断レポート（summary / 弱点 / 参考書ルート / 週計画 / 今日の45分）
- [x] 集中モード（45分タイマー＋自己評価＋メモ）
- [x] sessionStorage 永続化（プロフィール/テスト/ブロック記録/連続日数）
- [x] ホーム・週計画・テスト一覧・マイページ・集中一覧 すべて実データ連動

## 開発ルール

### 1. 実装の優先順位（この順で進める）
1. ~~テスト追加フォーム実体化~~ ✅
2. ~~集中モード本体~~ ✅
3. ~~AI診断結果ページ~~ ✅
4. データ永続化（Supabase接続） ← 次
5. Stripe課金
6. 写真スキャン入力（/app/test/new の「写真で取り込む」）
7. プロフィール編集の独立ページ

### 2. ブランチ運用
- `main` — 動くものだけ
- 機能追加は必ずブランチを切る: `feature/...` など
- 動作確認 → main にマージ

### 3. コミットのタイミング
- 1機能が動いたらコミット（ビルドが通る状態で）
- ダミーデータのままコミットしない

### 4. ダミーデータの扱い
- ダミーは `// TODO: 実データに置き換え` コメント必須
- Supabase 接続前は sessionStorage で仮実装OK

### 5. AI（Claude API）の使い方
- /api/diagnose — テスト結果の弱点分析
- 現状モデル: `claude-sonnet-4-5`
- ANTHROPIC_API_KEY 未設定時は src/lib/diagnose.ts の fallbackDiagnosis が動く

## 環境変数（.env.local に設定）
```
ANTHROPIC_API_KEY=    ← 未設定でもfallback診断で動作
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## 次にやること
1. Supabase接続：profile/tests/blockLogs をlocalから移行
2. 認証（メール/Googleログイン）
3. 「ホームに戻る前にもう一度45分？」継続ループUI
4. Stripe課金（無料: テスト1件、課金: 無制限＋写真入力）
