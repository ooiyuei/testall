import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "プライバシーポリシー | Testall" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-[720px] px-6 py-12">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" />
        トップに戻る
      </Link>

      <h1 className="text-[32px] font-extrabold tracking-[-0.025em] text-ink-900">
        プライバシーポリシー
      </h1>
      <p className="mt-2 text-[13px] text-ink-500">最終更新日: 2025年1月1日</p>

      <div className="mt-10 space-y-8 text-[14px] leading-[1.9] text-ink-700">
        <section>
          <h2 className="text-[18px] font-bold text-ink-900">1. 収集する情報</h2>
          <p className="mt-3">当サービスは以下の情報を収集します。</p>
          <ul className="mt-3 list-inside list-disc space-y-1.5 pl-2">
            <li>アカウント情報（メールアドレス、表示名）</li>
            <li>プロフィール情報（学年、志望校、偏差値帯）</li>
            <li>学習記録（テスト結果、集中ブロック完了履歴）</li>
            <li>利用状況（アクセスログ、エラーログ）</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[18px] font-bold text-ink-900">2. 情報の利用目的</h2>
          <p className="mt-3">収集した情報は以下の目的で利用します。</p>
          <ul className="mt-3 list-inside list-disc space-y-1.5 pl-2">
            <li>サービスの提供・運営</li>
            <li>AI診断・学習計画の生成（匿名化して処理）</li>
            <li>サービスの改善・新機能開発</li>
            <li>お問い合わせへの対応</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[18px] font-bold text-ink-900">3. 第三者提供</h2>
          <p className="mt-3">
            法令に基づく場合を除き、利用者の同意なしに第三者へ個人情報を提供することはありません。
          </p>
          <p className="mt-3">
            当サービスは以下のサービスを利用しており、各社のプライバシーポリシーが適用されます。
          </p>
          <ul className="mt-3 list-inside list-disc space-y-1.5 pl-2">
            <li>Supabase（認証・データ保存）</li>
            <li>Anthropic Claude API（AI診断・チャット）</li>
            <li>Vercel（ホスティング）</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[18px] font-bold text-ink-900">4. データの保存と削除</h2>
          <p className="mt-3">
            アカウント削除を希望する場合は、アプリ内の「設定 → データを削除」または
            サポートへメールにてお申し出ください。
            削除申請から30日以内にすべてのデータを消去します。
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-bold text-ink-900">5. Cookieについて</h2>
          <p className="mt-3">
            当サービスは認証セッションの維持のためにCookieを使用します。
            ブラウザの設定によりCookieを無効にすることができますが、
            その場合サービスの一部機能が利用できなくなる場合があります。
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-bold text-ink-900">6. 改定</h2>
          <p className="mt-3">
            当サービスは、必要に応じて本ポリシーを改定することがあります。
            重要な変更がある場合は、サービス内での通知またはメールにてお知らせします。
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-bold text-ink-900">お問い合わせ</h2>
          <p className="mt-3">
            個人情報の取り扱いに関するお問い合わせは{" "}
            <a
              href="mailto:support@testall.app"
              className="font-semibold text-sky-600 hover:underline"
            >
              support@testall.app
            </a>{" "}
            までご連絡ください。
          </p>
        </section>
      </div>
    </div>
  );
}
