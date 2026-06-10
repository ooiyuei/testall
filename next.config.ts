import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  experimental: {
    // Next.js 16: React の <ViewTransition> + ルート遷移時の CSS View Transitions API を有効化。
    // 対応ブラウザでは自動でフェード遷移、非対応では何もしない（安全）。
    viewTransition: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // camera: バーコードスキャン / microphone: AIコーチ音声入力 で自サイトのみ許可
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(), payment=()" },
        ],
      },
    ];
  },
};

// Sentry 設定 (DSN が未設定なら sentry SDK 自体が no-op)
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  // 広告ブロッカー回避のため Sentry リクエストを /monitoring 経由でプロキシ
  tunnelRoute: "/monitoring",
  widenClientFileUpload: true,
});
