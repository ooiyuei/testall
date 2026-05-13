// CURRICULUM (hierarchy.ts) → subjects_master / units_master の SQL INSERT を生成し、
// 同時に直接 Supabase へ投入する
//
// 実行例:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm dlx tsx scripts/seed-subjects.ts

import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { CURRICULUM } from "../src/lib/master/subjects/hierarchy";

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function postJson(table: string, rows: unknown[], onConflict: string) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn(`[skip] Supabase 未設定。${table} は seed SQL のみ生成`);
    return;
  }
  const url = `${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    throw new Error(`${table}: ${res.status} ${await res.text()}`);
  }
}

async function main() {
  const subjectRows = CURRICULUM.map((s) => ({
    id: s.id,
    mext_code: s.mextCode ?? null,
    category: s.area, // areaを category に流用（DB は category 名のまま）
    name: s.name,
    short_name: s.shortName,
    grades: s.grades,
    source: "mext",
  }));

  const unitRows: Array<{
    id: string;
    subject_id: string;
    mext_code: string | null;
    name: string;
    testall_tags: string[];
    exam_frequency: "high" | "mid" | "low" | null;
    source: string;
  }> = [];
  for (const s of CURRICULUM) {
    for (const d of s.domains) {
      for (const u of d.units) {
        unitRows.push({
          id: u.id,
          subject_id: s.id,
          mext_code: null,
          name: `${d.name} / ${u.name}`,
          testall_tags: (u.abilities ? [...u.abilities] : []) as string[],
          exam_frequency: u.examFrequency ?? null,
          source: "mext",
        });
      }
    }
  }

  console.log(`subjects: ${subjectRows.length} / units: ${unitRows.length}`);

  await writeFile(
    resolve("seed/subjects_master.json"),
    JSON.stringify(subjectRows, null, 2),
  );
  await writeFile(
    resolve("seed/units_master.json"),
    JSON.stringify(unitRows, null, 2),
  );

  await postJson("subjects_master", subjectRows, "id");
  await postJson("units_master", unitRows, "id");
  console.log("✓ Supabase 投入完了");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
