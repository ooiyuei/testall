"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Bell,
  ChevronRight,
  FileText,
  Globe,
  Lock,
  LogOut,
  Moon,
  Shield,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { clearAll } from "@/lib/store";
import { useStore } from "@/lib/hooks/useStore";

export function SettingsView() {
  const { state, hydrated } = useStore();
  const [confirmStep, setConfirmStep] = useState<0 | 1 | 2>(0);

  function handleDelete() {
    if (confirmStep === 0) {
      setConfirmStep(1);
      return;
    }
    if (confirmStep === 1) {
      setConfirmStep(2);
      return;
    }
    clearAll();
    setConfirmStep(0);
    alert("ローカルデータをすべて削除しました。");
  }

  return (
    <div className="px-4 pt-3 pb-10 space-y-5">
      {/* アプリ設定 */}
      <section>
        <SectionTitle>アプリ</SectionTitle>
        <SettingsGroup>
          <SettingsRow
            icon={Bell}
            tone="bg-sky-100 text-sky-600"
            label="通知"
            value="近日対応"
            disabled
          />
          <SettingsRow
            icon={Moon}
            tone="bg-ink-200 text-ink-700"
            label="外観"
            value="ライト"
            disabled
          />
          <SettingsRow
            icon={Globe}
            tone="bg-mint-100 text-mint-600"
            label="言語"
            value="日本語"
            disabled
          />
        </SettingsGroup>
      </section>

      {/* プロフィール / 学習 */}
      <section>
        <SectionTitle>プロフィール</SectionTitle>
        <SettingsGroup>
          <SettingsLink
            href="/onboarding"
            icon={ChevronRight}
            tone="bg-cream-100 text-ink-700"
            label="学年・志望校・偏差値を編集"
          />
          <SettingsLink
            href="/app/search"
            icon={ChevronRight}
            tone="bg-cream-100 text-ink-700"
            label="参考書を追加・削除"
          />
        </SettingsGroup>
      </section>

      {/* 法務 */}
      <section>
        <SectionTitle>サポート</SectionTitle>
        <SettingsGroup>
          <SettingsLink
            href="/terms"
            icon={FileText}
            tone="bg-cream-100 text-ink-700"
            label="利用規約"
          />
          <SettingsLink
            href="/privacy"
            icon={Shield}
            tone="bg-cream-100 text-ink-700"
            label="プライバシーポリシー"
          />
          <SettingsRow
            icon={Lock}
            tone="bg-cream-100 text-ink-700"
            label="バージョン"
            value="0.4.0"
            disabled
          />
        </SettingsGroup>
      </section>

      {/* アカウント / 危険ゾーン */}
      <section>
        <SectionTitle danger>アカウント</SectionTitle>
        <SettingsGroup>
          <SettingsRow
            icon={LogOut}
            tone="bg-cream-100 text-ink-700"
            label="サインアウト"
            value="未実装"
            disabled
          />
        </SettingsGroup>

        <details className="mt-3 rounded-3xl border border-coral-300/40 bg-coral-300/5 p-1">
          <summary className="flex cursor-pointer items-center gap-2 rounded-2xl px-3 py-3 text-sm font-bold text-coral-500 hover:bg-coral-300/10">
            <TriangleAlert className="h-4 w-4" />
            危険な操作を表示
          </summary>
          <div className="px-3 pb-3 pt-1">
            <p className="text-[11px] text-ink-500">
              保存されているプロフィール・テスト履歴・ブロック記録・予定を
              <strong className="text-ink-900">すべて</strong>削除します。
              一度実行すると元に戻せません。
            </p>

            <button
              type="button"
              onClick={handleDelete}
              disabled={!hydrated}
              className={cn(
                "mt-3 flex h-11 w-full items-center justify-center gap-1.5 rounded-2xl text-sm font-black transition",
                confirmStep === 0
                  ? "border-2 border-coral-300/60 bg-white text-coral-500"
                  : confirmStep === 1
                  ? "border-2 border-coral-400 bg-coral-300/20 text-coral-500"
                  : "bg-coral-500 text-white",
              )}
            >
              <Trash2 className="h-4 w-4" />
              {confirmStep === 0
                ? "ローカルデータをすべて消す"
                : confirmStep === 1
                ? "本当に削除しますか？（タップで確認）"
                : "本当の本当に削除（最後の確認）"}
            </button>
            {confirmStep > 0 ? (
              <button
                type="button"
                onClick={() => setConfirmStep(0)}
                className="mt-2 flex h-9 w-full items-center justify-center text-[11px] font-bold text-ink-500"
              >
                やっぱりやめる
              </button>
            ) : null}

            {hydrated ? (
              <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-white p-3 text-center text-[10px] text-ink-500">
                <div>
                  <div className="text-base font-black text-ink-900 tabular-nums">
                    {state.tests.length}
                  </div>
                  <div>テスト</div>
                </div>
                <div>
                  <div className="text-base font-black text-ink-900 tabular-nums">
                    {state.blockLogs.length}
                  </div>
                  <div>記録</div>
                </div>
                <div>
                  <div className="text-base font-black text-ink-900 tabular-nums">
                    {(state.events ?? []).length}
                  </div>
                  <div>予定</div>
                </div>
              </div>
            ) : null}
          </div>
        </details>
      </section>
    </div>
  );
}

function SectionTitle({
  children,
  danger,
}: {
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <h2
      className={cn(
        "text-[10px] font-bold uppercase tracking-widest",
        danger ? "text-coral-500" : "text-ink-500",
      )}
    >
      {children}
    </h2>
  );
}

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return (
    <ul className="mt-2 divide-y divide-cream-200 overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-soft">
      {children}
    </ul>
  );
}

function SettingsRow({
  icon: Icon,
  tone,
  label,
  value,
  disabled,
}: {
  icon: typeof Bell;
  tone: string;
  label: string;
  value?: string;
  disabled?: boolean;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 px-4 py-3.5",
        disabled && "opacity-60",
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 flex-none items-center justify-center rounded-xl",
          tone,
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 text-sm font-bold text-ink-900">{label}</span>
      {value ? (
        <span className="text-xs font-bold text-ink-500">{value}</span>
      ) : null}
    </li>
  );
}

function SettingsLink({
  href,
  icon: Icon,
  tone,
  label,
}: {
  href: string;
  icon: typeof Bell;
  tone: string;
  label: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 px-4 py-3.5 active:bg-cream-100"
      >
        <span
          className={cn(
            "flex h-8 w-8 flex-none items-center justify-center rounded-xl",
            tone,
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="flex-1 text-sm font-bold text-ink-900">{label}</span>
        <ChevronRight className="h-4 w-4 text-ink-400" />
      </Link>
    </li>
  );
}
