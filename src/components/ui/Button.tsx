"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useRipple } from "@/lib/hooks/useRipple";

// LP 用 (sky/mint/soft/ghost = pill 形) + アプリ用 (action/destructive = rounded-xl) を両立
// LP: href 渡せば <Link>、それ以外は <button>
// アプリ: loading / iconBefore / iconAfter / fullWidth に対応

export type Variant =
  | "primary" // sky-500、LP のメイン CTA (pill)
  | "secondary" // mint-500 (pill)
  | "soft" // sky-100 (pill)
  | "ghost" // 白枠 (pill)
  | "action" // ink-900、アプリの「タップ確定」ボタン (rounded-xl)
  | "destructive"; // coral-500 (rounded-xl)
type Size = "sm" | "md" | "lg";

const PILL_BASE =
  "inline-flex items-center justify-center gap-2 font-bold tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap rounded-full";

const ROUNDED_BASE =
  "inline-flex items-center justify-center gap-1.5 font-bold transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap rounded-xl";

const VARIANT_STYLE: Record<Variant, { cls: string; base: string }> = {
  primary: {
    base: PILL_BASE,
    cls: "bg-sky-500 text-white shadow-[0_6px_18px_-8px_var(--color-sky-500)] hover:bg-sky-600",
  },
  secondary: {
    base: PILL_BASE,
    cls: "bg-mint-600 text-white shadow-[0_6px_18px_-8px_var(--color-mint-600)] hover:bg-mint-500",
  },
  soft: {
    base: PILL_BASE,
    cls: "bg-sky-100 text-sky-700 hover:bg-sky-200",
  },
  ghost: {
    base: PILL_BASE,
    cls: "bg-white text-ink-700 border border-ink-100 hover:border-ink-200 hover:bg-cream-100",
  },
  action: {
    base: ROUNDED_BASE,
    cls: "bg-ink-900 text-white shadow-soft hover:bg-ink-800",
  },
  destructive: {
    base: ROUNDED_BASE,
    cls: "bg-coral-600 text-white hover:bg-coral-500",
  },
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-[15px]",
  lg: "h-14 px-8 text-base sm:text-lg",
};

const SIZES_TIGHT: Record<Size, string> = {
  sm: "h-9 px-3 text-[12px]",
  md: "h-11 px-4 text-[13px]",
  lg: "h-12 px-5 text-[14px]",
};

type Common = {
  variant?: Variant;
  size?: Size;
  className?: string;
  loading?: boolean;
  iconBefore?: React.ReactNode;
  iconAfter?: React.ReactNode;
  fullWidth?: boolean;
  /** Material 風タッチリップル波紋を有効化 (default: false) */
  ripple?: boolean;
  children: React.ReactNode;
};

type Props = Common &
  (
    | ({ href: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof Common>)
    | ({ href?: undefined } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof Common>)
  );

export function Button({
  variant = "primary",
  size = "md",
  className,
  loading,
  iconBefore,
  iconAfter,
  fullWidth,
  ripple,
  children,
  ...rest
}: Props) {
  const v = VARIANT_STYLE[variant];
  // action / destructive はタイトな size (rounded-xl 系)、それ以外は LP 風 (pill)
  const isAction = variant === "action" || variant === "destructive";
  const { ripples, onPointerDown } = useRipple();
  const cls = cn(
    v.base,
    v.cls,
    isAction ? SIZES_TIGHT[size] : SIZES[size],
    fullWidth && "w-full",
    // ripple を出すために overflow-hidden + relative を強制
    ripple && "relative overflow-hidden",
    className,
  );

  const inner = (
    <>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.4} />
      ) : iconBefore ? (
        <span className="flex-none">{iconBefore}</span>
      ) : null}
      <span className="truncate">{children}</span>
      {!loading && iconAfter ? <span className="flex-none">{iconAfter}</span> : null}
      {ripple ? ripples : null}
    </>
  );

  if ("href" in rest && rest.href) {
    const { href, ...anchorProps } = rest as { href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <Link
        href={href}
        className={cls}
        onPointerDown={ripple ? onPointerDown : undefined}
        {...anchorProps}
      >
        {inner}
      </Link>
    );
  }
  return (
    <button
      className={cls}
      onPointerDown={ripple ? onPointerDown : undefined}
      disabled={loading || (rest as React.ButtonHTMLAttributes<HTMLButtonElement>).disabled}
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {inner}
    </button>
  );
}
