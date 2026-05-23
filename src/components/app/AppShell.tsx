"use client";

// アプリ全域のコンテナ。
// 上部: AppHeader (path → タイトル自動推定)
// 中央: コンテンツ
// 下部: BottomNav
//
// 没入モード(/app/focus/run)では両方非表示

import { usePathname, useRouter } from "next/navigation";
import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";
import { OfflineBanner } from "@/components/system/OfflineBanner";
import { useScrollRestoration } from "@/lib/hooks/useScrollRestoration";
import { useKeyboardShortcut } from "@/lib/hooks/useKeyboardShortcut";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { useCallback, useState } from "react";

function titleFromPath(path: string): { title?: string; back?: string; showAdd?: boolean } {
  if (path === "/app")               return { title: "", showAdd: true };
  if (path === "/app/todo")          return { title: "", showAdd: true };
  if (path === "/app/focus")         return { title: "", showAdd: true };
  if (path.startsWith("/app/focus/run")) return { title: "" };
  if (path === "/app/plan")          return { title: "", showAdd: true };
  if (path === "/app/me")            return { title: "マイページ", showAdd: true };
  if (path === "/app/me/settings")   return { title: "設定", back: "/app/me", showAdd: false };
  if (path.startsWith("/app/me/subjects/")) return { title: "", back: "/app/me", showAdd: false };
  if (path === "/app/test")          return { title: "テスト", back: "/app", showAdd: true };
  if (path === "/app/test/new")      return { title: "テスト追加", back: "/app/test", showAdd: false };
  if (path.startsWith("/app/test/")) return { title: "テスト詳細", back: "/app/test", showAdd: false };
  if (path === "/app/search")        return { title: "探す", back: "/app", showAdd: true };
  if (path === "/app/help")          return { title: "ヘルプ", back: "/app/me/settings", showAdd: false };
  return { title: "Testall", showAdd: true };
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const immersive = pathname.startsWith("/app/focus/run");
  const meta = titleFromPath(pathname);
  const [paletteOpen, setPaletteOpen] = useState(false);
  useScrollRestoration();

  // PC ユーザー向けショートカット
  // Cmd+K / "/" — グローバル検索パレット
  useKeyboardShortcut({
    key: "k",
    meta: true,
    handler: useCallback(() => setPaletteOpen(true), []),
  });
  useKeyboardShortcut({
    key: "/",
    handler: useCallback(() => setPaletteOpen(true), []),
  });
  // Cmd+N — タスク新規
  useKeyboardShortcut({
    key: "n",
    meta: true,
    handler: useCallback(() => router.push("/app/todo?new=1"), [router]),
  });

  return (
    <div className="app-shell min-h-screen w-full">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-cream-50 shadow-[0_0_60px_-30px_rgba(20,19,15,0.18)] md:my-6 md:min-h-[calc(100vh-3rem)] md:rounded-[32px] md:border md:border-cream-200/80">
        {!immersive ? (
          <>
            <AppHeader
              title={meta.title}
              back={meta.back}
              showAdd={meta.showAdd ?? true}
            />
            <OfflineBanner />
          </>
        ) : null}
        <div className={immersive ? "flex-1" : "flex-1 pb-24"}>{children}</div>
        <BottomNav />
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
