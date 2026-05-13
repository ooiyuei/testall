import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

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
      "今日のタスク+45分ブロック",
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
    <section id="price" className="relative border-b border-cream-200 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-3xl">
          <div className="text-xs font-black tracking-[0.3em] text-sky-600">
            料金プラン
          </div>
          <h2 className="mt-4 text-3xl font-black leading-tight text-ink-900 sm:text-5xl">
            塾の1/20の価格で、<br />
            毎日の伴走を。
          </h2>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={cn(
                "relative flex flex-col rounded-3xl border p-7",
                p.highlight
                  ? "border-sky-200 bg-white shadow-card ring-2 ring-sky-200"
                  : "border-cream-200 bg-white shadow-soft",
              )}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-7 rounded-full bg-sky-500 px-3 py-1 text-[11px] font-black text-white shadow-soft">
                  人気プラン
                </div>
              )}
              <div className="text-base font-black text-ink-900">{p.name}</div>
              <div className="mt-1 text-sm text-ink-500">{p.sub}</div>

              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="text-sm text-ink-500">月額</span>
                <span className="text-5xl font-black tabular-nums text-ink-900">
                  ¥{p.price}
                </span>
              </div>

              <ul className="mt-7 space-y-3">
                {p.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-sm text-ink-700"
                  >
                    <Check
                      className={cn(
                        "mt-0.5 h-4 w-4 flex-none",
                        p.highlight ? "text-sky-500" : "text-mint-500",
                      )}
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Button
                  href={p.href}
                  size="md"
                  variant={p.highlight ? "primary" : "ghost"}
                  className="w-full"
                >
                  {p.cta}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
