import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Testall — はじめる",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-svh bg-cream-50">{children}</div>;
}
