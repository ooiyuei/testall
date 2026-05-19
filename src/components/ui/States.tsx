"use client";

// 状態系の共通コンポーネント — Empty / Error / Offline / NotFound
// テストリデザイン㉓「状態系 5パターン」に準拠

import Link from "next/link";
import { AlertCircle, BookOpen, WifiOff } from "lucide-react";
import { cn } from "@/lib/cn";
import { haptic } from "@/lib/haptic";

type BaseProps = {
  title: string;
  body?: string;
  primary?: { label: string; href?: string; onClick?: () => void };
  secondary?: { label: string; href?: string; onClick?: () => void };
  className?: string;
};

function StateShell({
  icon,
  iconTone,
  title,
  body,
  primary,
  secondary,
  className,
}: BaseProps & {
  icon: React.ReactNode;
  iconTone: "cream" | "coral";
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className,
      )}
    >
      <div className="relative">
        {/* 背後のソフト glow (reduced-motion 時も静的に表示) */}
        <div
          aria-hidden
          className={cn(
            "absolute inset-[-12px] rounded-full blur-2xl opacity-50",
            iconTone === "cream" ? "bg-sky-100" : "bg-coral-300/30",
          )}
        />
        <div
          className={cn(
            "relative flex h-20 w-20 items-center justify-center rounded-3xl float-y",
            iconTone === "cream" && "bg-cream-100 text-ink-400",
            iconTone === "coral" && "bg-coral-300/15 text-coral-500",
          )}
        >
          {icon}
        </div>
      </div>
      <div className="mt-4 text-[16px] font-extrabold tracking-[-0.01em] text-ink-900">
        {title}
      </div>
      {body ? (
        <p className="mt-1.5 max-w-[260px] text-[11px] leading-[1.7] text-ink-500">
          {body}
        </p>
      ) : null}
      {(primary || secondary) ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {primary ? (
            <StateButton variant="primary" {...primary} />
          ) : null}
          {secondary ? (
            <StateButton variant="secondary" {...secondary} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function StateButton({
  variant,
  label,
  href,
  onClick,
}: {
  variant: "primary" | "secondary";
  label: string;
  href?: string;
  onClick?: () => void;
}) {
  const className = cn(
    "inline-flex h-10 items-center rounded-full px-4 text-[12px] font-bold transition active:scale-[0.97]",
    variant === "primary"
      ? "bg-ink-900 text-white"
      : "bg-cream-100 text-ink-700",
  );
  if (href) {
    return (
      <Link href={href} className={className} onClick={() => haptic.light()}>
        {label}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={() => {
        haptic.medium();
        onClick?.();
      }}
      className={className}
    >
      {label}
    </button>
  );
}

export function EmptyState(props: BaseProps & { icon?: React.ReactNode }) {
  return (
    <StateShell
      icon={
        props.icon ?? <BookOpen className="h-8 w-8" strokeWidth={1.6} />
      }
      iconTone="cream"
      {...props}
    />
  );
}

export function ErrorState(props: BaseProps) {
  return (
    <StateShell
      icon={<AlertCircle className="h-8 w-8" strokeWidth={1.8} />}
      iconTone="coral"
      title={props.title || "うまく読み込めません"}
      body={
        props.body ?? "通信を確認するか、しばらくしてから再度お試しください。"
      }
      primary={props.primary}
      secondary={props.secondary}
      className={props.className}
    />
  );
}

export function OfflineState(props: Omit<BaseProps, "title"> & { title?: string }) {
  return (
    <StateShell
      icon={<WifiOff className="h-8 w-8" strokeWidth={1.6} />}
      iconTone="cream"
      title={props.title ?? "オフラインです"}
      body={
        props.body ??
        "保存済みのタスクとタイマーは使えます。同期は復帰時に行います。"
      }
      primary={props.primary}
      secondary={props.secondary}
      className={props.className}
    />
  );
}

export function NotFoundState({
  title = "ページが見つかりません",
  body = "削除されたか、URLが変更された可能性があります。",
  primary,
  secondary,
  className,
}: BaseProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-14 text-center",
        className,
      )}
    >
      <div
        className="text-[60px] font-extrabold leading-[0.95] tabular-nums tracking-[-0.04em] text-ink-900"
        style={{ fontFamily: "var(--font-display)" }}
      >
        404
      </div>
      <div className="mt-4 text-[16px] font-extrabold tracking-[-0.01em] text-ink-900">
        {title}
      </div>
      <p className="mt-1.5 max-w-[260px] text-[11px] leading-[1.7] text-ink-500">
        {body}
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <StateButton
          variant="primary"
          label={primary?.label ?? "ホームに戻る"}
          href={primary?.href ?? "/app"}
          onClick={primary?.onClick}
        />
        {secondary ? <StateButton variant="secondary" {...secondary} /> : null}
      </div>
    </div>
  );
}

// 既存の LoadingState (LoadingState.tsx) はそのまま使えるので別ファイルです。
// Skeleton 系 (HomeSkeleton, ListSkeleton 等) は Skeleton.tsx を継続利用。
