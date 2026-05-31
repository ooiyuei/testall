import { Loader2 } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-[480px] items-center justify-center bg-cream-50">
      <div className="flex flex-col items-center gap-2 text-ink-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-[12px] font-medium">読み込み中…</span>
      </div>
    </div>
  );
}
