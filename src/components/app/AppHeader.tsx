"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function AppHeader({
  title,
  back,
  right,
}: {
  title?: string;
  back?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="pt-safe sticky top-0 z-20 border-b border-cream-200/70 bg-cream-50/90 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {back ? (
            <Link
              href={back}
              className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-ink-600 hover:bg-cream-100"
              aria-label="戻る"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
          ) : null}
          {title ? (
            <h1 className="truncate text-base font-black text-ink-900">
              {title}
            </h1>
          ) : null}
        </div>
        <div className="flex flex-none items-center gap-2">{right}</div>
      </div>
    </header>
  );
}
