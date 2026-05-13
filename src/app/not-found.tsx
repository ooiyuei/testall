import Link from "next/link";
import { Compass } from "lucide-react";

export const metadata = { title: "ページが見つかりません" };

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col items-center justify-center bg-cream-50 px-5 py-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-sky-500 shadow-soft">
        <Compass className="h-7 w-7" strokeWidth={2.2} />
      </div>
      <h1 className="mt-5 text-[22px] font-bold text-ink-900">
        ページが見つかりません
      </h1>
      <p className="mt-2 text-[12px] leading-[1.7] text-ink-500">
        移動・削除されたか、URL が間違っているようです。
      </p>
      <div className="mt-6 flex w-full max-w-[280px] flex-col gap-2">
        <Link
          href="/app"
          className="flex h-11 items-center justify-center rounded-xl bg-ink-900 text-[13px] font-bold text-white"
        >
          ホームに戻る
        </Link>
        <Link
          href="/app/help"
          className="flex h-11 items-center justify-center rounded-xl border border-cream-200 text-[12px] font-bold text-ink-700"
        >
          ヘルプを見る
        </Link>
      </div>
    </div>
  );
}
