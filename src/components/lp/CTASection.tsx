import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { WaitlistForm } from "@/components/WaitlistForm";

export function CTASection() {
  return (
    <section className="relative overflow-hidden bg-ink-900 py-24 text-white sm:py-28">
      {/* Soft sky halo */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
        style={{
          background:
            "radial-gradient(60% 60% at 50% 30%, color-mix(in oklch, var(--color-sky-500) 30%, transparent), transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-[800px] px-6 text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-[0.04em] text-white/60">
          <span className="h-px w-4 bg-white/40" />
          受験を、ひとりで戦わない
          <span className="h-px w-4 bg-white/40" />
        </div>

        {/* Headline */}
        <h2
          className="mt-6 text-[44px] font-extrabold leading-[1.0] tracking-[-0.035em] sm:text-[60px] md:text-[72px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          今日の<span className="text-sky-500">25分</span>を、
          <br />
          一緒に整えよう。
        </h2>

        <p className="mx-auto mt-7 max-w-[480px] text-[14px] leading-[1.8] text-white/65 sm:text-[16px]">
          90秒の診断から始められます。クレジットカード登録は不要。
          <br />
          先行登録者には初月無料コードをお送りします。
        </p>

        {/* Waitlist + primary CTA */}
        <div className="mx-auto mt-10 max-w-md">
          <WaitlistForm />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex h-[56px] items-center gap-2.5 rounded-full bg-white px-7 text-[15px] font-bold text-ink-900 transition active:scale-[0.97]"
          >
            無料ではじめる
            <ArrowRight className="h-[15px] w-[15px]" strokeWidth={2.3} />
          </Link>
          <Link
            href="/signin"
            className="inline-flex h-[56px] items-center rounded-full border border-white/20 bg-transparent px-6 text-[14px] font-semibold text-white transition active:scale-[0.97]"
          >
            ログイン
          </Link>
        </div>

        <div className="mt-8 flex justify-center gap-7 text-[11px] text-white/55">
          <span>App Store</span>
          <span>Google Play</span>
          <span>Web</span>
        </div>
      </div>
    </section>
  );
}
