const steps = [
  {
    n: "01",
    label: "テスト",
    title: "テストを撮る・入れる",
    body: "模試・校内テストを写真または手入力で登録。問題文の中身は保存しません。",
  },
  {
    n: "02",
    label: "分析",
    title: "苦手分野が、見えてくる",
    body: "単元別の正答率と、ミスの傾向（知識・理解・時間・ケアレス）まで分解。",
  },
  {
    n: "03",
    label: "計画",
    title: "3か月→週→今日へ",
    body: "本番から逆算。現在地・使える時間・所有参考書から具体的なルートに落とす。",
  },
  {
    n: "04",
    label: "集中",
    title: "25分ブロックで動く",
    body: "「例題12〜15、答えを見ず4問中3問」まで具体化。集中モードでスマホを閉じる。",
  },
  {
    n: "05",
    label: "再計画",
    title: "崩れたら、整え直す",
    body: "遅れ・優先順位・後ろ倒しを判断し、今週やれる現実プランへ作り直す。",
  },
];

export function Solution() {
  return (
    <section
      id="how"
      className="relative border-b border-ink-100 bg-cream-50 py-24 sm:py-28"
    >
      <div className="mx-auto max-w-[1080px] px-6">
        {/* Heading */}
        <div className="max-w-[640px]">
          <div className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-[0.04em] text-ink-500">
            <span className="h-px w-4 bg-ink-400" />
            つかいかた · 5ステップ
          </div>
          <h2
            className="mt-6 text-[40px] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink-900 sm:text-[52px] md:text-[56px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            テストを入れると、
            <br />
            <span className="text-sky-500">今日の25分</span>まで決まる。
          </h2>
        </div>

        {/* Steps — numbered list */}
        <ol className="mt-16 border-t border-ink-100">
          {steps.map((s) => (
            <li
              key={s.n}
              className="grid items-baseline gap-6 border-b border-ink-100 py-8 sm:gap-10 sm:py-9 md:grid-cols-[120px_minmax(180px,1fr)_1.4fr]"
            >
              <div
                className="text-[44px] font-extrabold leading-[0.9] tabular-nums tracking-[-0.04em] text-ink-200 sm:text-[56px] md:text-[64px]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {s.n}
              </div>
              <div>
                <div className="text-[11px] font-extrabold tracking-[0.04em] text-sky-500">
                  {s.label}
                </div>
                <h3
                  className="mt-2 text-[22px] font-extrabold leading-[1.25] tracking-[-0.02em] text-ink-900 sm:text-[24px]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {s.title}
                </h3>
              </div>
              <p className="text-[14px] leading-[1.85] text-ink-600 sm:text-[15px]">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
