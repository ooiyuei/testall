"use client";

import { useEffect, useRef, useState } from "react";
import { invalidateStoreCache, readStore, setAuthUserId, writeStore, type StoreState } from "../store";
import { loadAll } from "../store-remote";
import { useAuth } from "./useAuth";

const EMPTY: StoreState = { tests: [], blockLogs: [] };

export function useStore(): { state: StoreState; hydrated: boolean } {
  const [state, setState] = useState<StoreState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const { user } = useAuth();

  // sessionStorage 即時反映 (zero-latency UI)
  // 別タブからの storage event はキャッシュを破棄してから読む。
  useEffect(() => {
    const syncLocal = () => setState(readStore());
    const syncFromOtherTab = () => {
      invalidateStoreCache();
      setState(readStore());
    };
    syncLocal();
    setHydrated(true);
    window.addEventListener("testall:store", syncLocal);
    window.addEventListener("storage", syncFromOtherTab);
    return () => {
      window.removeEventListener("testall:store", syncLocal);
      window.removeEventListener("storage", syncFromOtherTab);
    };
  }, []);

  // 認証ユーザー切り替え時の race condition 防止:
  //  - 最新の userId を ref で持ち、loadAll 完了時点で「呼び出し時の userId と一致するか」検証
  //  - 不一致なら writeStore せず捨てる
  const currentUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    const userId = user?.id ?? null;
    currentUserIdRef.current = userId;
    setAuthUserId(userId);
    if (!userId) return;

    let cancelled = false;
    (async () => {
      try {
        const remote = await loadAll(userId);
        // race ガード: userId が変わってたら捨てる (ログアウト→他ユーザーログインの順序保証)
        if (cancelled || currentUserIdRef.current !== userId) return;
        const current = readStore();
        writeStore({
          ...current,
          profile: remote.profile ?? current.profile,
          planning: remote.planning ?? current.planning,
          tests: remote.tests && remote.tests.length > 0 ? remote.tests : current.tests,
          blockLogs: remote.blockLogs && remote.blockLogs.length > 0 ? remote.blockLogs : current.blockLogs,
          tasks: remote.tasks && remote.tasks.length > 0 ? remote.tasks : current.tasks,
          events: remote.events && remote.events.length > 0 ? remote.events : current.events,
          dailyMoodLogs: remote.dailyMoodLogs && remote.dailyMoodLogs.length > 0
            ? remote.dailyMoodLogs : current.dailyMoodLogs,
          weeklyGoals: remote.weeklyGoals && remote.weeklyGoals.length > 0
            ? remote.weeklyGoals : current.weeklyGoals,
          weeklyExecutions: remote.weeklyExecutions && remote.weeklyExecutions.length > 0
            ? remote.weeklyExecutions : current.weeklyExecutions,
        });
      } catch (e) {
        if (!cancelled && process.env.NODE_ENV !== "production") {
          // 開発時のみ表示。本番では Sentry が拾う。
          console.error("[useStore] remote loadAll error:", e);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return { state, hydrated };
}
