// 文部科学省 学校コード CSV（全種別を含むフォーマット）を取り込む
// 入力: https://www.mext.go.jp/b_menu/toukei/mext_01087.html
//       「学校コード」CSV（複数ファイル）
// 出力: seed/highschools_mext.csv, seed/universities_mext.csv,
//       seed/highschools_mext_raw.json
//
// CSVカラム:
//   学校コード,学校種,都道府県番号,設置区分,本分校,学校名,学校所在地,
//   郵便番号,属性情報設定年月日,属性情報廃止年月日,旧学校調査番号,移行後の学校コード
//
// 学校種フィルタ:
//   D1 = 高校（高等学校）
//   D2 = 中等（中等教育学校 — 中高一貫）
//   F1 = 大学
//
// 設置区分:
//   1(国) = national, 2(公) = public, 3(私) = private
//
// 本分校:
//   1(本) = 本校, 2(分) = 分校, 9(廃) = 廃止
//
// 廃止校（9）は除外する。

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, basename } from "node:path";

type RawRow = {
  schoolCode: string;
  schoolKind: string;
  prefCode: string;
  prefName: string;
  setsuchi: string;
  honBunko: string;
  name: string;
  address: string;
  postalCode: string;
  establishedAt: string;
  abolishedAt: string;
  legacyId: string;
  migratedTo: string;
};

type SchoolKindCode = "D1" | "D2" | "F1";

const REGION_BY_PREF: Record<string, string> = {
  北海道: "北海道",
  青森: "東北",
  岩手: "東北",
  宮城: "東北",
  秋田: "東北",
  山形: "東北",
  福島: "東北",
  茨城: "関東",
  栃木: "関東",
  群馬: "関東",
  埼玉: "関東",
  千葉: "関東",
  東京: "関東",
  神奈川: "関東",
  新潟: "中部",
  富山: "中部",
  石川: "中部",
  福井: "中部",
  山梨: "中部",
  長野: "中部",
  岐阜: "中部",
  静岡: "中部",
  愛知: "中部",
  三重: "関西",
  滋賀: "関西",
  京都: "関西",
  大阪: "関西",
  兵庫: "関西",
  奈良: "関西",
  和歌山: "関西",
  鳥取: "中国",
  島根: "中国",
  岡山: "中国",
  広島: "中国",
  山口: "中国",
  徳島: "四国",
  香川: "四国",
  愛媛: "四国",
  高知: "四国",
  福岡: "九州",
  佐賀: "九州",
  長崎: "九州",
  熊本: "九州",
  大分: "九州",
  宮崎: "九州",
  鹿児島: "九州",
  沖縄: "九州",
};

function detectType(setsuchi: string): "national" | "public" | "private" {
  if (setsuchi.startsWith("1")) return "national";
  if (setsuchi.startsWith("3")) return "private";
  return "public";
}

function stripBom(s: string): string {
  return s.replace(/^﻿/, "").replace(/^﻿/, "");
}

