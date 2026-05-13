import { AppHeader } from "@/components/app/AppHeader";
import { Camera, Edit3 } from "lucide-react";

export default function NewTestPage() {
  return (
    <>
      <AppHeader title="テストを追加" back="/app/test" />
      <div className="px-4 pt-3">
        <p className="text-sm text-ink-600">
          模試・校内テストの結果を入力すると、AIが苦手と次の45分を整えます。
        </p>

        <div className="mt-5 grid gap-3">
          <button
            type="button"
            className="flex items-center gap-4 rounded-3xl border border-cream-200 bg-white p-5 text-left shadow-soft active:scale-[0.99] transition"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
              <Camera className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-black text-ink-900">写真で取り込む</div>
              <div className="mt-0.5 text-[11px] text-ink-500">
                答案・成績票を撮影。問題文の中身は保存しません。
              </div>
            </div>
            <span className="rounded-full bg-sun-200 px-2 py-0.5 text-[10px] font-bold text-ink-900">
              近日
            </span>
          </button>

          <button
            type="button"
            className="flex items-center gap-4 rounded-3xl border border-cream-200 bg-white p-5 text-left shadow-soft active:scale-[0.99] transition"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint-100 text-mint-600">
              <Edit3 className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-black text-ink-900">手入力する</div>
              <div className="mt-0.5 text-[11px] text-ink-500">
                単元ごとに正答数・原因を選ぶだけ。
              </div>
            </div>
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-cream-300 bg-white/60 p-4 text-xs text-ink-500">
          ベース構築中。次のステップで、ここに本物の入力フォームが入ります。
        </div>
      </div>
    </>
  );
}
