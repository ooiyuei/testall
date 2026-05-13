// 文科省「学校コード検索システム」由来の Excel/CSV を取り込み、
// seed/highschools_full.csv と src 用の TypeScript シードに変換する
//
// データ取得元:
//   https://www.mext.go.jp/b_menu/toukei/mext_01087.html
//   「学校コード（高等学校）」を CSV/Excel でダウンロード
//
// 想定する CSV カラム例（文科省フォーマット）:
//   学校コード,学校種,本分校,設置区分,都道府県,市区町村,学校名,所在地
//
// 実行例:
//   pnpm dlx tsx scripts/import-highschools.ts ~/Downloads/h_school.csv
//
// 出力:
//   seed/highschools_full.csv (Supabase 投入用)
//   seed/highschools_raw.json (master_highschools_raw 投入用)

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

type RawRow = Record<string, string>;
type Normalized = {
  id: string;
  school_code: string;
  name: string;
  kana: string;
  aliases: string;            // 文科省データには無いので空配列で出力
  prefecture: string;
  city: string;
  type: "national" | "public" | "private" | "";
  deviation: string;          // 空（後でユーザー入力）
  source: "mext";
};

function detectType(setsuchiKubun: string): Normalized["type"] {
  if (!setsuchiKubun) return "";
  if (setsuchiKubun.includes("国立")) return "national";
  if (setsuchiKubun.includes("私立")) return "private";
  return "public";
}

function slugifyId(prefCode: string, name: string): string {
  const prefSlug = prefCode.slice(0, 2);
  const nameSlug = name
    .replace(/(都立|府立|県立|私立|国立|立)?(高等学校|高校)/g, "")
    .slice(0, 20);
  return `hs-mext-${prefSlug}-${Buffer.from(nameSlug)
    .toString("hex")
    .slice(0, 6)}`;
}

function parseCsv(text: string): RawRow[] {
  // 行頭BOM除去
  const cleaned = text.replace(/^﻿/, "");
  const lines = cleaned.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const header = splitLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitLine(line);
    const row: RawRow = {};
    header.forEach((h, i) => {
      row[h.trim()] = (cells[i] ?? "").trim();
    });
    return row;
  });
}

function splitLine(line: string): string[] {
  // 単純な CSV パーサ（ダブルクォート対応）
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      result.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

function findCol(row: RawRow, candidates: string[]): string {
  for (const c of candidates) {
    if (row[c] !== undefined) return row[c];
  }
  return "";
}

function normalize(row: RawRow): Normalized | null {
  const schoolCode = findCol(row, ["学校コード", "school_code", "コード"]);
  const name = findCol(row, ["学校名", "name", "高等学校名"]);
  if (!schoolCode || !name) return null;
  // 高等学校のみ（学校種コード末尾が "C" など）
  const schoolKind = findCol(row, ["学校種", "種別"]);
  if (schoolKind && !/高/.test(schoolKind)) return null;

  const prefecture = findCol(row, ["都道府県", "都道府県名"]);
  const city = findCol(row, ["市区町村", "市町村", "所在地"]).split(/[\s　]/)[0];
  const setsuchiKubun = findCol(row, ["設置区分", "設置者"]);
  const kana = findCol(row, ["フリガナ", "ふりがな", "kana"]);

  return {
    id: slugifyId(schoolCode, name),
    school_code: schoolCode,
    name,
    kana,
    aliases: "{}",
    prefecture,
    city,
    type: detectType(setsuchiKubun),
    deviation: "",
    source: "mext",
  };
}

function toCsv(rows: Normalized[]): string {
  const header = [
    "id",
    "school_code",
    "name",
    "kana",
    "aliases",
    "prefecture",
    "city",
    "type",
    "deviation",
    "source",
  ];
  const body = rows.map((r) =>
    [
      r.id,
      r.school_code,
      escapeCsv(r.name),
      escapeCsv(r.kana),
      r.aliases,
      r.prefecture,
      escapeCsv(r.city),
      r.type,
      r.deviation,
      r.source,
    ].join(","),
  );
  return [header.join(","), ...body].join("\n");
}

function escapeCsv(s: string): string {
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("usage: tsx scripts/import-highschools.ts <mext-csv-path>");
    console.error(
      "  CSV は文科省 学校コード検索システム の高等学校一覧（UTF-8 もしくは Shift-JIS）",
    );
    process.exit(1);
  }

  const buf = await readFile(inputPath);
  // BOMやSJISの可能性。デフォルトUTF-8で。
  const text = buf.toString("utf8");
  const rows = parseCsv(text);
  console.log(`[import] ${rows.length} rows in CSV`);

  const normalized = rows
    .map(normalize)
    .filter((r): r is Normalized => r !== null);
  console.log(`[import] ${normalized.length} highschools normalized`);

  const outDir = resolve(process.cwd(), "seed");
  if (!existsSync(outDir)) await mkdir(outDir, { recursive: true });

  const csvPath = resolve(outDir, "highschools_full.csv");
  await writeFile(csvPath, toCsv(normalized));

  const rawPath = resolve(outDir, "highschools_raw.json");
  const raw = rows.map((r) => ({
    school_code: r["学校コード"] ?? r.school_code,
    source: "mext",
    raw_data: r,
    fetched_at: new Date().toISOString(),
  }));
  await writeFile(rawPath, JSON.stringify(raw, null, 2));

  console.log(`✓ ${csvPath}`);
  console.log(`✓ ${rawPath}`);
  console.log(
    "  → Supabase へは: \\copy highschools(id,school_code,name,kana,...) from 'seed/highschools_full.csv' csv header",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
