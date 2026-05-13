import Link from "next/link";
import { AppHeader } from "@/components/app/AppHeader";
import { Plus, ChevronRight } from "lucide-react";

const TESTS = [
  { id: "1", date: "2026-05-09", name: "校内模試 5月", subject: "数学", score: 54, full: 100, badge: "苦手3件" },
  { id: "2", date: "2026-04-22", name: "全国模試 4月", subject: "英語", score: 132, full: 200, badge: "復習中" },
  { id: "3", date: "2026-04-08", name: "校内テスト 4月", subject: "古文", score: 38, full: 50, badge: "完了" },
];

export default function TestListPage() {
  return (
    <>
      <AppHeader
        title="テスト"
        right={
          <Link
            href="/app/test/new"
            className="flex h-9 items-center gap-1 rounded-full bg-sky-500 px-3 text-xs font-black text-white shadow-soft"
          >
            <Plus className="h-4 w-4" />
            追加
          </Link>
        }
      />
      <div className="px-4 pt-3">
        <div className="rounded-3xl border border-cream-200 bg-white shadow-soft">
          <ul className="divide-y divide-cream-200">
            {TESTS.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/app/test/${t.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 active:bg-cream-100"
                >
                  <div className="flex h-12 w-12 flex-none flex-col items-center justify-center rounded-2xl bg-cream-100 text-[10px] font-bold text-ink-500">
                    <span className="font-black text-ink-900">
                      {Math.round((t.score / t.full) * 100)}
                    </span>
                    <span>%</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-black text-ink-900">
                      {t.name}
                    </div>
                    <div className="mt-0.5 text-[11px] text-ink-500">
                      {t.subject} · {t.date}
                    </div>
                  </div>
                  <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[10px] font-bold text-sky-700">
                    {t.badge}
                  </span>
                  <ChevronRight className="h-4 w-4 flex-none text-ink-400" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 rounded-3xl border border-dashed border-cream-300 bg-white/60 p-6 text-center">
          <div className="text-sm font-bold text-ink-700">
            テストを追加して、AIに分析してもらおう
          </div>
          <div className="mt-1 text-xs text-ink-500">
            写真または手入力でOK。問題文の中身は保存しません。
          </div>
          <Link
            href="/app/test/new"
            className="mt-4 inline-flex h-11 items-center gap-1.5 rounded-full bg-sky-500 px-5 text-sm font-black text-white shadow-soft"
          >
            <Plus className="h-4 w-4" />
            テストを追加する
          </Link>
        </div>
      </div>
    </>
  );
}
