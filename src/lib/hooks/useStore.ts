"use client";

import { useEffect, useState } from "react";
import { readStore, setAuthUserId, writeStore, type StoreState } from "../store";
import { loadAll } from "../store-remote";
import { useAuth } from "./useAuth";

const EMPTY: StoreState = { tests: [], blockLogs: [] };

export function useStore(): { state: StoreState; hydrated: boolean } {
  const [state, setState] = useState<StoreState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const { user } = useAuth();

  // sessionStorage 即時反映 (zero-latency UI)
  useEffect(() => {
    const sync = () => setState(readStore());
    sync();
    setHydrated(true);
    window.addEventListener("testall:store", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("testall:store", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // 認証ユーザーが取れたら Supabase から loadAll して sessionStorage を上書き
  useEffect(() => {
    if (!user) {
      setAuthUserId(null);
      return;
    }
    setAuthUserId(user.id);
    let cancelled = false;
    (async () => {
      try {
        const remote = await loadAll(user.id);
        if (cancelled) return;
        // リモートのデータがあれば優先、無いフィールドはローカルを維持
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
        console.error("[useStore] remote loadAll error:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { state, hydrated };
}
