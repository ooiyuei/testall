// 参考書 DB の重複除去スクリプト。
// 同一シリーズの版違い（改訂版・新版・第N版）と ISBN 重複を除去し
// 最新版を残して src/lib/master/textbooks-bulk.ts を上書きする。
//
// 実行: pnpm tsx scripts/dedupe-textbooks.ts

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const BULK_PATH = resolve(
  process.cwd(),
  "src/lib/master/textbooks-bulk.ts"
);

// タイトル正規化: 版情報・空白・記号を除去して正規化キーを生成
function normalizeTitle(title: string): string {
  return title
    .replace(/改訂(版|第?\d+版)?/g, "")
    .replace(/新(課程|版)?/g, "")
    .replace(/第?\d+版/g, "")
    .replace(/\d+(訂|改)(版)?/g, "")
    .replace(/[（(]\d{4}[）)]/g, "")
    .replace(/\d{4}年(度)?版?/g, "")
    .replace(/[\s　]+/g, "")
    .replace(/[「」『』\(\)（）【】〔〕《》〈〉]/g, "")
    .replace(/[・･]/g, "")
    .replace(/[-－ー―]/g, "")
    .replace(/[：:]/g, "")
    .replace(/[,，、。]/g, "")
    .toLowerCase()
    .trim();
}

// pubdate 文字列から比較可能な数値を取得
function pubdateScore(pubdate: string | undefined): number {
  if (!pubdate) return 0;
  const digits = pubdate.replace(/\D/g, "");
  return parseInt(digits.padEnd(8, "0"), 10);
}

// TS ファイルから個々のエントリ文字列を抽出してパース
// TEXTBOOKS_BULK: Textbook[] = [ { ... }, { ... } ] の形式を前提とする
function parseTextbooksFromSource(src: string): Record<string, unknown>[] {
  // 配列本体を抽出
  const arrayMatch = src.match(/TEXTBOOKS_BULK:\s*Textbook\[\]\s*=\s*\[([\s\S]*)\];?\s*$/);
  if (!arrayMatch) throw new Error("TEXTBOOKS_BULK 配列が見つかりません");

  const arrayBody = arrayMatch[1];

  // 各オブジェクトを {  } で分割 (ネストなしなのでシンプルに分割可能)
  const entries: Record<string, unknown>[] = [];

  // 各エントリを正規表現で取り出す
  // エントリ間の区切りは "},\n  {" のパターン
  const entryPattern = /\{([^{}]*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = entryPattern.exec(arrayBody)) !== null) {
    const entryStr = match[1];
    const obj: Record<string, unknown> = {};

    // 各フィールドをパース
    // 文字列フィールド: key: "value",
    const strFieldPattern = /^\s*(\w+):\s*"((?:[^"\\]|\\.)*)"\s*,?\s*$/gm;
    let fieldMatch: RegExpExecArray | null;

    while ((fieldMatch = strFieldPattern.exec(entryStr)) !== null) {
      const [, key, rawVal] = fieldMatch;
      // JSON.parse でエスケープを解除
      try {
        obj[key] = JSON.parse(`"${rawVal}"`);
      } catch {
        obj[key] = rawVal;
      }
    }

    // 数値フィールド: key: 123,
    const numFieldPattern = /^\s*(\w+):\s*(\d+)\s*,?\s*$/gm;
    while ((fieldMatch = numFieldPattern.exec(entryStr)) !== null) {
      const [, key, val] = fieldMatch;
      obj[key] = parseInt(val, 10);
    }

    // 配列フィールド: key: ["a", "b"],
    const arrFieldPattern = /^\s*(\w+):\s*\[([^\]]*)\]\s*,?\s*$/gm;
    while ((fieldMatch = arrFieldPattern.exec(entryStr)) !== null) {
      const [, key, arrContent] = fieldMatch;
      const items = arrContent
        .split(",")
        .map((s) => s.trim().replace(/^"|"$/g, ""))
        .filter((s) => s.length > 0);
      obj[key] = items;
    }

    if (obj.id || obj.isbn) {
      entries.push(obj);
    }
  }

  return entries;
}

