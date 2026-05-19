// Supabase に MEXT 由来の seed/*.csv を投入する
// 必要な環境変数:
//   SUPABASE_URL                (NEXT_PUBLIC_SUPABASE_URL でも可)
//   SUPABASE_SERVICE_ROLE_KEY   ※ RLS バイパスのため
//
// 実行: pnpm dlx tsx scripts/seed-supabase.ts
//
// 処理:
// 1) seed/universities_mext.csv → master_universities_raw + universities にUPSERT
// 2) seed/highschools_mext.csv  → master_highschools_raw + highschools にUPSERT
//
// 既存行は school_code をキーに上書き（onConflict='school_code'）

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY を設定してください");
  process.exit(1);
}

const BASE = `${SUPABASE_URL}/rest/v1`;
const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "resolution=merge-duplicates,return=minimal",
};

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const header = splitLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitLine(line);
    const r: Record<string, string> = {};
    header.forEach((h, i) => (r[h.trim()] = (cells[i] ?? "").trim()));
    return r;
  });
}

function splitLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQ = !inQ;
      }
    } else if (c === "," && !inQ) {
      result.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

async function upsertChunk(table: string, rows: unknown[], onConflict: string) {
  const url = `${BASE}/${table}?on_conflict=${onConflict}`;
  const res = await fetch(url, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`upsert ${table} failed (${res.status}): ${body}`);
  }
}

async function upsertAll(table: string, rows: unknown[], onConflict: string) {
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    await upsertChunk(table, slice, onConflict);
    console.log(`  ${table}: ${i + slice.length}/${rows.length}`);
  }
}

async function seedUniversities() {
  const csv = await readFile(resolve("seed/universities_mext.csv"), "utf8");
  const rows = parseCsv(csv);
  console.log(`[universities] ${rows.length} rows`);

  const rawRows = rows.map((r) => ({
    school_code: r.school_code,
    source: "mext" as const,
    raw_data: r,
  }));
  await upsertAll("master_universities_raw", rawRows, "school_code");

  const normRows = rows.map((r) => ({
    id: r.id,
    school_code: r.school_code,
    name: r.name,
    type: r.type as "national" | "public" | "private",
    region: r.region,
    source: "mext",
  }));
  await upsertAll("universities", normRows, "id");
}

async function seedHighschools() {
  const csv = await readFile(resolve("seed/highschools_mext.csv"), "utf8");
  const rows = parseCsv(csv);
  console.log(`[highschools] ${rows.length} rows`);

  const rawRows = rows.map((r) => ({
    school_code: r.school_code,
    source: "mext" as const,
    raw_data: r,
  }));
  await upsertAll("master_highschools_raw", rawRows, "school_code");

  const normRows = rows.map((r) => ({
    id: r.id,
    school_code: r.school_code,
    name: r.name,
    prefecture: r.prefecture,
    city: r.city || null,
    type: r.type as "national" | "public" | "private",
    source: "mext",
  }));
  await upsertAll("highschools", normRows, "id");
}

async function main() {
  console.log(`SUPABASE_URL: ${SUPABASE_URL}`);
  await seedUniversities();
  await seedHighschools();
  console.log("✓ done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