function splitLine(line: string): string[] {
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

// "01(北海道)" → "北海道"、"D1(高校)" → "D1"
function parsePref(s: string): { code: string; name: string } {
  const m = /^(\d+)\((.+?)\)$/.exec(s);
  if (m) return { code: m[1], name: m[2] };
  return { code: s, name: s };
}

function parseKind(s: string): string {
  const m = /^([A-Z]\d)\(.+?\)$/.exec(s);
  return m ? m[1] : s;
}

function parseRow(cells: string[]): RawRow | null {
  if (cells.length < 12) return null;
  const pref = parsePref(cells[2]);
  return {
    schoolCode: cells[0],
    schoolKind: parseKind(cells[1]),
    prefCode: pref.code,
    prefName: pref.name,
    setsuchi: cells[3],
    honBunko: cells[4],
    name: cells[5],
    address: cells[6],
    postalCode: cells[7],
    establishedAt: cells[8],
    abolishedAt: cells[9],
    legacyId: cells[10],
    migratedTo: cells[11],
  };
}

function loadCsv(path: string): RawRow[] {
  const text = stripBom(require("node:fs").readFileSync(path, "utf8"));
  const lines = text.split(/\r?\n/).filter(Boolean);
  return lines
    .slice(1)
    .map(splitLine)
    .map(parseRow)
    .filter((r): r is RawRow => r !== null);
}

function cityFromAddress(address: string, prefName: string): string {
  // 北海道だけ「市」じゃなく「郡」「町」も多い
  const stripped = address.replace(/^北海道|^.+?[都府県]/, "");
  // 〜市 / 〜区 / 〜町 / 〜村 / 〜郡 までを取る
  const m = /^([^市区町村郡]+(?:市|区|町|村|郡)(?:[^市区町村]+(?:市|区|町|村))?)/.exec(
    stripped,
  );
  return m ? m[1] : "";
}

// ──────── 高校（D1, D2） ────────
type HighschoolRow = {
  id: string;
  school_code: string;
  name: string;
  prefecture: string;
  city: string;
  type: "national" | "public" | "private";
  homepage: string;
  source: "mext";
};

function toHighschool(r: RawRow): HighschoolRow | null {
  if (r.schoolKind !== "D1" && r.schoolKind !== "D2") return null;
  if (r.honBunko.startsWith("9")) return null; // 廃止校
  return {
    id: `hs-mext-${r.schoolCode}`,
    school_code: r.schoolCode,
    name: r.name,
    prefecture: r.prefName.includes("道") || r.prefName.includes("府") || r.prefName.includes("都")
      ? r.prefName
      : r.prefName + (r.prefName.endsWith("県") ? "" : "県"),
    city: cityFromAddress(r.address, r.prefName),
    type: detectType(r.setsuchi),
    homepage: "",
    source: "mext",
  };
}

// ──────── 大学（F1） ────────
type UniversityRow = {
  id: string;
  school_code: string;
  name: string;
  short_name: string;
  type: "national" | "public" | "private";
  region: string;
  homepage: string;
  source: "mext";
};

function toUniversity(r: RawRow): UniversityRow | null {
  if (r.schoolKind !== "F1") return null;
  if (r.honBunko.startsWith("9")) return null;
  const region = REGION_BY_PREF[r.prefName] ?? r.prefName;
  return {
    id: `u-mext-${r.schoolCode}`,
    school_code: r.schoolCode,
    name: r.name,
    short_name: "",
    type: detectType(r.setsuchi),
    region,
    homepage: "",
    source: "mext",
  };
}

// ──────── 出力 ────────
function escapeCsv(s: string): string {
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowsToCsv<T extends Record<string, string>>(
  rows: T[],
  cols: (keyof T)[],
): string {
  const header = cols.join(",");
  const body = rows.map((r) =>
    cols.map((c) => escapeCsv(String(r[c] ?? ""))).join(","),
  );
  return [header, ...body].join("\n");
}

async function main() {
  const inputs = process.argv.slice(2);
  if (inputs.length === 0) {
    console.error("usage: tsx scripts/import-mext.ts <csv-path> [<csv-path>...]");
    process.exit(1);
  }

  const rows: RawRow[] = [];
  for (const path of inputs) {
    console.log(`[read] ${basename(path)}`);
    const part = loadCsv(path);
    rows.push(...part);
    console.log(`       ${part.length} rows`);
  }
  console.log(`[total] ${rows.length} raw rows`);

  const highschools: HighschoolRow[] = [];
  const universities: UniversityRow[] = [];
  for (const r of rows) {
    const hs = toHighschool(r);
    if (hs) highschools.push(hs);
    const uni = toUniversity(r);
    if (uni) universities.push(uni);
  }
  // 重複学校コードを除去
  const dedupe = <T extends { school_code: string }>(arr: T[]): T[] => {
    const seen = new Set<string>();
    return arr.filter((r) => {
      if (seen.has(r.school_code)) return false;
      seen.add(r.school_code);
      return true;
    });
  };
  const hsUnique = dedupe(highschools);
  const uniUnique = dedupe(universities);
  console.log(`[parsed] ${hsUnique.length} highschools (D1/D2 active)`);
  console.log(`[parsed] ${uniUnique.length} universities (F1 active)`);

  const outDir = resolve(process.cwd(), "seed");
  if (!existsSync(outDir)) await mkdir(outDir, { recursive: true });

  const hsPath = resolve(outDir, "highschools_mext.csv");
  await writeFile(
    hsPath,
    rowsToCsv(hsUnique, [
      "id",
      "school_code",
      "name",
      "prefecture",
      "city",
      "type",
      "source",
    ]),
  );

  const uniPath = resolve(outDir, "universities_mext.csv");
  await writeFile(
    uniPath,
    rowsToCsv(uniUnique, [
      "id",
      "school_code",
      "name",
      "type",
      "region",
      "source",
    ]),
  );

  const rawPath = resolve(outDir, "mext_raw.json");
  await writeFile(rawPath, JSON.stringify(rows.slice(0, 100), null, 2));

  console.log(`✓ ${hsPath}`);
  console.log(`✓ ${uniPath}`);
  console.log(`  サンプルraw: ${rawPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
