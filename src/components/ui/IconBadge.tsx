// 共通 IconBadge — アイコン + 色の付いた小さい四角形 (各カードの左肩)

import { cn } from "@/lib/cn";

export type IconBadgeTone =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

const TONE: Record<IconBadgeTone, string> = {
  primary: "bg-sky-100 text-sky-600",
  success: "bg-mint-100 text-mint-600",
  warning: "bg-sun-200/60 text-ink-700",
  danger: "bg-coral-300/15 text-coral-500",
  info: "bg-sky-100 text-sky-600",
  neutral: "bg-cream-100 text-ink-700",
};

const SIZE = {
  sm: "h-8 w-8 [&_svg]:h-3.5 [&_svg]:w-3.5",
  md: "h-9 w-9 [&_svg]:h-4 [&_svg]:w-4",
  lg: "h-10 w-10 [&_svg]:h-[18px] [&_svg]:w-[18px]",
};

type IconBadgeProps = {
  tone?: IconBadgeTone;
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
};

export function IconBadge({
  tone = "primary",
  size = "md",
  children,
  className,
}: IconBadgeProps) {
  return (
    <span
      className={cn(
        "flex flex-none items-center justify-center rounded-xl",
        TONE[tone],
        SIZE[size],
        className,
      )}
    >
      {children}
    </span>
  );
}
