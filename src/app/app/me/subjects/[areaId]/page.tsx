"use client";

import { use } from "react";
import { SubjectAreaDetail } from "@/components/me/SubjectAreaDetail";
import type { SubjectAreaId } from "@/lib/master/subjects";

export default function SubjectDetailPage({
  params,
}: {
  params: Promise<{ areaId: string }>;
}) {
  const { areaId } = use(params);
  return <SubjectAreaDetail area={areaId as SubjectAreaId} />;
}
