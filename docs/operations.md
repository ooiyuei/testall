# Testall 運用・サービス維持

> 本番運用で「壊れたら気づく」「修復が速い」状態を作るためのツール一覧。
> 無料枠中心、Vercel + Supabase + Anthropic 構成前提。

---

## 1. 推奨スタック (優先度順)

### 🔴 必須 (今すぐ)
| ツール             | 用途                             | 料金             | 導入難度 |
| ----------------- | -------------------------------- | ---------------- | -------- |
| **Sentry**        | エラー追跡 + パフォーマンス       | 無料 5k events/月 | ★★☆      |
| **Vercel Analytics** | リアルユーザー監視 (RUM)        | 無料 (Vercel)    | ★☆☆      |
| **GitHub Dependabot** | 依存パッケージ脆弱性自動 PR    | 無料             | ★☆☆      |
| **Supabase Logs** | DB クエリ・Auth ログ              | 無料 (Supabase)  | ★☆☆      |

### 🟡 推奨 (1ヶ月後)
| ツール              | 用途                              | 料金             |
| ------------------ | --------------------------------- | ---------------- |
| **PostHog**        | プロダクト分析・セッション再生・FF | 無料 1M events/月 |
| **Better Stack**   | Uptime 監視 + 構造化ログ           | 無料 10 monitor  |
| **GitHub Code Scanning (CodeQL)** | SAST セキュリティ      | 無料 (public repo) |

### 🟢 余裕があれば
| ツール          | 用途                          |
| -------------- | ----------------------------- |
| **Plausible**  | プライバシー重視アクセス解析     |
| **Snyk**       | より深い SCA + コンテナ脆弱性    |
| **LogRocket**  | セッション再生 + ネットワーク追跡 |

---

## 2. Sentry セットアップ (最優先)

### 何ができるか
- 今日の React Hooks エラーのような **「ユーザーが踏んだ未捕捉例外」を自動収集**
- スタックトレース・ソースマップで「どの行のどの関数で」が一発でわかる
- **Seer (AI 自動分析)** が "なぜ起きたか + 修正案" を生成 (有料機能)
- リリース毎の **regression 検知** (前回バージョンに無かったエラー)

### 導入手順
```bash
cd /Users/ooiyuei/business/アプリ/testall
pnpm dlx @sentry/wizard@latest -i nextjs
```
ウィザードが対話的に:
- `.sentryclirc` 作成
- `sentry.client.config.ts` / `sentry.server.config.ts` 追加
- `next.config.js` に Sentry プラグイン追加
- Sentry DSN を `.env.local` に保存

### 必須設定
```ts
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,         // 10% パフォーマンス計測
  replaysOnErrorSampleRate: 1.0,  // エラー時は 100% で session replay
  replaysSessionSampleRate: 0.05, // 通常は 5%
  ignoreErrors: [
    "NotAllowedError: Failed to execute 'writeText' on 'Clipboard'", // 今日の clipboard 拒否は無害
    "ResizeObserver loop limit exceeded",
  ],
});
```

### ベストプラクティス
- リリース毎に `sentry-cli releases new` でバージョン紐付け → どの commit で導入されたかが一発でわかる
- 重要 API は `Sentry.startSpan` で計測 (`/api/diagnose-from-image` のレイテンシなど)
- 個人情報 (mail, schoolName) は **scrubber で除去**

### MCP 連携
Claude Code から `mcp__f8e9cd4a-...__search_issues` で issue を直接読める。
「最新のエラーは？」と聞くだけで AI が原因分析まで降りてくる。

---

## 3. Vercel Analytics + Speed Insights

ゼロ設定で使える。Vercel ダッシュボードからオン:
- **Vercel Analytics**: ページビュー、リファラ、デバイス
- **Vercel Speed Insights**: Core Web Vitals (LCP, FID, CLS, INP)

`next.config.js` に
```ts
import { withSentryConfig } from "@sentry/nextjs";
// ...
```
を追加するだけ。Sentry と並行可能。

---

## 4. GitHub Dependabot (依存セキュリティ)

`.github/dependabot.yml` 作成:
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    groups:
      minor-patch:
        update-types: ["minor", "patch"]
    open-pull-requests-limit: 5

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "monthly"
```

- 毎週月曜に **minor/patch を 1 PR にまとめて自動作成**
- CVE 警告は別 PR (Security Advisory)
- `pnpm-lock.yaml` も自動更新

### 自動マージ (任意)
GitHub Actions で「テスト緑なら minor/patch は自動マージ」設定可。

---

## 5. Supabase ベストプラクティス

### 現状の確認
```bash
# RLS が全テーブルで有効か確認
# Supabase ダッシュボード → Database → Policies
```

### 必須
- [ ] **全テーブル RLS 有効**: `user_id = auth.uid()` で本人限定
- [ ] **service_role_key は サーバーのみ**: ブラウザ JS には絶対漏らさない
- [ ] **Auth → Email confirmation**: 本番では ON (現状は magic link なので OK)

### 監視
- **Database → Logs** で slow query を週1で見る
- **Auth → Logs** でブルートフォース兆候を見る (IP 別失敗回数)
- **Storage Usage** が無料枠 500MB を超えそうなら通知設定

---

## 6. PostHog (1ヶ月後)

### なぜ後回しか
すぐ必要ではない。MAU が 50 を超えたら入れる価値あり。

### 何が嬉しいか
- **ファネル分析**: signup → onboarding → first test → first block 完了
- **セッション再生**: ユーザーがどこで詰まったかビデオで見れる
- **Feature Flag**: 「新しい AI チャット UI を 10% にロールアウト」が 1 行で実現
- **A/B テスト**: 2 種類のオンボーディングコピーで CVR 比較

---

## 7. インシデント対応フロー

```
1. Sentry が Slack 通知 (高優先度のみ)
2. Claude Code で `mcp__f8e9cd4a-...__search_issues` で詳細取得
3. 影響範囲確認: 何ユーザー・どの画面で発生
4. ホットフィックス or rollback (`vercel rollback`)
5. Sentry で resolution = "fixed" にマーク
6. ポストモーテム: docs/incidents/ に簡易記録
```

### Vercel ロールバック
```bash
vercel rollback                  # 直前のデプロイへ
vercel ls                        # 過去デプロイ一覧
vercel promote <deployment-url>  # 任意のバージョンへ
```

---

## 8. 月次レビュー (1日 30分)

毎月初に確認:
- [ ] Sentry: 未解決 issue が 10 件以下か (それ以上は技術的負債)
- [ ] Vercel: Speed Insights の LCP < 2.5s
- [ ] Supabase: DB サイズ・MAU が無料枠内か
- [ ] Anthropic: API コストが想定内か (`/usage` 参照)
- [ ] Dependabot PR の積み残し処理
- [ ] GitHub Code Scanning: 新規 alert 対応
