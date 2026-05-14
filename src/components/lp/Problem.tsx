const problems = [
  {
    tag: "01 · テスト結果が活きない",
    title: "点数を見て、終わってしまう。",
    body: "本来「次にやること」を教えてくれる模試・校内テストも、返却まで遅かったり、見るのが少しつらかったり。点数を確認するだけで次の行動につながらないこと、多いですよね。",
  },
  {
    tag: "02 · 順番がわからない",
    title: "参考書はある。順番がない。",
    body: "どの参考書を、どの順番で、何周、いつまでに、今日何ページ、この25分で何問。これを毎週自分で組み直すのは本当に大変。ここをAIに任せましょう。",
  },
  {
    tag: "03 · 崩れた後に戻せない",
    title: "1回崩れたら、計画を見なくなる。",
    body: "受験は、最初の完璧な計画より、崩れた後にどう戻すかで決まります。Testallは、遅れた時に「今週やれる現実プラン」を一緒に作り直します。",
  },
];

export function Problem() {
  return (
    <section
      id="problem"
      className="relative border-b border-ink-100 bg-white py-24 sm:py-28"
    >
      <div className="mx-auto max-w-[1080px] px-6">
        {/* Heading */}
        <div className="max-w-[720px]">
          <div className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-[0.04em] text-ink-500">
            <span className="h-px w-4 bg-ink-400" />
            なぜ伸びにくいのか
          </div>
          <h2
            className="mt-6 text-[40px] font-extrabold leading-[1.0] tracking-[-0.03em] text-ink-900 sm:text-[52px] md:text-[60px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            努力は、
            <br />
            <span className="text-ink-400">成績に変換</span>されにくい。
          </h2>
          <p className="mt-7 max-w-[560px] text-[15px] leading-[1.8] text-ink-600 sm:text-[17px]">
            勉強していないわけじゃない。でも伸びない。
            <br />
            原因は、才能でも根性でもなく、
            <strong className="font-bold text-ink-900">毎日の整え方</strong>。
          </p>
        </div>

        {/* Alternating problems */}
        <div className="mt-16 flex flex-col gap-12 sm:gap-14">
          {problems.map((p, i) => {
            const reverse = i % 2 === 1;
            return (
              <article
                key={p.tag}
                className={
                  "grid items-center gap-8 sm:gap-12 md:grid-cols-[1fr_1.4fr] " +
                  (reverse ? "md:[&>*:first-child]:order-2" : "")
                }
              >
                <ProblemVisual variant={i} />
                <div>
                  <div className="text-[12px] font-extrabold tracking-[0.04em] text-sky-500">
                    {p.tag}
                  </div>
                  <h3
                    className="mt-3.5 text-[26px] font-extrabold leading-[1.2] tracking-[-0.02em] text-ink-900 sm:text-[32px]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {p.title}
                  </h3>
                  <p className="mt-4 text-[14px] leading-[1.85] text-ink-600 sm:text-[15px]">
                    {p.body}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ProblemVisual({ variant }: { variant: number }) {
  if (variant === 0) {
    // Score sheet with red marks
    return (
      <div className="relative h-[260px] overflow-hidden rounded-3xl bg-cream-100 p-6 sm:h-[280px]">
        <div className="mx-auto h-full w-[70%] rounded-lg bg-white p-5 shadow-[0_12px_24px_-12px_rgba(0,0,0,0.15)]">
          <div className="text-[10px] text-ink-400">第1回マーク模試</div>
          <div className="mt-1.5 text-[28px] font-extrabold tabular-nums tracking-[-0.02em] text-ink-900">
            72
            <span className="text-[13px] font-medium text-ink-400">/100</span>
          </div>
          <div className="mt-3 flex flex-col gap-1.5">
            {[true, false, true, false, true].map((ok, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className={
                    "h-3 w-3 flex-none rounded-full opacity-80 " +
                    (ok ? "bg-mint-500" : "bg-coral-500")
                  }
                />
                <div className="h-1 flex-1 rounded-full bg-cream-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (variant === 1) {
    // Books in disarray
    return (
      <div className="relative h-[260px] overflow-hidden rounded-3xl bg-cream-100 sm:h-[280px]">
        <div className="absolute inset-0 flex items-center justify-center gap-3">
          {[
            { c: "bg-sky-500", h: 160, r: -8 },
            { c: "bg-mint-500", h: 140, r: 5 },
            { c: "bg-coral-500", h: 180, r: -3 },
            { c: "bg-sun-400", h: 130, r: 10 },
            { c: "bg-ink-500", h: 150, r: -6 },
          ].map((b, i) => (
            <div
              key={i}
              className={
                "w-10 rounded-t-sm shadow-[0_6px_18px_-6px_rgba(0,0,0,0.2)] " +
                b.c
              }
              style={{
                height: b.h,
                transform: `rotate(${b.r}deg)`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }
  // variant 2 — broken line chart
  return (
    <div className="relative h-[260px] overflow-hidden rounded-3xl bg-cream-100 p-6 sm:h-[280px]">
      <svg
        viewBox="0 0 400 220"
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full"
      >
        <defs>
          <linearGradient id="fadefall" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-coral-500)"
              stopOpacity="0.3"
            />
            <stop
              offset="100%"
              stopColor="var(--color-coral-500)"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>
        <polyline
          points="20,80 80,70 140,60 200,55 260,90 320,130 380,180"
          fill="none"
          stroke="var(--color-coral-500)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polygon
          points="20,80 80,70 140,60 200,55 260,90 320,130 380,180 380,200 20,200"
          fill="url(#fadefall)"
        />
        <line
          x1="200"
          y1="0"
          x2="200"
          y2="220"
          stroke="var(--color-ink-300)"
          strokeWidth="1"
          strokeDasharray="3,3"
        />
        <text
          x="206"
          y="20"
          fontSize="10"
          fill="var(--color-ink-500)"
          fontWeight="600"
        >
          ↑計画通り
        </text>
        <text
          x="206"
          y="200"
          fontSize="11"
          fill="var(--color-coral-500)"
          fontWeight="700"
        >
          崩れたあと
        </text>
      </svg>
    </div>
  );
}
