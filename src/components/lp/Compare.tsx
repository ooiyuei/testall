import { cn } from "@/lib/cn";

const rows = [
  {
    name: "Testall Standard",
    monthly: "1,500",
    yearly: "18,000",
    total: "54,000",
    highlight: true,
  },
  {
    name: "スタディサプリ",
    monthly: "1,815",
    yearly: "21,780",
    total: "65,340",
  },
  {
    name: "オンライン家庭教師",
    monthly: "19,800",
    yearly: "237,600",
    total: "712,800",
  },
  {
    name: "一般的な塾",
    monthly: "31,000",
    yearly: "372,000",
    total: "1,116,000",
  },
  {
    name: "家庭教師（対面）",
    monthly: "39,000",
    yearly: "468,000",
    total: "1,404,000",
  },
  {
    name: "武田塾型",
    monthly: "66,500",
    yearly: "798,000",
    total: "2,400,000",
  },
];

export function Compare() {
  return (
    <section id="compare" className="relative border-b border-ink-100 bg-white py-24 sm:py-28">
      <div className="mx-auto max-w-[1000px] px-6">
        {/* Heading */}
        <div className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-[0.04em] text-ink-500">
          <span className="h-px w-4 bg-ink-400" />
          高校3年間で比べると
        </div>
        <h2
          className="mt-6 text-[40px] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink-900 sm:text-[52px] md:text-[56px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          個別指導の伴走を、
          <br />
          <span className="text-sky-500">月1,500円</span>に。
        </h2>
        <p className="mt-5 max-w-[520px] text-[15px] leading-[1.8] text-ink-600 sm:text-[16px]">
          高い塾に通えなくても、AIが毎日そばで一緒に走ります。
        </p>

        {/* Comparison table */}
        <div className="mt-12">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_88px_88px_120px] gap-0 px-3 py-3.5 text-[11px] font-semibold tracking-[0.02em] text-ink-400 sm:grid-cols-[1fr_120px_120px_160px] sm:px-6">
            <div>手段</div>
            <div className="text-right">月額</div>
            <div className="text-right">年額</div>
            <div className="text-right">3年合計</div>
          </div>
          {/* Rows */}
          {rows.map((r, i) => {
            const highlight = r.highlight;
            return (
              <div
                key={r.name}
                className={cn(
                  "grid grid-cols-[1fr_88px_88px_120px] items-center gap-0 px-3 py-4 tabular-nums sm:grid-cols-[1fr_120px_120px_160px] sm:px-6 sm:py-5",
                  i > 0 && !highlight && "border-t border-ink-100",
                  highlight
                    ? "my-2 rounded-[18px] bg-ink-900 text-white shadow-[0_16px_36px_-16px_rgba(20,19,15,0.35)]"
                    : "text-ink-900",
                )}
              >
                <div className="flex items-center gap-2.5">
                  {highlight ? (
                    <span className="rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-white">
                      TESTALL
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      "tracking-tight",
                      highlight
                        ? "text-[15px] font-bold sm:text-[17px]"
                        : "text-[14px] font-semibold sm:text-[15px]",
                    )}
                  >
                    {r.name}
                  </span>
                </div>
                <div
                  className={cn(
                    "text-right",
                    highlight
                      ? "text-[15px] font-bold text-white sm:text-[17px]"
                      : "text-[14px] font-medium text-ink-600",
                  )}
                >
                  ¥{r.monthly}
                </div>
                <div
                  className={cn(
                    "text-right text-[13px]",
                    highlight ? "text-white/60" : "text-ink-400",
                  )}
                >
                  ¥{r.yearly}
                </div>
                <div
                  className={cn(
                    "text-right tracking-[-0.02em]",
                    highlight
                      ? "text-[20px] font-extrabold text-sky-500 sm:text-[22px]"
                      : "text-[16px] font-semibold text-ink-700 sm:text-[18px]",
                  )}
                >
                  ¥{r.total}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
