// Sentry — クライアント側エラー追跡 + セッションリプレイ
// DSN は .env.local の NEXT_PUBLIC_SENTRY_DSN から読む。未設定なら何もしない。

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // 本番のみ送信。dev/preview はノイズになるので 0
    enabled: process.env.NODE_ENV === "production",
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

    // パフォーマンス: 10% サンプル
    tracesSampleRate: 0.1,

    // セッションリプレイ: エラー発生時 100% / 通常 5%
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.05,

    integrations: [
      Sentry.replayIntegration({
        // 個人情報をマスク
        maskAllText: false,
        maskAllInputs: true,
        blockAllMedia: false,
      }),
    ],

    // 既知の無害なエラーは無視
    ignoreErrors: [
      // ブラウザ拡張機能由来
      "NotAllowedError: Failed to execute 'writeText' on 'Clipboard'",
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      // ネットワーク
      "Failed to fetch",
      "Load failed",
      "NetworkError",
      // ユーザーが何かをキャンセル
      "AbortError",
      // Service Worker 関連 (本番で稀に出るが無害)
      "Failed to register a ServiceWorker",
    ],

    // 個人情報・機密の自動除去
    beforeSend(event) {
      // パスワード / トークン / メールを scrub
      if (event.request?.cookies) delete event.request.cookies;
      return event;
    },
  });
}
