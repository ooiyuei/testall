// 共通 Chip — 選択タグ用
// variant: selectable (タップで選択切替) / static (情報表示)

import { cn } from "@/lib/cn";

export type ChipTone =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info";

const TONE_ACTIVE: Record<ChipTone, string> = {
  neutral: "bg-ink-900 text-white",
  primary: "bg-sky-500 text-white",
  success: "bg-mint-500 text-white",
  warning: "bg-sun-300 text-ink-900",
  danger: "bg-coral-500 text-white",
  info: "bg-sky-100 text-sky-700",
};

const TONE_INACTIVE: Record<ChipTone, string> = {
  neutral: "bg-cream-100 text-ink-700 hover:bg-cream-200",
  primary: "bg-cream-100 text-ink-700 hover:bg-cream-200",
  success: "bg-mint-50 text-mint-600",
  warning: "bg-sun-100 text-ink-700",
  danger: "bg-coral-200/40 text-coral-500",
  info: "bg-sky-50 text-sky-600",
};

type ChipProps = {
  active?: boolean;
  tone?: ChipTone;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md";
  children: React.ReactNode;
};

export function Chip({
  active = false,
  tone = "neutral",
  onClick,
  disabled,
  className,
  size = "md",
  children,
}: ChipProps) {
  const sizeClass =
    size === "sm" ? "h-7 px-2.5 text-[11px]" : "h-9 px-3 text-[12px]";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-bold transition active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed",
          sizeClass,
          active ? TONE_ACTIVE[tone] : TONE_INACTIVE[tone],
          className,
        )}
      >
        {children}
      </button>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold",
        active ? TONE_ACTIVE[tone] : TONE_INACTIVE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
