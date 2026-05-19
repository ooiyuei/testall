# Testall — Claude への指示書

## このアプリは何か
「テスト結果を、次の45分でやるべき勉強に変える」受験戦略OS。
高校生・浪人生向け（スマホメイン）。

LP / サインアップ・サインイン / オンボーディング / スマホアプリ風UI（下部5タブ）
localhost:3010

## 現在の構造（v0.4）
```
src/app/
├── page.tsx          ← LP
├── signup/, signin/  ← 認証スタブ（Google/Apple/メール、未接続）
├── onboarding/       ← 5ステップ初期設定
└── app/              ← アプリ本体
    ├── page.tsx      ← ホーム
    ├── search/       ← 探す（大学・参考書・記事）
    ├── plan/         ← 計画（月カレンダー + イベント）
    ├── focus/        ← 集中モード一覧・/run タイマー
    ├── test/         ← テスト一覧・新規（複数科目一括）・[id]
    └── me/
        ├── page.tsx  ← マイページ（実力パラメーター・志望校・参考書）
        └── settings/ ← 設定（データ削除はここに隠す）

src/lib/
├── store.ts          ← profile / tests / blockLogs / events / subjectStrengths
├── curriculum.ts     ← 5大カテゴリ × 学年別科目 × 単元
├── universities.ts   ← 40+大学（学部別偏差値）
├── textbooks.ts      ← 参考書DB
└── diagnose.ts       ← AI診断（偏差値・志望校・学年連動）
```

## v0.4 で何が変わった
- 5タブナビ復元（中央FAB削除）／「マイ」→「マイページ」
- 設定ページ実装 → ローカルデータ削除は3段階確認に格上げ
- 科目を5大カテゴリ（国・数・英・理・社）にまとめ、選択で詳細
- テスト入力刷新：1テストで複数科目を一括記録（科目選択トグル）
- マイページに5科目実力パラメーター（タップで詳細展開）
- 計画に月カレンダー＋イベント（定期テスト・模試・出願期限・学習予定）
- イベント編集モーダル（ボトムシート）

## 開発ルール

### 実装の優先順位
1. ~~オンボーディング・志望校DB・学年連動~~ ✅ v0.3
2. ~~5タブ化・設定・カレンダー・実力パラメーター~~ ✅ v0.4
3. **認証**（Supabase Auth: Google/Apple OAuth）← 次
4. **画像入力の実体化**（Claude Vision で答案解析）
5. データ永続化（Supabase接続）
6. Stripe課金

### ブランチ運用
- `main` — 動くものだけ
- 機能追加は必ずブランチ
- ビルドグリーン → main へマージ

### ダミーデータの扱い
- ダミーは `// TODO: 実データに置き換え` コメント必須
- Supabase接続前は sessionStorage で仮実装OK

## 環境変数（.env.local）
```
ANTHROPIC_API_KEY=    ← 未設定でもfallback診断で動作
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## 次にやること
1. Supabase Auth（Google/Apple OAuth）
2. Claude Vision で写真入力の実体化
3. profile/tests/blockLogs/events を Supabase 永続化
4. Stripe 課金（無料: テスト1件、有料: 無制限＋写真入力）
