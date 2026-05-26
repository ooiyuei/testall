import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "利用規約 | Testall" };

export default function TermsPage() {
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
        利用規約
      </h1>
      <p className="mt-2 text-[13px] text-ink-500">最終更新日: 2025年1月1日</p>

      <div className="mt-10 space-y-8 text-[14px] leading-[1.9] text-ink-700">
        <section>
          <h2 className="text-[18px] font-bold text-ink-900">第1条（適用）</h2>
          <p className="mt-3">
            本規約は、Testall（以下「当サービス」）が提供するサービスの利用条件を定めるものです。
            利用者は本規約に同意した上で当サービスをご利用ください。
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-bold text-ink-900">第2条（利用資格）</h2>
          <p className="mt-3">
            当サービスは、日本国内に居住する方がご利用いただけます。
            未成年者は保護者の同意を得た上でご利用ください。
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-bold text-ink-900">第3条（禁止事項）</h2>
          <p className="mt-3">利用者は以下の行為を行ってはなりません。</p>
          <ul className="mt-3 list-inside list-disc space-y-1.5 pl-2">
            <li>法令または公序良俗に違反する行為</li>
            <li>当サービスのサーバーまたはネットワークに過度の負荷をかける行為</li>
            <li>当サービスの運営を妨害するおそれのある行為</li>
            <li>他の利用者に不利益、損害を与える行為</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[18px] font-bold text-ink-900">第4条（サービスの変更・停止）</h2>
          <p className="mt-3">
            当サービスは、事前の通知なしにサービスの内容の変更または提供の停止を行うことがあります。
            これによって生じた損害について、当サービスは責任を負いません。
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-bold text-ink-900">第5条（免責事項）</h2>
          <p className="mt-3">
            当サービスは、利用者が当サービスを利用したことにより生じた損害について、
            一切の責任を負いません。当サービスが提供する情報の正確性・完全性を保証しません。
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-bold text-ink-900">第6条（準拠法・管轄裁判所）</h2>
          <p className="mt-3">
            本規約の解釈は日本法に準拠します。
            当サービスに関する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-bold text-ink-900">お問い合わせ</h2>
          <p className="mt-3">
            本規約に関するお問い合わせは{" "}
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
