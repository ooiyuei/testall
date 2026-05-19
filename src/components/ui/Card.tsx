// 共通 Card — 余白 + 角丸 + shadow を統一
// variant: plain (bare 白カード) / elevated (浮きカード) / accent (アクセント色)

import { cn } from "@/lib/cn";

export type CardVariant = "plain" | "elevated" | "accent" | "ghost";
export type CardPadding = "sm" | "md" | "lg" | "none";

const VARIANT: Record<CardVariant, string> = {
  plain: "bg-white border border-ink-100/80",
  elevated: "bg-white border border-ink-100/80 shadow-soft",
  accent: "bg-sky-50/60 border border-sky-200/60",
  ghost: "bg-transparent border border-dashed border-ink-200",
};

const PADDING: Record<CardPadding, string> = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
};

type CardProps = {
  variant?: CardVariant;
  padding?: CardPadding;
  className?: string;
  children: React.ReactNode;
  as?: "div" | "section" | "article";
};

export function Card({
  variant = "plain",
  padding = "md",
  className,
  children,
  as: Tag = "div",
}: CardProps) {
  return (
    <Tag
      className={cn(
        "rounded-2xl transition",
        VARIANT[variant],
        PADDING[padding],
        className,
      )}
    >
      {children}
    </Tag>
  );
}
