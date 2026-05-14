// 骨組みプレースホルダー — hydrate 中の "読み込み中…" を消すため
// シンプルな pulsing rectangle、後から HomeView などで配置

import { cn } from "@/lib/cn";

type SkeletonProps = {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "full";
};

const RADIUS = {
  sm: "rounded-md",
  md: "rounded-lg",
  lg: "rounded-2xl",
  full: "rounded-full",
};

export function Skeleton({ className, rounded = "md" }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-ink-100/70",
        RADIUS[rounded],
        className,
      )}
      aria-hidden
    />
  );
}

// HomeView 用の骨組み — hydrate 中に表示
export function HomeSkeleton() {
  return (
    <div className="px-5 pb-8 pt-4 space-y-5" aria-hidden>
      {/* greeting */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-7 w-44" />
        </div>
        <Skeleton className="h-9 w-20" rounded="full" />
      </div>
      {/* mood card */}
      <Skeleton className="h-44 w-full" rounded="lg" />
      {/* today progress */}
      <Skeleton className="h-32 w-full" rounded="lg" />
      {/* weekly strip */}
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
      {/* heatmap */}
      <Skeleton className="h-56 w-full" rounded="lg" />
    </div>
  );
}

// MeView 用 (ヘッダ + LV + チャート + 本棚)
export function MeSkeleton() {
  return (
    <div className="px-5 pb-8 pt-4 space-y-5" aria-hidden>
      <Skeleton className="h-24 w-full" rounded="lg" />
      <Skeleton className="h-32 w-full" rounded="lg" />
      <Skeleton className="h-40 w-full" rounded="lg" />
      <Skeleton className="h-40 w-full" rounded="lg" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-24" rounded="lg" />
          <Skeleton className="h-24" rounded="lg" />
        </div>
      </div>
    </div>
  );
}
