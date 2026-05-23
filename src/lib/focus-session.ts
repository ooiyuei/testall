// 集中タイマーのグローバルセッション状態。
// localStorage + storage event で複数タブ/画面間で共有。
// FocusRun が書き込み、MiniFocusBar が読み込み。

const KEY = "testall.focusSession";

export interface FocusSession {
  /** タイマー開始の epoch ms */
  startedAt: number;
  /** タイマー総尺 (秒) */
  totalSec: number;
  /** running | paused */
  phase: "running" | "paused";
  /** paused 時の経過秒 (resume 時に startedAt を再計算するため) */
  elapsedAtPause?: number;
  /** 表示用ラベル (科目/単元 or "自由学習") */
  label?: string;
  /** どこに戻るか */
  returnHref: string;
}

function read(): FocusSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as Record<string, unknown>).startedAt === "number"
    ) {
      return parsed as FocusSession;
    }
    return null;
  } catch {
    return null;
  }
}

function write(s: FocusSession | null): void {
  if (typeof window === "undefined") return;
  try {
    if (s === null) {
      window.localStorage.removeItem(KEY);
    } else {
      window.localStorage.setItem(KEY, JSON.stringify(s));
    }
    // 同タブ内 listener にも通知（storage event は別タブのみ発火するため）
    window.dispatchEvent(new CustomEvent("testall:focus-session"));
  } catch {
    // private モード等で失敗 → 無視
  }
}

export const focusSession = {
  read,
  write,
  clear: () => write(null),
};

/** running phase での残り秒を計算 */
export function remainingSec(s: FocusSession, now: number = Date.now()): number {
  if (s.phase === "paused") {
    return Math.max(0, s.totalSec - (s.elapsedAtPause ?? 0));
  }
  const elapsed = Math.floor((now - s.startedAt) / 1000) + (s.elapsedAtPause ?? 0);
  return Math.max(0, s.totalSec - elapsed);
}
