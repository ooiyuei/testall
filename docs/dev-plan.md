# Testall 開発計画 — モックアップから「動くアプリ」へ

> 課金は後回し。動くアプリ (認証・データ永続化・AI 入力) の完成を最優先。

---

## Phase 1 — UX 残務（即効）

| # | 項目 | 状態 |
|---|---|---|
| 1-1 | ホーム「一日は6時リセット」（dailyMoodLogs を 06:00 〜 翌05:59 単位で扱う） | 🟡 |
| 1-1 | 気分選択に「今日はできない」5択目 | 🟡 |
| 1-1 | 就寝まで余裕→「特盛モード」サジェスト | 🟡 |
| 1-2 | 経験値の変化グラフ（DeviationTrend 流用） | 🟡 |
| 1-3 | 高校編集モーダル（志望校編集と同じ深さ） | 🟡 |
| 1-4 | TodaySchedule × TODO タスク紐付け検証・改善 | 🟡 |

**完了条件**: ビルドグリーン / ブラウザでスクショ確認 / main に push

---

## Phase 2 — データ永続化基盤

### 2-1 Supabase Auth
- Google OAuth (Apple は後で)
- 認証スタブ `/signin` `/signup` を本物に置き換え
- 初回サインアップ → onboarding → `/app`
- ログアウト機能
- 認証ガード（未ログインなら `/signin` へリダイレクト）

### 2-2 ユーザーデータ DB 移行
- 現状: profile / tests / blockLogs / tasks / events / dailyMoodLogs / planning がすべて sessionStorage
- Supabase テーブル新設:
  - `user_profiles` (1:1)
  - `user_tests`
  - `user_block_logs`
  - `user_tasks`
  - `user_events`
  - `user_daily_logs`
  - `user_weekly_goals`
- RLS: `user_id = auth.uid()` で本人のみ
- src/lib/store.ts を Supabase クライアント呼び出しに移行
- 同期戦略: ローカル即時反映 + バックグラウンド同期 (optimistic)

**完了条件**: 別端末からログインしてデータが見える

---

## Phase 3 — AI 入力 (Claude Vision)

- テスト追加で「写真で入力」を有効化
- 答案用紙の写真 → Claude Vision で OCR + 採点
- 教科 / 単元 / 配点 / 正答数 を自動入力
- ユーザーは確認・修正のみ

**API**: `/api/diagnose-from-image`
**前提**: ANTHROPIC_API_KEY が Vercel 環境変数に設定済み

---

## Phase 4 — 計画 & タスクの高度化

### 4-1 計画ドラッグ&ドロップ
- dnd-kit を導入
- WeeklyGoalCard の曜日別ブロックをドラッグで動かす
- タスクを日にちにアサインできる
- 押したらタスク詳細

### 4-2 「今日のおすすめ」サジェスト
- 弱点科目 + 期限が迫った定期テスト → 今日やるべきブロック提案
- ホームに「AI からの今日のおすすめ」セクション
- 中身は Claude API (フォールバック: ルールベース)

### 4-3 チャット欄
- ホームに「Sara にチャット」セクション (Anthropic SDK 経由)
- 音声入力 (Web Speech API) + テキスト
- 学習計画の調整・質問

---

## 進捗管理

各 Phase は `feature/phase-X-N` ブランチで実装、ビルドグリーンで main マージ。
大きな変更は `builder` agent を worktree 隔離で並列、最後に `code-reviewer` でレビュー。

| Phase | ブランチ | ステータス |
|---|---|---|
| 1-1 | feature/home-mood-improve | — |
| 1-2 | feature/exp-trend | — |
| 1-3 | feature/highschool-edit | — |
| 1-4 | feature/today-task-link | — |
| 2-1 | feature/auth | — |
| 2-2 | feature/db-migrate | — |
| 3 | feature/vision-input | — |
| 4-1 | feature/plan-dnd | — |
| 4-2 | feature/today-suggest | — |
| 4-3 | feature/chat | — |
