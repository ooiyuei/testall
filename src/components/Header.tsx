import { Logo } from "./Logo";
import { Button } from "./ui/Button";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-cream-200/80 bg-cream-50/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm text-ink-600 md:flex">
          <a href="#how" className="hover:text-sky-600 transition">
            使い方
          </a>
          <a href="#features" className="hover:text-sky-600 transition">
            機能
          </a>
          <a href="#price" className="hover:text-sky-600 transition">
            料金
          </a>
          <a href="#mission" className="hover:text-sky-600 transition">
            ミッション
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Button href="/app" size="sm" variant="primary">
            アプリを開く
          </Button>
        </div>
      </div>
    </header>
  );
}
