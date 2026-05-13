"use client";

import { use } from "react";
import { AppHeader } from "@/components/app/AppHeader";
import { TestDetail } from "@/components/app/TestDetail";

export default function TestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <>
      <AppHeader title="診断レポート" back="/app/test" />
      <TestDetail id={id} />
    </>
  );
}
