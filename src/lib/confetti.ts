// 依存ゼロの紙吹雪バースト。SSR安全・prefers-reduced-motion尊重・自動後始末。
// Victory Sequence(完走/レベルアップの祝祭)の共通部品。canvas-confetti等のライブラリは入れない。

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  color: string;
  shape: "rect" | "circle";
  life: number;
};

// design token (cream/sky/mint/sun/coral) と揃えたブランドカラー
const COLORS = ["#0071e3", "#36b97a", "#ffd047", "#f5b400", "#ff9181", "#7bb8ff"];

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * 画面に紙吹雪を一度だけ吹き上げる。
 * @param origin 0..1 の相対座標(viewport基準)。既定は上部中央。
 */
export function burstConfetti(opts?: {
  count?: number;
  origin?: { x: number; y: number };
  spread?: number;
}): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  // 動きを抑えたいユーザーには出さない(globals.cssの方針と一致)
  if (prefersReducedMotion()) return;

  const count = opts?.count ?? 90;
  const ox = (opts?.origin?.x ?? 0.5) * window.innerWidth;
  const oy = (opts?.origin?.y ?? 0.28) * window.innerHeight;
  const spread = opts?.spread ?? 1;

  const canvas = document.createElement("canvas");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.cssText =
    "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }
  ctx.scale(dpr, dpr);

  const particles: Particle[] = Array.from({ length: count }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.4 * spread;
    const speed = 7 + Math.random() * 9;
    return {
      x: ox,
      y: oy,
      vx: Math.cos(angle) * speed * (0.6 + Math.random() * 0.8),
      vy: Math.sin(angle) * speed,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      size: 6 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: Math.random() > 0.5 ? "rect" : "circle",
      life: 0,
    };
  });

  const GRAVITY = 0.32;
  const DRAG = 0.99;
  const MAX_LIFE = 110; // frames ≒ 1.8s @60fps
  let raf = 0;

  function frame() {
    if (!ctx) return;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    let alive = false;
    for (const p of particles) {
      p.life += 1;
      p.vx *= DRAG;
      p.vy = p.vy * DRAG + GRAVITY;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      const fade = Math.max(0, 1 - p.life / MAX_LIFE);
      if (fade <= 0 || p.y > window.innerHeight + 40) continue;
      alive = true;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.shape === "rect") {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    if (alive) {
      raf = requestAnimationFrame(frame);
    } else {
      cancelAnimationFrame(raf);
      canvas.remove();
    }
  }
  raf = requestAnimationFrame(frame);

  // セーフティ: 何があっても2.5秒で確実に除去
  window.setTimeout(() => {
    cancelAnimationFrame(raf);
    canvas.remove();
  }, 2500);
}
