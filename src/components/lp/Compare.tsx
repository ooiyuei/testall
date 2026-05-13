const rows = [
  { name: "Testall Standard", price: "54,000円", monthly: "月1,500円", highlight: true },
  { name: "スタディサプリ", price: "65,340円", monthly: "月1,815円" },
  { name: "オンライン家庭教師", price: "712,800円", monthly: "月19,800円" },
  { name: "一般的な塾", price: "1,116,000円", monthly: "月31,000円" },
  { name: "家庭教師（対面）", price: "1,224,000〜1,584,000円", monthly: "月34,000〜44,000円" },
  { name: "武田塾型", price: "1,800,000〜3,000,000円", monthly: "月50,000〜83,000円" },
];

export function Compare() {
  return (
    <section className="relative border-b border-cream-200 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-5">
        <div className="max-w-3xl">
          <div className="text-xs font-black tracking-[0.3em] text-sky-600">
            高校3年間で比べると
          </div>
          <h2 className="mt-4 text-3xl font-black leading-tight text-ink-900 sm:text-5xl">
            個別指導の伴走を、<br />
            <span className="text-sky-500">月1,500円</span>に。
          </h2>
          <p className="mt-6 text-base text-ink-600 sm:text-lg">
            高い塾に通えなくても、AIが毎日そばで一緒に走ります。
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-soft">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream-100 text-ink-500">
              <tr>
                <th className="px-5 py-4 font-bold">手段</th>
                <th className="px-5 py-4 font-bold text-right">月額換算</th>
                <th className="px-5 py-4 font-bold text-right">3年合計</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {rows.map((r) => (
                <tr
                  key={r.name}
                  className={
                    r.highlight
                      ? "bg-sky-50 text-ink-900"
                      : "bg-white text-ink-700"
                  }
                >
                  <td className="px-5 py-4 font-bold">
                    {r.highlight && (
                      <span className="mr-2 inline-flex items-center rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-black text-white">
                        Testall
                      </span>
                    )}
                    {r.name}
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums">{r.monthly}</td>
                  <td
                    className={
                      "px-5 py-4 text-right tabular-nums " +
                      (r.highlight ? "text-sky-600 font-black" : "")
                    }
                  >
                    {r.price}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
