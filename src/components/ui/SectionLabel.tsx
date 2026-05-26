// 共通セクションラベル — Apple HIG 風
// 日本語タイトルは / wide tracking を外す (英字専用効果のため)
// 英字専用ラベル (例: "Today") は asUppercase=true で従来通り

import { cn } from "@/lib/cn";

type SectionLabelProps = {
  title: string;
  right?: React.ReactNode;
  size?: "sm" | "md";
  /** 強制的に英字 / wide tracking スタイルにする (英字 "Today" などのみ true) */
  asUppercase?: boolean;
  className?: string;
};

function isAsciiOnly(s: string): boolean {
  // 半角英数 + 空白 + 記号のみで構成されているか
  return /^[\x00-\x7F]+$/.test(s);
}

export function SectionLabel({
  title,
  right,
  size = "md",
  asUppercase,
  className,
}: SectionLabelProps) {
  // 明示的指定が無ければ、英字のみのタイトルだけ スタイル
  const upper = asUppercase ?? isAsciiOnly(title);
  const baseSize = size === "sm" ? "text-[10px]" : "text-[11px]";

  return (
    <div className={cn("flex items-baseline justify-between", className)}>
      <h2
        className={cn(
          baseSize,
          upper
            ? "font-bold text-ink-400"
            : "font-medium text-ink-500",
        )}
      >
        {title}
      </h2>
      {right ? <div className="flex-none">{right}</div> : null}
    </div>
  );
}
