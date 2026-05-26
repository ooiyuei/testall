import Link from "next/link";

const COLUMNS = [
  {
    h: "プロダクト",
    items: [
      { l: "使い方", href: "#how" },
      { l: "機能", href: "#compare" },
      { l: "料金", href: "#price" },
      { l: "アプリを開く", href: "/app" },
    ],
  },
  {
    h: "会社",
    items: [
      { l: "ミッション", href: "#mission" },
      { l: "ブログ", href: "#" },
      { l: "お問い合わせ", href: "mailto:support@testall.app" },
      { l: "採用", href: "#" },
    ],
  },
  {
    h: "リソース",
    items: [
      { l: "ヘルプ", href: "/app/help" },
      { l: "利用規約", href: "/terms" },
      { l: "プライバシー", href: "/privacy" },
      { l: "特商法", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-ink-900 px-6 pb-10 pt-16 text-white">
      <div className="mx-auto max-w-[1080px]">
        <div className="grid gap-10 sm:grid-cols-[1.4fr_repeat(3,1fr)]">
          {/* Logo + tagline */}
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[14px] font-extrabold text-ink-900">
                T
              </span>
              <span className="text-[16px] font-extrabold tracking-tight">
                Testall
              </span>
            </div>
            <p className="mt-3.5 max-w-[280px] text-[12px] leading-[1.8] text-white/60">
              今日の25分を、一緒に整える。AI受験パートナー。
            </p>
          </div>

          {/* Link columns */}
          {COLUMNS.map((c) => (
            <div key={c.h}>
              <div className="text-[11px] font-bold tracking-[0.04em] text-white/45">
                {c.h}
              </div>
              <ul className="mt-3.5 flex flex-col gap-2.5">
                {c.items.map((it) => (
                  <li key={it.l}>
                    <Link
                      href={it.href}
                      className="text-[13px] text-white/80 transition hover:text-white"
                    >
                      {it.l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom strip */}
        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-[11px] text-white/55 sm:flex-row sm:items-center">
          <span>
            © {new Date().getFullYear()} Testall, Inc. All rights reserved.
          </span>
          <div className="flex gap-4">
            <a href="#" className="transition hover:text-white">App Store</a>
            <a href="#" className="transition hover:text-white">Google Play</a>
            <a href="#" className="transition hover:text-white">X</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
