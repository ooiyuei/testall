import { Suspense } from "react";
import { TodoView } from "@/components/app/TodoView";

export const metadata = {
  title: "TODO",
};

export default function TodoPage() {
  return (
    <Suspense fallback={<div className="px-4 pt-10 text-sm text-ink-500">読み込み中…</div>}>
      <TodoView />
    </Suspense>
  );
}
