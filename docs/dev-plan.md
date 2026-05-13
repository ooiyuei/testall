# Testall 開発計画 — モックアップから「動くアプリ」へ

> 課金は後回し。動くアプリ (認証・データ永続化・AI 入力) の完成を最優先。

---

## 完了済み

### Phase 1 — UX 残務（即効）
- ホーム「一日は6時リセット」(dailyMoodLogs を 06:00 〜 翌05:59 単位で扱う)
- 気分選択に「今日はできない」5択目
- 経験値の変化グラフ (ExpTrend)
- 高校編集モーダル (HighschoolEditModal)
- TodaySchedule × TODO タスク紐付け

### Phase 2 — データ永続化基盤
- 2-1: Supabase Auth (Google OAuth、`/signin` `/signup`、認証ガード)
- 2-2: profile/tests/blockLogs/tasks/events/dailyMoodLogs/planning/weeklyGoals 全テーブル Supabase 同期
- RLS: `user_id = auth.uid()` で本人のみ

### Phase 3 — AI 入力 (Claude Vision)
- 写真撮影 → Claude Vision で OCR + 採点
- `/api/diagnose-from-image` 実装、UI のプレビュー画面付き

### Phase 4 — 計画 & タスクの高度化
- 4-1: 計画ドラッグ&ドロップ (dnd-kit、WeeklyTaskBoard)
- 4-2: 「今日のおすすめ」サジェスト (TodaySuggestion)
- 4-3: AI チャット (Sara、Anthropic SDK、音声入力)

### Phase 5 — PWA + 初回ガイド
- manifest.json / icon-192 / icon-512 / appleWebApp
- GuideTour (3 ステップのチュートリアル)

### Phase 6 — 計画システム高度化
- 6-1: 固定スロット (食事/お風呂/部活) 編集 UI
- 6-2: 週次振り返り (WeeklyReviewCard、日月曜自動表示)
- 6-3: 単元 proficiency の永続化

### Phase 7 — データ精度
- 7-1: テスト保存後の偏差値自動補正 (直近3件平均)
- 7-2: ホーム進捗を blockLogs 実数と連動、連続日数バッジ、週間ヒートマップ

### Phase 8 — 空状態 + エラー
- 8-1: テスト無しでも 25分タイマー即起動可能
- 8-2: LoadingState / ErrorState コンポーネントで統一

### Phase 9 — ストリーク可視化
- StreakHeatmap (直近35日、現在連続/最長記録)

### Phase 10 — Export/Import + ヘルプ
- 設定 → データ → JSON export/import
- /app/help に 8 セクションのヘルプ

### Phase 11 — 認証 + エラーページ
- メール magic link サインイン
- 「アカウントなしで試す」ゲストモード
- not-found / error / loading グローバル画面
- diagnose API がフォールバック診断を返す (degraded フラグ付き)

### Phase 12 — コピー統一
- 「45分」→「25分」を全画面で統一

### Phase 13 — ログインボーナス
- 1日1回バナー (連続日数で文言変化、7日ごとマイルストーン)

### Phase 14-15 — タイマー改善
- 自由学習 (testId 無し) も blockLog に記録
- ヒートマップ・連続日数に反映

### Phase 16-17 — PWA 仕上げ
- Service Worker (本番のみ、cache-first 静的アセット / network-first API)
- インストールプロンプト (iOS / Android Chrome 対応)

### Phase 18-19 — AI 信頼性
- chat API モデル名修正 (`claude-sonnet-4-5`)
- chat API もフォールバック応答対応
- システムプロンプトを 25分単位に修正

---

## 残・将来課題

- Stripe 課金 (無料: テスト1件、有料: 無制限)
- Apple OAuth
- メール magic link の本番動作確認
- 通知 (Web Push、毎朝の気分リマインド)
- 計画ボード: ドラッグの精度・UX 改善
- AI チャットの会話履歴 RAG 化 (テスト結果・blockLog 文脈付き)
- E2E テスト (Playwright)
