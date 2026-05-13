"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { SubjectAreaDetail } from "@/components/me/SubjectAreaDetail";
import { SUBJECT_AREAS } from "@/lib/master/subjects/hierarchy";
import type { SubjectAreaId } from "@/lib/master/subjects";

const VALID_IDS = new Set<string>(SUBJECT_AREAS.map((a) => a.id));

export default function SubjectDetailPage({
  params,
}: {
  params: Promise<{ areaId: string }>;
}) {
  const { areaId } = use(params);
  if (!VALID_IDS.has(areaId)) {
    notFound();
  }
  return <SubjectAreaDetail area={areaId as SubjectAreaId} />;
}
