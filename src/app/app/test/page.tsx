import Link from "next/link";
import { AppHeader } from "@/components/app/AppHeader";
import { TestListView } from "@/components/app/TestListView";
import { Plus } from "lucide-react";

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
      <TestListView />
    </>
  );
}
