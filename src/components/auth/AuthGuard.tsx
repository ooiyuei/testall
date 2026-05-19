"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";

const AUTH_REQUIRED = process.env.NEXT_PUBLIC_AUTH_REQUIRED === "true";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!AUTH_REQUIRED) return;
    if (loading) return;
    if (!user) {
      router.replace("/signin");
    }
  }, [user, loading, router]);

  // Auth guard is off in dev — render immediately
  if (!AUTH_REQUIRED) return <>{children}</>;

  // Auth guard is on — show nothing while checking, redirect if not authed
  if (loading) return null;
  if (!user) return null;

  return <>{children}</>;
}
