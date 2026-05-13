// seed/*.csv → 巨大な INSERT 文に変換して stdout へ出力する
// 出力は 1ファイル = 1テーブル / 500行ずつにまとめた INSERT 文
//
// 実行例:
//   pnpm dlx tsx scripts/seed-via-sql.ts > seed/insert-mext.sql

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

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

function escStr(s: string | undefined): string {
  if (s === undefined || s === null || s === "") return "NULL";
  return `'${s.replace(/'/g, "''")}'`;
}

function jsonbLit(o: Record<string, unknown>): string {
  return `'${JSON.stringify(o).replace(/'/g, "''")}'::jsonb`;
}

type Batch = { table: string; cols: string[]; values: string[][] };

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

function batchToSql(b: Batch, onConflict: string, updateCols: string[]): string[] {
  // 500行ずつまとめた INSERT
  return chunk(b.values, 500).map((rows) => {
    const valuesSql = rows.map((row) => `(${row.join(", ")})`).join(",\n  ");
    const updates = updateCols
      .map((c) => `${c} = excluded.${c}`)
      .join(", ");
    return `INSERT INTO ${b.table} (${b.cols.join(", ")}) VALUES\n  ${valuesSql}\nON CONFLICT (${onConflict}) DO UPDATE SET ${updates};`;
  });
}

async function main() {
  const out: string[] = [];

  // ─── master_universities_raw ───
  const uniCsv = await readFile(resolve("seed/universities_mext.csv"), "utf8");
  const uniRows = parseCsv(uniCsv);
  out.push(
    `-- master_universities_raw: ${uniRows.length} rows`,
    ...batchToSql(
      {
        table: "master_universities_raw",
        cols: ["school_code", "source", "raw_data"],
        values: uniRows.map((r) => [
          escStr(r.school_code),
          escStr("mext"),
          jsonbLit(r),
        ]),
      },
      "school_code",
      ["source", "raw_data", "fetched_at"],
    ),
  );

  // ─── universities ───
  out.push(
    `-- universities: ${uniRows.length} rows`,
    ...batchToSql(
      {
        table: "universities",
        cols: ["id", "school_code", "name", "type", "region", "source"],
        values: uniRows.map((r) => [
          escStr(r.id),
          escStr(r.school_code),
          escStr(r.name),
          escStr(r.type),
          escStr(r.region),
          escStr("mext"),
        ]),
      },
      "id",
      ["school_code", "name", "type", "region", "source"],
    ),
  );

  // ─── master_highschools_raw ───
  const hsCsv = await readFile(resolve("seed/highschools_mext.csv"), "utf8");
  const hsRows = parseCsv(hsCsv);
  out.push(
    `-- master_highschools_raw: ${hsRows.length} rows`,
    ...batchToSql(
      {
        table: "master_highschools_raw",
        cols: ["school_code", "source", "raw_data"],
        values: hsRows.map((r) => [
          escStr(r.school_code),
          escStr("mext"),
          jsonbLit(r),
        ]),
      },
      "school_code",
      ["source", "raw_data", "fetched_at"],
    ),
  );

  // ─── highschools ───
  out.push(
    `-- highschools: ${hsRows.length} rows`,
    ...batchToSql(
      {
        table: "highschools",
        cols: ["id", "school_code", "name", "prefecture", "city", "type", "source"],
        values: hsRows.map((r) => [
          escStr(r.id),
          escStr(r.school_code),
          escStr(r.name),
          escStr(r.prefecture),
          escStr(r.city),
          escStr(r.type),
          escStr("mext"),
        ]),
      },
      "id",
      ["school_code", "name", "prefecture", "city", "type", "source"],
    ),
  );

  await writeFile(resolve("seed/insert-mext.sql"), out.join("\n\n"));
  console.log(`✓ seed/insert-mext.sql (${uniRows.length} universities + ${hsRows.length} highschools)`);
  console.log(`  batches: ${out.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
