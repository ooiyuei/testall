import { AlertCircle, BookOpen, ListChecks } from "lucide-react";

const problems = [
  {
    icon: AlertCircle,
    tone: "bg-peach-100 text-peach-500",
    tag: "テスト結果が活きない",
    title: "点数を見て、終わってしまう。",
    body: "本来「次にやること」を教えてくれる模試・校内テストも、返却まで遅かったり、見るのが少しつらかったり。点数を確認するだけで次の行動につながらないこと、多いですよね。",
  },
  {
    icon: BookOpen,
    tone: "bg-sky-100 text-sky-600",
    tag: "なにをやればいいかわからない",
    title: "参考書はある。順番がない。",
    body: "どの参考書を、どの順番で、何周、いつまでに、今日何ページ、この25分で何問。これを毎週自分で組み直すのは本当に大変。ここをAIに任せましょう。",
  },
  {
    icon: ListChecks,
    tone: "bg-mint-100 text-mint-600",
    tag: "崩れた後に戻せない",
    title: "1回崩れたら、計画を見なくなる。",
    body: "受験は、最初の完璧な計画より、崩れた後にどう戻すかで決まります。Testallは、遅れた時に「今週やれる現実プラン」を一緒に作り直します。",
  },
];

export function Problem() {
  return (
    <section id="problem" className="relative border-b border-cream-200 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-3xl">
          <div className="text-xs font-black tracking-[0.3em] text-sky-600">
            なぜ伸びにくいのか
          </div>
          <h2 className="mt-4 text-3xl font-black leading-tight text-ink-900 sm:text-5xl">
            努力は、<br className="sm:hidden" />
            <span className="text-ink-500">成績に変換</span>されにくい。
          </h2>
          <p className="mt-6 max-w-2xl text-base text-ink-600 sm:text-lg">
            勉強していないわけじゃない。でも伸びない。
            <br />
            原因は、才能でも根性でもなく、
            <span className="font-bold text-ink-900">毎日の整え方</span>。
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {problems.map((p) => (
            <article
              key={p.tag}
              className="group flex flex-col rounded-3xl border border-cream-200 bg-white p-7 shadow-soft transition hover:shadow-card"
            >
              <div
                className={
                  "inline-flex h-10 w-10 items-center justify-center rounded-2xl " +
                  p.tone
                }
              >
                <p.icon className="h-5 w-5" />
              </div>
              <div className="mt-5 text-xs font-bold text-ink-500">{p.tag}</div>
              <h3 className="mt-2 text-xl font-black text-ink-900 sm:text-[22px]">
                {p.title}
              </h3>
              <p className="mt-4 text-sm text-ink-600">{p.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
