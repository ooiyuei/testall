import { NotFoundState } from "@/components/ui/States";

export const metadata = { title: "ページが見つかりません" };

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-[480px] flex-col justify-center bg-cream-50">
      <NotFoundState
        title="ページが見つかりません"
        body="削除されたか、URLが変更された可能性があります。"
        primary={{ label: "ホームに戻る", href: "/app" }}
        secondary={{ label: "ヘルプ", href: "/app/help" }}
      />
    </div>
  );
}
