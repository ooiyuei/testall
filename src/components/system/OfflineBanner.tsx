"use client";

// オフライン時のみ表示される控えめなバナー。
// ヘッダー直下に固定。復帰時はトーストで「オンラインに戻りました」を出す。

import { useEffect, useRef } from "react";
import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";
import { toast } from "@/components/ui/Toast";

export function OfflineBanner() {
  const online = useOnlineStatus();
  const wasOffline = useRef<boolean>(false);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
    } else if (wasOffline.current) {
      wasOffline.current = false;
      toast.success("オンラインに戻りました");
    }
  }, [online]);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-1.5 bg-coral-300/15 px-4 py-1.5 text-[11px] font-bold text-coral-500"
    >
      <WifiOff className="h-3 w-3" strokeWidth={2.4} />
      オフライン中 — 保存済みデータで動作中
    </div>
  );
}
