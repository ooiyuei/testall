import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-cream-200 bg-cream-100/40">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm text-ink-500">
              今日の45分を、一緒に整える。
              <br />
              受験OS Testall。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm text-ink-500 sm:grid-cols-3">
            <a href="#how" className="hover:text-sky-600">使い方</a>
            <a href="#features" className="hover:text-sky-600">機能</a>
            <a href="#price" className="hover:text-sky-600">料金</a>
            <a href="/app" className="hover:text-sky-600">アプリを開く</a>
            <a href="/legal/privacy" className="hover:text-sky-600">プライバシー</a>
            <a href="/legal/terms" className="hover:text-sky-600">利用規約</a>
          </div>
        </div>
        <div className="mt-10 border-t border-cream-200 pt-6 text-xs text-ink-400">
          © {new Date().getFullYear()} Testall. 親の年収で、受験の選択肢を狭めない。
        </div>
      </div>
    </footer>
  );
}
