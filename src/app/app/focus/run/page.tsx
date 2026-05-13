import { Suspense } from "react";
import { FocusRun } from "@/components/app/FocusRun";

export default function FocusRunPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 pt-10 text-sm text-ink-500">読み込み中…</div>
      }
    >
      <FocusRun />
    </Suspense>
  );
}
