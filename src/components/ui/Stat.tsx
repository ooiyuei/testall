// 共通 Stat — 数値表示 (label + value + unit)
// HomeView / MeView の各種カードで重複してたので統一

import { cn } from "@/lib/cn";

type StatProps = {
  label: string;
  value: string | number;
  unit?: string;
  tone?: "default" | "primary" | "success" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const TONE: Record<NonNullable<StatProps["tone"]>, string> = {
  default: "text-ink-900",
  primary: "text-sky-600",
  success: "text-mint-600",
  danger: "text-coral-500",
};

const SIZE = {
  sm: { value: "text-base", unit: "text-[9px]", label: "text-[9px]" },
  md: { value: "text-xl", unit: "text-[10px]", label: "text-[10px]" },
  lg: { value: "text-[40px] leading-none", unit: "text-xs", label: "text-[10px]" },
};

export function Stat({
  label,
  value,
  unit,
  tone = "default",
  size = "md",
  className,
}: StatProps) {
  const sz = SIZE[size];
  return (
    <div className={cn("", className)}>
      <div
        className={cn(
          "font-medium uppercase tracking-[0.14em] text-ink-400",
          sz.label,
        )}
      >
        {label}
      </div>
      <div className="mt-0.5 flex items-baseline gap-0.5">
        <span
          className={cn(
            "font-bold tabular-nums",
            sz.value,
            TONE[tone],
          )}
        >
          {value}
        </span>
        {unit ? (
          <span
            className={cn(
              "font-medium text-ink-400",
              sz.unit,
            )}
          >
            {unit}
          </span>
        ) : null}
      </div>
    </div>
  );
}
