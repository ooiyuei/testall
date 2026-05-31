import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, Inter } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/system/ServiceWorkerRegister";
import { Toaster } from "@/components/ui/Toast";
import { ConfirmHost } from "@/components/ui/ConfirmDialog";
import { RouteProgress } from "@/components/system/RouteProgress";

const notoJP = Noto_Sans_JP({
  variable: "--font-noto-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Testall — 今日の25分を、整える。",
  description:
    "Testallは、模試・校内テストから苦手分析・参考書ルート・今日の25分計画までを一緒に作るAI学習パートナー。続けやすい受験OS。",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Testall",
  },
  icons: {
    icon: [
      { url: "/icon-192.svg", type: "image/svg+xml", sizes: "192x192" },
      { url: "/icon-512.svg", type: "image/svg+xml", sizes: "512x512" },
    ],
    apple: "/icon-192.svg",
  },
  openGraph: {
    title: "Testall — 今日の25分を、整える。",
    description:
      "テストを入れるだけ。AIがあなたの苦手を分析して、今日やる25分を整えます。",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#fbfaf7",
  width: "device-width",
  initialScale: 1,
  // safe-area(env())を有効化。これでpb-safe/pt-safe/BottomNav/BottomSheetが一斉に効く
  viewportFit: "cover",
  // WCAG 1.4.4: 受験生が小さい文字を長時間読む。ピンチズームを禁止しない
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${notoJP.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-cream-50 text-ink-900">
        <ServiceWorkerRegister />
        <RouteProgress />
        {children}
        <Toaster />
        <ConfirmHost />
      </body>
    </html>
  );
}
