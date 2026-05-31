"use client";

import { useEffect, useRef, useState } from "react";
import { invalidateStoreCache, readStore, setAuthUserId, writeStore, type StoreState } from "../store";
import { loadAll, pushAllToRemote } from "../store-remote";
import { useAuth } from "./useAuth";

const EMPTY: StoreState = { tests: [], blockLogs: [] };

// 初回ログイン時、ローカルに「昇格する価値のあるデータ」があるか。
function hasLocalData(s: StoreState): boolean {
  return (
    !!s.profile ||
    (s.tests?.length ?? 0) > 0 ||
    (s.tasks?.length ?? 0) > 0 ||
    (s.blockLogs?.length ?? 0) > 0 ||
    (s.events?.length ?? 0) > 0
  );
}

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
        const result = await loadAll(userId);
        // race ガード: userId が変わってたら捨てる (ログアウト→他ユーザーログインの順序保証)
        if (cancelled || currentUserIdRef.current !== userId) return;
        // 接続エラー時はローカルを保持し、次回に委ねる（空配列で上書きしない）。
        if (!result.ok) return;
        const current = readStore();
        const r = result.state;
        if (result.established) {
          // 同期済みアカウント = remote が真実。
          // クエリ成功で空([])なら削除を反映、クエリ失敗(undefined)はローカル保持。
          // chatMessages / unitProficiency は remote 未対応のためローカルを維持。
          writeStore({
            ...current,
            profile: r.profile ?? current.profile,
            planning: r.planning ?? current.planning,
            tests: r.tests ?? current.tests,
            blockLogs: r.blockLogs ?? current.blockLogs,
            tasks: r.tasks ?? current.tasks,
            events: r.events ?? current.events,
            dailyMoodLogs: r.dailyMoodLogs ?? current.dailyMoodLogs,
            weeklyGoals: r.weeklyGoals ?? current.weeklyGoals,
            weeklyExecutions: r.weeklyExecutions ?? current.weeklyExecutions,
            fixedSlots: r.fixedSlots ?? current.fixedSlots,
          });
        } else if (hasLocalData(current)) {
          // 初回ログイン（remote にまだ profile が無い）: ローカルを破棄せず remote へ昇格。
          await pushAllToRemote(userId, current);
        }
      } catch (e) {
        if (!cancelled && process.env.NODE_ENV !== "production") {
          // 開発時のみ表示。本番では Sentry が拾う。
          console.error("[useStore] remote sync error:", e);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return { state, hydrated };
}
