// 軽量サウンドエフェクト — Web Audio API。
// 依存ライブラリなし、上品な短い chime / success / error を提供。
//
// 使い方:
//   import { sound } from "@/lib/sound";
//   sound.chime();      // タイマー終了
//   sound.success();    // タスク完了
//   sound.error();      // エラー
//
// "testall.sound" === "off" で完全に無効化。AudioContext は遅延生成。

type SoundKind = "chime" | "success" | "error" | "tap";

let ctx: AudioContext | null = null;

function isEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.localStorage.getItem("testall.sound") === "off") return false;
  } catch {}
  return true;
}

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  try {
    type WindowWithWebkit = Window & {
      webkitAudioContext?: typeof AudioContext;
    };
    const w = window as WindowWithWebkit;
    const Ctor = window.AudioContext ?? w.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

interface ToneSpec {
  freq: number;
  duration: number;
  delay?: number;
  type?: OscillatorType;
  volume?: number;
}

function playTone({
  freq,
  duration,
  delay = 0,
  type = "sine",
  volume = 0.18,
}: ToneSpec): void {
  const c = getContext();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(c.destination);

  const t = c.currentTime + delay;
  // ADSR-ish envelope: 5ms attack, decay to 0 in `duration`
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(volume, t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

function fire(kind: SoundKind): void {
  if (!isEnabled()) return;
  try {
    switch (kind) {
      case "chime":
        // 完了 chime: C5 → E5 → G5 (上昇明るい3和音)
        playTone({ freq: 523.25, duration: 0.32 });
        playTone({ freq: 659.25, duration: 0.32, delay: 0.16 });
        playTone({ freq: 783.99, duration: 0.42, delay: 0.32, volume: 0.22 });
        break;
      case "success":
        // 短い 2音 (G5 → C6)
        playTone({ freq: 783.99, duration: 0.16 });
        playTone({ freq: 1046.5, duration: 0.22, delay: 0.1 });
        break;
      case "error":
        // 短い低音 2連打
        playTone({ freq: 220, duration: 0.12, type: "triangle", volume: 0.2 });
        playTone({ freq: 174.61, duration: 0.18, delay: 0.13, type: "triangle", volume: 0.2 });
        break;
      case "tap":
        playTone({ freq: 1500, duration: 0.04, volume: 0.08 });
        break;
    }
  } catch {
    // AudioContext は user-gesture が無いとブロックされることがある → 静かに失敗
  }
}

export const sound = {
  chime: () => fire("chime"),
  success: () => fire("success"),
  error: () => fire("error"),
  tap: () => fire("tap"),
  disable: (): void => {
    try {
      window.localStorage.setItem("testall.sound", "off");
    } catch {}
  },
  enable: (): void => {
    try {
      window.localStorage.removeItem("testall.sound");
    } catch {}
  },
  isOn: (): boolean => isEnabled(),
};
