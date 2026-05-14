export function Mission() {
  return (
    <section
      id="mission"
      className="relative overflow-hidden border-b border-ink-100 bg-cream-50 py-28 sm:py-32"
    >
      <div className="relative mx-auto max-w-[800px] px-6">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-[0.04em] text-ink-500">
          <span className="h-px w-4 bg-ink-400" />
          ミッション
        </div>

        {/* Big editorial headline */}
        <h2
          className="mt-7 text-[40px] font-extrabold leading-[1.1] tracking-[-0.03em] text-ink-900 sm:text-[52px] md:text-[56px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          受験は、
          <br />
          ひとりで戦う必要はない。
        </h2>

        {/* Editorial monologue */}
        <div className="mt-10 flex flex-col gap-6 text-[15px] leading-[2.0] text-ink-600 sm:text-[17px]">
          <p>
            塾に通える子と、通えない子。
            <br />
            親が伴走できる家と、できない家。
            <br />
            受験では、その差が「努力の効率」になって現れます。
          </p>
          <p>
            私たちは、誰のそばにも
            <strong className="font-bold text-ink-900">AIの伴走者</strong>
            がいる世界をつくります。
            毎日の25分を整え、崩れたら一緒にやり直し、本番までずっと隣にいる存在。
            それが Testall です。
          </p>
          <p
            className="text-[19px] font-bold leading-[1.6] tracking-[-0.01em] text-ink-900 sm:text-[21px]"
          >
            努力を、ちゃんと成績に変換する。
            <br />
            それを、月1,500円で。
          </p>
        </div>

        {/* 3 sub-pillars */}
        <div className="mt-14 grid gap-3 sm:grid-cols-3">
          {[
            { k: "個別指導の民主化", v: "AI×プロダクトで1/20の価格に" },
            { k: "地理的制約の解消", v: "東京の最高指導を地方にも" },
            { k: "時間的制約の解消", v: "部活・家計両立でも結果へ" },
          ].map((it) => (
            <div
              key={it.k}
              className="rounded-2xl border border-ink-100 bg-white p-5"
            >
              <div className="text-[13px] font-extrabold tracking-tight text-sky-500">
                {it.k}
              </div>
              <div className="mt-1.5 text-[13px] leading-[1.7] text-ink-600">
                {it.v}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
