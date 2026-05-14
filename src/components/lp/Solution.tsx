import { Camera, Microscope, Calendar, Timer, RefreshCw } from "lucide-react";

const steps = [
  {
    n: "01",
    icon: Camera,
    tone: "bg-sky-100 text-sky-600",
    title: "テストを撮る・入れる",
    body: "模試・校内テスト・演習結果を写真または手入力で登録。問題文の中身は保存しません（著作権に配慮）。",
  },
  {
    n: "02",
    icon: Microscope,
    tone: "bg-mint-100 text-mint-600",
    title: "苦手分野が、見えてくる",
    body: "単元別の正答率・ミスの傾向（知識/理解/時間/ケアレス）まで一緒に分解。志望校との差分も自動算出。",
  },
  {
    n: "03",
    icon: Calendar,
    tone: "bg-peach-100 text-peach-500",
    title: "3か月→週→今日へ",
    body: "本番日から逆算。志望校・現在地・使える時間・所有参考書から、3か月計画→1週間計画→今日のタスクへ。",
  },
  {
    n: "04",
    icon: Timer,
    tone: "bg-sun-200 text-ink-900",
    title: "25分ブロックで動く",
    body: "「数学/二次関数 例題12〜15、4問中3問を答えを見ず解ける」まで具体化。集中モードでスマホを閉じよう。",
  },
  {
    n: "05",
    icon: RefreshCw,
    tone: "bg-sky-100 text-sky-600",
    title: "崩れたら、整え直す",
    body: "予定通り進まなくても大丈夫。遅れ・優先順位・後ろ倒しを判断して、今週やれる現実プランへ作り直します。",
  },
];

export function Solution() {
  return (
    <section id="how" className="relative border-b border-cream-200 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-3xl">
          <div className="text-xs font-black tracking-[0.3em] text-sky-600">
            つかいかた
          </div>
          <h2 className="mt-4 text-3xl font-black leading-tight text-ink-900 sm:text-5xl">
            テストを入れると、<br />
            <span className="text-sky-500">今日の25分</span>まで決まる。
          </h2>
          <p className="mt-6 max-w-2xl text-base text-ink-600 sm:text-lg">
            塾のカウンセラー・参考書ルート・週間計画・今日のタスクを、AIが1本につないでくれます。
          </p>
        </div>

        <ol className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {steps.map((s) => (
            <li
              key={s.n}
              className="flex flex-col rounded-3xl border border-cream-200 bg-white p-6 shadow-soft"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-black text-ink-400">
                  {s.n}
                </span>
                <span
                  className={
                    "inline-flex h-10 w-10 items-center justify-center rounded-2xl " +
                    s.tone
                  }
                >
                  <s.icon className="h-5 w-5" />
                </span>
              </div>
              <h3 className="mt-5 text-lg font-black leading-snug text-ink-900">
                {s.title}
              </h3>
              <p className="mt-3 text-[13px] text-ink-600">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
