# Testall 開発計画

> 「テスト結果を、次の25分でやるべき勉強に変える」受験戦略OS
> 高校生・浪人生向け / モバイルファースト PWA

---

## 完了済み (本番運用可能レベル)

### Phase 1 — UX 残務
- ホーム「6時リセット」
- 気分選択 5 択 (today-off 含む)
- 経験値変化グラフ
- 高校編集モーダル
- TodaySchedule × TODO タスク紐付け

### Phase 2 — データ永続化
- 2-1 Supabase Auth (Google OAuth、magic link、ゲストモード)
- 2-2 全データ Supabase 同期 (profile/tests/blockLogs/tasks/events/dailyMoodLogs/planning/weeklyGoals)
- RLS: user_id = auth.uid()

### Phase 3 — AI 入力
- 写真 → Claude Vision で OCR + 採点 (`/api/diagnose-from-image`)
- confidence (high/medium/low) + notes
- バリデーション (score>fullScore 禁止、subject 正規化)

### Phase 4 — 計画 & タスク
- dnd-kit で計画ドラッグ&ドロップ
- TodaySuggestion (AI 提案)
- AI チャット Sara (Anthropic SDK、音声入力)

### Phase 5-10 — 機能拡充
- PWA + GuideTour + Service Worker + Install Prompt
- 固定スロット (食事/お風呂/部活)
- 週次振り返り
- 単元 proficiency 永続化
- 偏差値自動補正 (直近 3 件平均)
- ホーム進捗 blockLogs 実数連動
- LoadingState / ErrorState
- StreakHeatmap (35 日 / 連続日数 / 最長記録)
- Export/Import JSON
- ヘルプページ
- magic link メールサインイン + ゲスト
- not-found / error / loading グローバル
- diagnose API フォールバック
- 自由学習タイマー
- Sentry 統合 (DSN 設定待ち)
- ログインボーナス

### Phase 11 — 科目構造刷新
- 国語: 現代文 / 古文 / 漢文 分離
- 数学: Ⅰ・A / Ⅱ・B・C / Ⅲ・C
- 同カテゴリ内 複数サブ科目選択可
- 詳細入力フロー (出題形式・配点・問題数・正答数 SliderRow)
- 点数 + 偏差値 スライダー化

### Phase A — 参考書 DB 拡充
- NDL + openBD で **2,770 冊バルク取得**
- 合計 **約 2,888 冊** (Studyplus 並み)
- カバー画像 / 著者 / 出版社 / ページ数
- 主要シリーズ網羅: チャート 113 / ターゲット 82 / 実況中継 53 / 重要問題集 49 / 赤本 11

### Phase C — UGC (Community Textbooks)
- `community_textbooks` テーブル (Supabase)
- ISBN ベースで全ユーザー共有
- バーコードスキャンで未知の書籍を自動登録
- use_count で人気度トラッキング
- /api/isbn-lookup: local → community → openbd → upsert

### UI/UX プロクオリティ化
- UI 監査 (`docs/ui-audit.md`) 19 項目
- 共通コンポーネント: Button / Card / Chip / IconBadge / Stat / SectionLabel / Toast / Skeleton
- Apple HIG 準拠 (palt 廃止、ProN→Pro、letter-spacing -0.02em)
- タップターゲット 44px (MoodCard / BottomNav 49px / AppHeader)
- rounded-3xl → rounded-2xl 統一
- 日本語ラベルの uppercase tracking 全廃
- タップフィードバック統一 (mobile auto scale 0.97 + opacity 0.92)
- focus-visible リング sky-500
- HomeView Hero (26px tracking-[-0.02em])
- MeView リファクタ (990 → 781 行、グラデーションアバター)
- FocusRun リファクタ (深い夜空グラデ + 3 段階カラーリング blue→mint→sun + glow)
- TestDetail リファクタ (引用 blockquote + severity 太線 + 末尾 CTA)
- OnboardingFlow リファクタ (1437 → 383 行 + 2 ファイル分割)
- SettingsView 刷新 (絵文字 → Lucide / IconBadge / DangerZone)
- Toast 通知システム (alert() 全置換)

---

## 残課題

### Phase B — AI 深掘り (200 冊)
- `scripts/enrich-textbooks.ts` で Claude API に目次・強み・推奨対象を生成依頼
- ANTHROPIC_API_KEY が `.env.local` に必要
- 5-10 分で完了
- 出力: `src/lib/master/textbooks-enriched.ts`
- 結果は `getAllTextbooks()` で自動マージ済み

### 運用準備
- **Sentry DSN セット** (`.env.local` + Vercel 環境変数)
- **Stripe 課金** (無料: テスト1件、有料: 無制限)
- Apple OAuth
- 通知 (Web Push)
- E2E テスト (Playwright)

### 将来の v0.6+
- 主要 200 冊の目次手書きレビュー
- 共通テスト予想問題集を科目別に分割
- 参考書 relatedIds (シリーズ連携)
- 計画ボードのドラッグ UX 改善
- AI チャットの会話履歴 RAG 化
