import type { Metadata } from "next";
import { Noto_Sans_JP, Inter } from "next/font/google";
import "./globals.css";

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
  title: "Testall — 今日の45分を、整える。",
  description:
    "Testallは、模試・校内テストから苦手分析・参考書ルート・今日の45分計画までを一緒に作るAI学習パートナー。続けやすい受験OS。",
  openGraph: {
    title: "Testall — 今日の45分を、整える。",
    description:
      "テストを入れるだけ。AIがあなたの苦手を分析して、今日やる45分を整えます。",
    type: "website",
  },
  themeColor: "#fdfbf6",
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
    >
      <body className="min-h-full flex flex-col bg-cream-50 text-ink-900">
        {children}
      </body>
    </html>
  );
}
