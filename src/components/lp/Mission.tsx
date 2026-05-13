export function Mission() {
  return (
    <section id="mission" className="relative overflow-hidden border-b border-cream-200 py-24 sm:py-28">
      <div
        className="absolute inset-0 -z-0 opacity-80"
        style={{
          background:
            "radial-gradient(60% 60% at 20% 30%, var(--color-sky-100), transparent 60%), radial-gradient(50% 50% at 80% 80%, var(--color-peach-100), transparent 60%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-4xl px-5 text-center">
        <div className="text-xs font-black tracking-[0.3em] text-sky-600">
          ミッション
        </div>
        <h2 className="mt-6 text-3xl font-black leading-[1.3] text-ink-900 sm:text-5xl md:text-6xl">
          親の年収で、<br />
          <span className="text-sky-500">受験の選択肢を狭めない。</span>
        </h2>
        <p className="mx-auto mt-8 max-w-2xl text-base text-ink-600 sm:text-lg">
          塾代 年100万円を出せる家庭と出せない家庭で、難関大の合格率には大きな差があります。
          地方と首都圏でも、出会える先生の数が違います。
          <br />
          <br />
          Testallが目指すのは、
          <span className="font-bold text-ink-900">この差を、少しずつ小さくしていくこと</span>。
          月100万円相当の伴走価値を、月1,500円で。困窮世帯には自治体・財団との連携で無償提供枠も用意していきます。
        </p>

        <div className="mt-12 grid gap-3 sm:grid-cols-3">
          {[
            { k: "個別指導の民主化", v: "AI×プロダクトで1/20の価格に" },
            { k: "地理的制約の解消", v: "東京の最高指導を地方にも" },
            { k: "時間的制約の解消", v: "部活・家計両立でも結果へ" },
          ].map((it) => (
            <div
              key={it.k}
              className="rounded-2xl border border-cream-200 bg-white p-5 text-left shadow-soft"
            >
              <div className="text-sm font-black text-sky-600">{it.k}</div>
              <div className="mt-1 text-sm text-ink-600">{it.v}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
