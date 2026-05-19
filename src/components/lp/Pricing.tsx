import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "0",
    sub: "まずは試してみる",
    features: [
      "基本プロフィール登録",
      "簡易テスト記録（月1件）",
      "今日のタスク表示",
    ],
    cta: "無料で始める",
    href: "/app",
    highlight: false,
  },
  {
    name: "Light",
    price: "500",
    sub: "計画を回したい",
    features: [
      "週間計画の自動生成",
      "基本苦手分析",
      "25分ブロックの今日タスク",
      "テスト記録 無制限",
    ],
    cta: "Lightで始める",
    href: "/app",
    highlight: false,
  },
  {
    name: "Standard",
    price: "1,500",
    sub: "AIに伴走してほしい",
    features: [
      "詳細苦手分析（原因まで分解）",
      "3か月計画 + 週次再計画",
      "参考書ルート提案",
      "崩れた時の自動再設計",
      "保護者レポート（β）",
    ],
    cta: "Standardで始める",
    href: "/app",
    highlight: true,
  },
];

export function Pricing() {
  return (
    <section
      id="price"
      className="relative border-b border-ink-100 bg-cream-50 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-[1100px] px-6">
        {/* Heading */}
        <div className="mx-auto max-w-[700px] text-center">
          <div className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-[0.04em] text-ink-500">
            <span className="h-px w-4 bg-ink-400" />
            料金プラン
            <span className="h-px w-4 bg-ink-400" />
          </div>
          <h2
            className="mt-6 text-[36px] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink-900 sm:text-[48px] md:text-[56px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            塾の <span className="text-sky-500">1/20</span> の価格で、
            <br />
            毎日の伴走を。
          </h2>
          <p className="mt-4 text-[14px] leading-[1.8] text-ink-600 sm:text-[15px]">
            プランはいつでも変更・解約できます。受験本番までずっと使えるよう設計しています。
          </p>
        </div>

        {/* Plans */}
        <div className="mt-14 grid gap-3.5 md:grid-cols-3">
          {plans.map((p) => {
            const highlight = p.highlight;
            return (
              <div
                key={p.name}
                className={
                  "relative flex flex-col rounded-[22px] p-7 " +
                  (highlight
                    ? "bg-ink-900 text-white shadow-[0_24px_48px_-20px_rgba(20,19,15,0.4)]"
                    : "border border-ink-100 bg-white text-ink-900 shadow-[0_1px_1px_rgba(20,19,15,0.04),0_2px_6px_rgba(20,19,15,0.04)]")
                }
              >
                {highlight ? (
                  <span className="absolute -top-3 right-6 rounded-full bg-sun-300 px-3 py-1 text-[11px] font-extrabold tracking-wide text-ink-900">
                    人気プラン
                  </span>
                ) : null}

                <div className="text-[15px] font-extrabold tracking-tight">
                  {p.name}
                </div>
                <div
                  className={
                    "mt-1 text-[12px] " +
                    (highlight ? "text-white/65" : "text-ink-500")
                  }
                >
                  {p.sub}
                </div>

                <div className="mt-6 flex items-baseline gap-1">
                  <span
                    className={
                      "text-[13px] font-medium " +
                      (highlight ? "text-white/60" : "text-ink-400")
                    }
                  >
                    ¥
                  </span>
                  <span
                    className="text-[56px] font-extrabold leading-none tabular-nums tracking-[-0.03em] sm:text-[60px]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {p.price}
                  </span>
                  <span
                    className={
                      "text-[13px] font-medium " +
                      (highlight ? "text-white/60" : "text-ink-400")
                    }
                  >
                    /月
                  </span>
                </div>

                <ul className="mt-8 flex flex-col gap-3">
                  {p.features.map((f) => (
                    <li
                      key={f}
                      className={
                        "flex gap-2.5 text-[13px] leading-[1.6] " +
                        (highlight ? "text-white" : "text-ink-700")
                      }
                    >
                      <Check
                        className={
                          "mt-0.5 h-3.5 w-3.5 flex-none " +
                          (highlight ? "text-sky-500" : "text-mint-600")
                        }
                        strokeWidth={2.5}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex-1" />
                <Link
                  href={p.href}
                  className={
                    "mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full text-[14px] font-bold transition active:scale-[0.97] " +
                    (highlight
                      ? "bg-white text-ink-900"
                      : "bg-ink-900 text-white")
                  }
                >
                  {p.cta}
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
