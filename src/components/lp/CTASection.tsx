import { Button } from "@/components/ui/Button";
import { WaitlistForm } from "@/components/WaitlistForm";

export function CTASection() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-3xl px-5 text-center">
        <h2 className="text-3xl font-black leading-tight text-ink-900 sm:text-5xl">
          今日の<span className="text-sky-500">25分</span>から、<br />
          一緒に始めましょう。
        </h2>
        <p className="mt-6 text-base text-ink-600 sm:text-lg">
          テスト結果を入れるだけ。90秒で診断、そのまま計画。
          <br />
          先行登録者には初月無料コードをお送りします。
        </p>

        <div className="mx-auto mt-10 max-w-md">
          <WaitlistForm />
        </div>

        <div className="mt-6">
          <Button href="/app" size="lg" variant="primary">
            アプリを開いてみる
          </Button>
        </div>
      </div>
    </section>
  );
}
