# Testall AI システム設計

> どこに AI を使い、何を入力し、何を返すか。
> 精度向上のためのコンテキスト・プロンプト・バリデーション設計。

---

## 0. 全体像

| 用途                         | エンドポイント              | モデル               | 入力             | 出力                |
| --------------------------- | -------------------------- | -------------------- | ---------------- | ------------------- |
| **答案画像 OCR + 構造化**   | `/api/diagnose-from-image` | claude-sonnet-4-5    | 画像 (base64)    | テスト構造 JSON     |
| **テスト診断 + 計画生成**   | `/api/diagnose`            | claude-sonnet-4-5    | TestInput + 履歴 | Diagnosis JSON      |
| **AI コーチ「Sara」**        | `/api/chat`                | claude-sonnet-4-5    | 会話 + ctx       | 自由テキスト        |
| (将来) 参考書ルート提案      | -                          | -                    | -                | -                   |
| (将来) 弱点単元の例題生成    | -                          | -                    | -                | -                   |

すべて `process.env.ANTHROPIC_API_KEY` を経由。キー無し or 失敗時はフォールバック応答に切替 (degraded フラグ付き)。

---

## 1. 答案画像 OCR (`/api/diagnose-from-image`)

### 入力
- 答案・成績票・模試結果の写真 (JPEG/PNG/WebP/GIF、base64 もしくは multipart)

### システムプロンプトのキモ
- **アンチハルシネーション**: 「写真に書かれた数字以外は作らない」を明文化
- **科目正規化**: 物理→理科、日本史→社会 など別表記を統一
- **大問単位の単元抽出**: 「大問1: 二次関数」を unit として 5〜8 個
- **cause 判定の規則**:
  - 正答率 0% & 空白多数 → time
  - 正答率 0-30% & 式は書いてある → understanding
  - 正答率 50-70% & 計算ミス多数 → careless
  - 用語問題で空白 → knowledge
- **confidence (high/medium/low)** を overall / score / units の 3 軸で返す
- **notes**: 読めなかった箇所や注意点を 1 文で

### バリデーション (サーバー側)
- `score > fullScore` の反転を禁止 → 信頼度を low に落とす
- `correct > total` の反転を禁止 → correct を null に
- subject を 5 分類に強制 (別表記をマッピング)
- cause を 4 enum に強制
- 単元は最大 8 個まで

### UI 表示
- 信頼度バッジ (高/中/低)
- 低信頼度のフィールドに「要確認」「推測」ラベル
- notes をユーザーへの案内文に変換

### 既知の限界
- 手書き字が薄い/反射が強い写真は精度低下 → confidence で UI 側に伝達
- 部分点 (△) は correct に含まれない (整数のみ)
- 問題用紙だけの写真は units のみ抽出 (score は null)

---

## 2. テスト診断 + 計画生成 (`/api/diagnose`)

### 入力 (TestInput)
- 基本: テスト結果 (score, fullScore, units), 学年, 志望校, 偏差値, 学校
- v0.5 拡張 (`history` 追加):
  - **pastTests**: 直近 5 件のテスト概要 (testName, scorePct, deviation, weakUnits)
  - **recentBlockLogs**: 直近 14 日の blockLog (日付・自己評価)
  - **bookshelf**: 登録済みの参考書名

### システムプロンプトのキモ
- **トレンド分析**: 直近 2 回の差分 (改善/停滞/悪化) を summary に反映
- **本棚優先**: 登録済み参考書を最優先、未登録は推奨しない
- **無理のないペース**: 直近 14 日のブロック数から無理のない週間計画
- **学年連動**: 高1=基礎、高3=本番直結
- **25分単位**: todayBlocks は 3-5 個、25分占有

### 出力 (Diagnosis)
- summary / level / gap (1〜3 文)
- weaknesses[] (unit, cause, severity, reason, recovery)
- strengths[]
- textbookPlan[] (本棚から選択)
- weekPlan[7] (曜日 × focus × subjects × blocks)
- todayBlocks[3〜5] (startTime, endTime, subject, topic, source, completion)
- encouragement

### フォールバック
- ANTHROPIC_API_KEY 無し or API エラー → `fallbackDiagnosis()` が単元別正答率からルールベースで生成
- API は `degraded: true` フラグ付きで返す

---

## 3. AI コーチ Sara (`/api/chat`)

### 入力
- history: 直近 10 件の会話
- userMessage: 今回の入力
- context (v0.5 追加):
  - grade / deviation / targetUniversity / examDate
  - latestTest (subject, testName, scorePct, weakUnits)
  - recentBlocks14d

### システムプロンプトのキモ
- 200 文字以内、敬語、具体的な参考書名・時間配分・25分ブロック
- 精神論ではなく作戦に変える
- 直近テスト・苦手単元を参照して回答をパーソナライズ

### フォールバック
- ルールベース応答 (キーワードマッチで 5 種類のテンプレ)
  - 「次の25分は何やる」「苦手」「作戦」「志望校」「その他」

---

## 4. 精度向上のロードマップ

### v0.5 (現状)
- [x] 答案画像 confidence + バリデーション
- [x] 診断に過去履歴 / 本棚 / 学習ログを注入
- [x] チャットに学年・偏差値・直近テストを注入

### v0.6 候補
- [ ] **few-shot in-context examples**: 答案画像プロンプトに「期待される入出力」を 1 ペア入れる
- [ ] **画像前処理**: 撮影時にコントラスト補正・傾き補正 (canvas で)
- [ ] **2段階 OCR**: 1段目で大問構造、2段目で各単元の正誤を別呼び出し (精度↑、トークン↑)
- [ ] **チャット履歴の RAG 化**: blockLog の進捗を引っ張ってきて「先週この単元やったね」
- [ ] **A/B プロンプトテスト**: 同じ入力で 2 種類のプロンプトを試して、ユーザーの「Good/Bad」フィードバックで自動選別
- [ ] **AI 応答の人間レビューキュー**: 低信頼度応答を管理画面で確認・修正
- [ ] **画像ベースの数学ヒント**: 解答用紙の画像をそのまま貼って「どこで間違えた？」

### v0.7 候補 (本格)
- [ ] **Vector DB (Supabase pgvector)** にテスト履歴を入れて似た過去問パターンを参照
- [ ] **モデル切替**: 速度優先=Haiku, 精度優先=Sonnet, 推論=Opus
- [ ] **キャッシング**: 同じ TestInput が再送されたら API 呼ばない (24h TTL)
- [ ] **コスト計測ダッシュボード**: モデル別の呼び出し回数・トークン数を Supabase に記録
