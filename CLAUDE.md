# Testall — Claude への指示書

## このアプリは何か
「テスト結果を、次の45分でやるべき勉強に変える」受験戦略OS。
高校生・浪人生向け（スマホメイン）。

LP / サインアップ・サインイン / オンボーディング / スマホアプリ風UI（下部5タブ）
localhost:3010

## 現在の構造（v0.6）
```
src/app/
├── page.tsx          ← LP（7セクション完備）
├── signup/, signin/  ← 認証（Google/Apple/メール）— コード完成・env待ち
├── onboarding/       ← 10ステップ初期設定（1問1答）
└── app/              ← アプリ本体（5タブ）
    ├── page.tsx      ← ホーム（NEXT UPカード・DailyTip・GuideTour）
    ├── todo/         ← やること（今日/未完了/完了グループ・TodaySuggestion）
    ├── search/       ← 探す（大学・参考書・記事・カテゴリピル）
    ├── plan/         ← 計画（月カレンダー + イベント + 今週の目標 dark hero）
    ├── focus/        ← 集中モード一覧（今日のブロック + 今週スタッツ）・/run タイマー
    ├── test/         ← テスト一覧（偏差値スパークライン）・新規・[id]（dark hero）
    ├── ai/           ← AIコーチ（LINE風チャット + クイックアクション）
    └── me/
        ├── page.tsx  ← マイページ（Level/Pentagon/本棚/ストリーク/偏差値推移）
        └── settings/ ← 設定（固定スロット・データ削除3段階確認）

src/lib/
├── store.ts          ← 全データ（Supabase sync完備）+ fixedSlots
├── store-remote.ts   ← Supabase read/write（全テーブル + fixedSlots）
├── hooks/useStore.ts ← auth連動でloadAll、レースコンディション対策済み
├── curriculum.ts     ← 5大カテゴリ × 学年別科目 × 単元
├── universities.ts   ← 40+大学（学部別偏差値）
├── textbooks.ts      ← 参考書DB
└── diagnose.ts       ← AI診断（偏差値・志望校・学年連動）
```

## v0.6 で何が変わった
- UIデザイン全面刷新（PDF設計原則 完全適用）
- peach廃止・amber廃止 → coral/sky/mint/sun でデザイントークン統一
- uppercase廃止・wide tracking廃止
- 不要コンポーネント削除（TodaySchedule / WeeklyReviewCard / WeeklyGoalCard 他）
- Supabase 全データ永続化（profile/tests/blockLogs/tasks/events/fixedSlots 他）
- Google/Apple OAuth + Magic Link 認証実装（env vars設定で即動作）
- 集中モード：今週の集中スタッツ（ブロック数・学習時間・学習日）

## 開発ルール

### 実装の優先順位
1. ~~オンボーディング・志望校DB・学年連動~~ ✅ v0.3
2. ~~5タブ化・設定・カレンダー・実力パラメーター~~ ✅ v0.4
3. ~~UIデザイン刷新・Supabase全データ永続化・認証コード実装~~ ✅ v0.6
4. **Supabase 本番設定**（Vercel env vars / Google-Apple OAuth有効化）← 次
5. **Claude Vision 写真入力の実体化**（答案解析 API）
6. Stripe課金（無料: テスト1件、有料: 無制限＋写真入力）

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
1. **Supabase 本番設定（Vercel）**
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` を Vercel に追加
   - Supabase Dashboard → Auth → Providers → Google/Apple 有効化
   - OAuth リダイレクト URI: `https://testall-ten.vercel.app/auth/callback`
   - Migration 0007_user_data.sql を本番 DB に適用（`supabase db push`）
2. **Claude Vision 写真入力の実体化**（`ANTHROPIC_API_KEY` 設定済みなら即動作）
3. **Stripe 課金**（無料: テスト1件、有料: 無制限＋写真入力）
