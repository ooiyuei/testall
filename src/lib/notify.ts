// Web Notification API ラッパー
// 通知許可リクエスト、送信、Service Worker 経由通知をサポート。
//
// 使い方:
//   import { notify } from "@/lib/notify";
//   const ok = await notify.requestPermission();
//   if (ok) notify.send("完了！", { body: "25分集中できました" });

type NotifySupport = "supported" | "denied" | "unsupported" | "default";

function support(): NotifySupport {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return "unsupported";
  }
  if (Notification.permission === "granted") return "supported";
  if (Notification.permission === "denied") return "denied";
  return "default";
}

async function requestPermission(): Promise<boolean> {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    const res = await Notification.requestPermission();
    return res === "granted";
  } catch {
    return false;
  }
}

interface SendOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  /** クリック時に開く URL */
  url?: string;
}

function send(title: string, opts: SendOptions = {}): boolean {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission !== "granted") return false;
  try {
    const n = new Notification(title, {
      body: opts.body,
      icon: opts.icon ?? "/icon-192.svg",
      badge: opts.badge ?? "/icon-192.svg",
      tag: opts.tag,
    });
    if (opts.url) {
      n.onclick = () => {
        window.focus();
        window.location.href = opts.url!;
        n.close();
      };
    }
    return true;
  } catch {
    return false;
  }
}

export const notify = {
  support,
  requestPermission,
  send,
};
