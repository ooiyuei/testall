import Link from "next/link";
import { cn } from "@/lib/cn";

export function Logo({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 font-black tracking-tight text-ink-900",
        className,
      )}
      aria-label="Testall"
    >
      <span
        aria-hidden
        className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500 text-white text-sm font-black shadow-[0_4px_12px_-4px_var(--color-sky-500)]"
      >
        T
      </span>
      <span className="text-lg font-black">Testall</span>
    </Link>
  );
}
