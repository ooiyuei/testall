"use client";

import { use } from "react";
import { TestDetail } from "@/components/app/TestDetail";

export default function TestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <TestDetail id={id} />;
}
