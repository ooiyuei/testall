# Testall — Claude への指示書

## このアプリは何か
「テスト結果を、次の45分でやるべき勉強に変える」受験戦略OS。

ターゲット: 高校生・浪人生（スマホメイン）
LP + サインアップ/サインイン + オンボーディング + スマホアプリ風UI（下部6タブ）
localhost:3010 で開発中

## 現在の構造
```
src/app/
├── page.tsx          ← LP
├── signup/           ← 認証スタブ（Google/Apple/メール）
├── signin/           ← 認証スタブ
├── onboarding/       ← 5ステップ初期設定（学年→偏差値→志望校→学校→勉強時間）
├── app/              ← アプリ本体（スマホUI）
│   ├── page.tsx      ← ホーム（onboarding未完なら誘導）
│   ├── search/       ← 探す（大学・参考書・記事）
│   ├── test/         ← テスト一覧・追加（写真β/手入力）・[id]診断
│   ├── plan/         ← 週計画
│   ├── focus/        ← 集中モード一覧・/run タイマー
│   └── me/           ← マイページ（志望校・参考書も表示）
└── api/
    ├── diagnose/     ← Claude AI診断（偏差値・志望校・学年連動プロンプト）
    └── waitlist/

src/lib/
├── store.ts          ← sessionStorage永続化（プロフィール拡張済み）
├── hooks/useStore.ts ← Storeリアクティブ購読フック
├── diagnose.ts       ← /api/diagnose のロジック
├── universities.ts   ← 主要40+大学・学部DB（偏差値帯付き）
├── curriculum.ts     ← 学年別カリキュラム（高1/2/3 × 科目 × 単元）
├── textbooks.ts      ← 参考書DB
├── types.ts, subjects.ts, cn.ts
```

## v0.3 でできること
- [x] サインアップ/サインイン画面（Google/Apple/メールボタン、認証ロジックは未接続）
- [x] 5ステップオンボーディング：学年→偏差値→志望校3つまで→学校名→平日休日時間
- [x] 志望校DB（東大〜MARCH〜日東駒専〜地方）40+大学＋学部別偏差値
- [x] 学年連動カリキュラム（高1で歴総、高3で数IIIC/政経など）
- [x] 6タブナビ（ホーム・探す・入力中央強調・計画・集中・マイ）
- [x] 探すページ（大学検索・参考書登録・記事プレースホルダ）
- [x] テスト追加に写真モード（β版UIスタブ）
- [x] AI診断プロンプトが偏差値・志望校・学年を考慮
- [x] マイページに志望校・所有参考書・学校名表示
- [x] 既存：診断→今日の45分→タイマー→自己評価→ブロックログの全フロー

## 開発ルール

### 1. 実装の優先順位
1. ~~オンボーディング・志望校DB・学年連動~~ ✅
2. 認証実装（Supabase Auth / Google・Apple OAuth）
3. 画像入力の実体化（Claude Vision でテスト答案を解析）
4. データ永続化（Supabase接続）
5. Stripe課金

### 2. ブランチ運用
- `main` — 動くものだけ
- 機能追加は必ずブランチを切る
- 動作確認 → main にマージ

### 3. ダミーデータの扱い
- ダミーは `// TODO: 実データに置き換え` コメント必須
- Supabase 接続前は sessionStorage で仮実装OK

### 4. AI（Claude API）の使い方
- /api/diagnose — 偏差値・志望校・学年を考慮した診断
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
1. Supabase Auth（Google/Apple OAuth）の実装
2. profile/tests/blockLogs を Supabase に移行
3. Claude Vision で写真入力の実体化（答案画像→単元別正答数）
4. 志望校DBを管理画面で編集可能にする/CSVインポート
5. Stripe課金（無料: テスト1件、課金: 無制限＋写真入力＋AI最強モード）
