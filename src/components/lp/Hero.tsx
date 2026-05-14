import { Button } from "@/components/ui/Button";
import { ArrowRight, Sparkles, Flame } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-cream-200">
      <div
        className="absolute inset-x-0 -top-20 -z-0 h-[460px] opacity-70"
        style={{
          background:
            "radial-gradient(60% 60% at 20% 30%, var(--color-sky-100), transparent 70%), radial-gradient(50% 50% at 90% 10%, var(--color-peach-100), transparent 70%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:py-24 md:grid-cols-[1.1fr_1fr] md:items-center md:gap-16">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cream-200 bg-white/80 px-3 py-1.5 text-xs text-ink-600 shadow-soft">
            <Sparkles className="h-3.5 w-3.5 text-sky-500" />
            AI受験パートナー / 月1,500円〜
          </div>

          <h1 className="mt-6 text-[40px] font-black leading-[1.15] tracking-tight text-ink-900 sm:text-[56px] md:text-[64px]">
            今日の<span className="text-sky-500">45分</span>を、
            <br />
            一緒に整える。
          </h1>

          <p className="mt-6 max-w-xl text-base text-ink-600 sm:text-lg">
            模試・校内テストの結果を入れるだけ。
            <br />
            <span className="font-bold text-ink-900">
              苦手分析 → 参考書ルート → 今日の45分
            </span>
            まで、AIが一緒に整える受験OS。
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button href="/signup" size="lg" variant="primary">
              無料ではじめる
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button href="/signin" size="lg" variant="ghost">
              サインイン
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-500">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-mint-500" />
              無料で始められる
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-mint-500" />
              90秒で診断
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-mint-500" />
              問題文は保存しない設計
            </span>
          </div>
        </div>

        {/* Phone mockup */}
        <div className="relative mx-auto w-full max-w-sm">
          <div className="relative rounded-[40px] border border-cream-200 bg-white p-2.5 shadow-[0_30px_60px_-30px_rgba(50,46,41,0.35)]">
            <div className="rounded-[32px] bg-cream-50 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 text-[11px] text-ink-500">
                <span>9:41</span>
                <span aria-hidden>·</span>
                <span>◯</span>
              </div>

              <div className="px-5 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-ink-500">5月13日（水）</div>
                    <div className="text-xl font-black text-ink-900">
                      おかえり、ゆうえいさん
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-sun-200 px-3 py-1.5 text-xs font-black text-ink-900">
                    <Flame className="h-3.5 w-3.5 text-peach-500" />
                    12日連続
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-white p-4 shadow-soft">
                  <div className="flex items-center justify-between text-[11px] font-medium text-ink-500">
                    <span>今日の進み</span>
                    <span className="font-bold text-sky-600 tabular-nums">1 / 3 完了</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-cream-200">
                    <div className="h-full w-1/3 rounded-full bg-sky-500" />
                  </div>
                  <div className="mt-3 text-[13px] text-ink-600">
                    あと90分、いいペース。
                  </div>
                </div>

                <div className="mt-3 space-y-2.5">
                  {[
                    { time: "17:00", title: "数学 / 二次関数", done: true, src: "チャート式 例12〜15" },
                    { time: "20:00", title: "英語 / 長文読解", done: false, src: "ポラリス1 / Unit 4" },
                    { time: "21:30", title: "古文 / 動詞活用", done: false, src: "ステップアップ p.42〜" },
                  ].map((b) => (
                    <div
                      key={b.time}
                      className="flex items-center gap-3 rounded-2xl border border-cream-200 bg-white px-3 py-3"
                    >
                      <span
                        className={
                          "flex h-9 w-9 flex-none items-center justify-center rounded-xl text-xs font-mono font-bold " +
                          (b.done
                            ? "bg-mint-100 text-mint-600"
                            : "bg-sky-50 text-sky-600")
                        }
                      >
                        {b.time}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div
                          className={
                            "text-sm font-bold " +
                            (b.done ? "text-ink-400 line-through" : "text-ink-900")
                          }
                        >
                          {b.title}
                        </div>
                        <div className="text-[11px] text-ink-500">{b.src}</div>
                      </div>
                      <span
                        className={
                          "h-5 w-5 flex-none rounded-full border " +
                          (b.done
                            ? "border-mint-500 bg-mint-500"
                            : "border-cream-300")
                        }
                        aria-hidden
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -right-3 -top-3 rotate-3 rounded-2xl bg-white px-3 py-2 text-xs font-bold text-ink-700 shadow-card">
            <span className="text-sky-600">今日</span>やることが、整いました。
          </div>
        </div>
      </div>
    </section>
  );
}