// オブジェクトを TypeScript リテラルとして整形
function serializeTextbook(tb: Record<string, unknown>): string {
  const lines: string[] = ["  {"];
  for (const [key, val] of Object.entries(tb)) {
    if (val === undefined || val === null) continue;
    if (Array.isArray(val)) {
      if (val.length === 0) {
        lines.push(`    ${key}: [],`);
      } else {
        const items = val.map((v: unknown) => JSON.stringify(v)).join(", ");
        lines.push(`    ${key}: [${items}],`);
      }
    } else if (typeof val === "string") {
      lines.push(`    ${key}: ${JSON.stringify(val)},`);
    } else if (typeof val === "number") {
      lines.push(`    ${key}: ${val},`);
    } else if (typeof val === "boolean") {
      lines.push(`    ${key}: ${val},`);
    } else {
      lines.push(`    ${key}: ${JSON.stringify(val)},`);
    }
  }
  lines.push("  }");
  return lines.join("\n");
}

async function main() {
  console.log("Loading textbooks-bulk.ts ...");
  const src = await readFile(BULK_PATH, "utf-8");

  const textbooks = parseTextbooksFromSource(src);
  const originalCount = textbooks.length;
  console.log(`読み込み件数: ${originalCount}`);

  // ── Step 1: ISBN 重複除去 ──────────────────────────────────
  const byIsbn = new Map<string, Record<string, unknown>>();
  const noIsbn: Record<string, unknown>[] = [];

  for (const tb of textbooks) {
    const isbn = tb.isbn as string | undefined;
    if (!isbn) {
      noIsbn.push(tb);
      continue;
    }
    const existing = byIsbn.get(isbn);
    if (!existing) {
      byIsbn.set(isbn, tb);
    } else {
      const existScore = pubdateScore(existing.pubdate as string | undefined);
      const newScore = pubdateScore(tb.pubdate as string | undefined);
      if (newScore > existScore) byIsbn.set(isbn, tb);
    }
  }

  const afterIsbnDedupe = [...byIsbn.values(), ...noIsbn];
  const isbnDupeCount = originalCount - afterIsbnDedupe.length;
  console.log(`ISBN 重複除去: ${isbnDupeCount} 件削除`);

  // ── Step 2: タイトル正規化 + publisher が同じ版違いの重複除去 ──
  const byNormalized = new Map<string, Record<string, unknown>[]>();

  for (const tb of afterIsbnDedupe) {
    const title = (tb.name as string) || "";
    const publisher = ((tb.publisher as string) || "").replace(/\s+/g, "");
    const normKey = `${normalizeTitle(title)}:::${publisher}`;

    const group = byNormalized.get(normKey);
    if (!group) byNormalized.set(normKey, [tb]);
    else group.push(tb);
  }

  const afterVersionDedupe: Record<string, unknown>[] = [];
  let versionDupeCount = 0;

  for (const group of byNormalized.values()) {
    if (group.length === 1) {
      afterVersionDedupe.push(group[0]);
      continue;
    }
    const best = group.reduce((a, b) => {
      const sa = pubdateScore(a.pubdate as string | undefined);
      const sb = pubdateScore(b.pubdate as string | undefined);
      if (sb !== sa) return sb > sa ? b : a;
      return ((b.id as string) || "") > ((a.id as string) || "") ? b : a;
    });
    afterVersionDedupe.push(best);
    versionDupeCount += group.length - 1;
  }

  console.log(`版違い重複除去: ${versionDupeCount} 件削除`);

  const finalCount = afterVersionDedupe.length;
  const totalRemoved = originalCount - finalCount;
  console.log(`\n合計: ${originalCount} → ${finalCount} 件 (${totalRemoved} 件削除)`);

  // ── Step 3: ファイル生成 ──────────────────────────────────
  const now = new Date().toISOString();
  const output = [
    `// AUTO-GENERATED by scripts/bulk-textbooks.ts`,
    `// openBD + NDL OpenSearch から取得した参考書バルクデータ`,
    `// 手書きの src/lib/textbooks.ts と src/lib/master/textbooks/index.ts は触らない`,
    `//`,
    `// 生成日時: ${now}`,
    `// 件数: ${finalCount}`,
    `// 重複除去: ISBN重複 ${isbnDupeCount}件 + 版違い ${versionDupeCount}件 = ${totalRemoved}件削除`,
    ``,
    `import type { Textbook } from "./types";`,
    ``,
    `export const TEXTBOOKS_BULK: Textbook[] = [`,
    afterVersionDedupe.map(serializeTextbook).join(",\n"),
    `];`,
    ``,
  ].join("\n");

  await writeFile(BULK_PATH, output, "utf-8");
  console.log(`\n✓ ${BULK_PATH} を更新しました`);
  console.log(`  ISBN重複除去: ${isbnDupeCount}件`);
  console.log(`  版違い重複除去: ${versionDupeCount}件`);
  console.log(`  合計削減: ${totalRemoved}件 (${originalCount} → ${finalCount})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
