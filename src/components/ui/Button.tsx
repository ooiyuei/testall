import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "soft" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-bold tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none rounded-full whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary:
    "bg-sky-500 text-white shadow-[0_6px_18px_-8px_var(--color-sky-500)] hover:bg-sky-600",
  secondary:
    "bg-mint-500 text-white shadow-[0_6px_18px_-8px_var(--color-mint-500)] hover:bg-mint-600",
  soft:
    "bg-sky-100 text-sky-700 hover:bg-sky-200",
  ghost:
    "bg-white text-ink-700 border border-ink-100 hover:border-ink-200 hover:bg-cream-100",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-[15px]",
  lg: "h-14 px-8 text-base sm:text-lg",
};

type Props = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
} & (
  | ({ href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>)
  | ({ href?: undefined } & React.ButtonHTMLAttributes<HTMLButtonElement>)
);

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: Props) {
  const cls = cn(base, variants[variant], sizes[size], className);
  if ("href" in rest && rest.href) {
    const { href, ...anchorProps } = rest as { href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <Link href={href} className={cls} {...anchorProps}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
