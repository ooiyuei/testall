import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-ink-100 bg-white">
      <div className="relative mx-auto max-w-[980px] px-6 pt-20 pb-6 text-center sm:pt-24">
        {/* Eyebrow pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-ink-100 bg-cream-50 px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-ink-600">
          <span className="h-1.5 w-1.5 rounded-full bg-mint-500" />
          NEW · テスト結果を、次の25分に
        </div>

        {/* Editorial headline */}
        <h1
          className="mt-6 text-[44px] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink-900 sm:text-[60px] md:text-[76px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          テストを、
          <span className="text-sky-500">次の25分</span>
          に変える。
        </h1>

        <p className="mx-auto mt-6 max-w-[560px] text-[15px] leading-[1.7] text-ink-500 sm:text-[17px]">
          模試結果を入れるだけで、AIが弱点・参考書ルート・今日の25分までを整えてくれる、受験生のための学習OS。
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button href="/signup" size="lg" variant="primary">
            無料ではじめる
            <ArrowRight className="h-5 w-5" />
          </Button>
          <Button href="/app" size="lg" variant="ghost">
            デモを見る
          </Button>
        </div>
      </div>

      {/* Hero phone with soft halo */}
      <div className="relative mx-auto max-w-[980px] px-6 pt-6 pb-10">
        <div
          className="pointer-events-none absolute inset-x-[10%] inset-y-0 -z-0 opacity-70"
          aria-hidden
          style={{
            background:
              "radial-gradient(60% 60% at 50% 30%, var(--color-sky-100), transparent 70%)",
          }}
        />
        <div className="relative z-10 mx-auto w-full max-w-[340px]">
          <div className="rounded-[36px] bg-ink-900 p-2 shadow-[0_40px_80px_-20px_rgba(20,19,15,0.35),0_0_0_1px_rgba(20,19,15,0.06)]">
            <div className="overflow-hidden rounded-[28px] bg-cream-50 px-3.5 pt-2 pb-4">
              <div className="flex justify-between text-[11px] font-semibold">
                <span>9:41</span>
                <span className="opacity-50">•••</span>
              </div>
              <div className="mt-2 text-[10px] text-ink-400">5月13日（水）</div>
              <div
                className="mt-0.5 text-[22px] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink-900"
                style={{ fontFamily: "var(--font-display)" }}
              >
                おかえり、ゆうえい
              </div>

              {/* NEXT UP card */}
              <div className="mt-3 rounded-2xl bg-ink-900 p-3.5 text-white">
                <div className="text-[10px] font-semibold text-white/60">
                  次の25分 · 20:00
                </div>
                <div className="mt-1.5 text-[16px] font-extrabold tracking-tight">
                  英語 / 長文読解
                </div>
                <div className="mt-0.5 text-[10px] text-white/70">
                  ポラリス1 · Unit 4
                </div>
                <div className="mt-2.5 flex h-9 items-center justify-center gap-1.5 rounded-full bg-white text-[11px] font-bold text-ink-900">
                  ▶ 25分はじめる
                </div>
              </div>

              {/* Stats */}
              <div className="mt-2.5 flex gap-2">
                <div className="flex-1 rounded-xl border border-ink-100 bg-white p-2.5">
                  <div className="text-[9px] text-ink-400">今日</div>
                  <div className="text-[18px] font-extrabold leading-none tabular-nums">
                    1<span className="text-[10px] text-ink-400">/3</span>
                  </div>
                </div>
                <div className="flex-1 rounded-xl border border-ink-100 bg-white p-2.5">
                  <div className="text-[9px] text-ink-400">連続</div>
                  <div className="text-[18px] font-extrabold leading-none tabular-nums">
                    🔥 12
                    <span className="text-[9px] text-ink-400">日</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
