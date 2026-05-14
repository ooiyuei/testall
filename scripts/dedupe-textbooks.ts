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
    // 改訂版・新版・第N版・N訂版・revised edition 等を除去
    .replace(/改訂(版|第?\d+版)?/g, "")
    .replace(/新(課程|版)?/g, "")
    .replace(/第?\d+版/g, "")
    .replace(/\d+(訂|改)(版)?/g, "")
    .replace(/[（(]\d{4}[）)]/g, "") // (2023) 等の年号
    .replace(/\d{4}年(度)?版?/g, "") // 2023年度版 等
    .replace(/[\s　]+/g, "") // 全角・半角スペース
    .replace(/[「」『』\(\)（）【】〔〕《》〈〉]/g, "") // 括弧類
    .replace(/[・･]/g, "") // 中点
    .replace(/[-－ー―]/g, "") // ハイフン・長音符
    .replace(/[：:]/g, "") // コロン
    .replace(/[,，、。]/g, "") // 読点・句読点
    .toLowerCase()
    .trim();
}

// pubdate 文字列から比較可能な数値を取得 (新しいほど大きい)
function pubdateScore(pubdate: string | undefined): number {
  if (!pubdate) return 0;
  // YYYYMM / YYYY / YYYY-MM-DD 等に対応
  const digits = pubdate.replace(/\D/g, "");
  return parseInt(digits.padEnd(8, "0"), 10);
}

// textbooks-bulk.ts から TEXTBOOKS_BULK 配列を動的に読み込む
async function loadBulkRaw(): Promise<string> {
  return readFile(BULK_PATH, "utf-8");
}

// TypeScript ファイルのヘッダーコメントを取得
function extractHeader(src: string): string {
  const match = src.match(/^(\/\/.*\n)*\/\/.*\n/);
  return match ? match[0] : "";
}

// 文字列から Textbook オブジェクト配列を JSON-like parse する
// require() を使わず、正規表現 + eval を安全に避けるため
// Node.js の動的 import を利用する
async function loadTextbooks() {
  // TypeScript ファイルを tsx 経由で動的インポート
  const mod = await import(BULK_PATH + `?t=${Date.now()}`);
  return mod.TEXTBOOKS_BULK as Array<Record<string, unknown>>;
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
        const items = val.map((v) => JSON.stringify(v)).join(", ");
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
  const textbooks = await loadTextbooks();
  const originalCount = textbooks.length;
  console.log(`読み込み件数: ${originalCount}`);

  // ── Step 1: ISBN 重複除去 ──────────────────────────────────
  // ISBN が同じなら pubdate が新しい方を残す
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
      // pubdate が新しい方を残す
      const existScore = pubdateScore(existing.pubdate as string | undefined);
      const newScore = pubdateScore(tb.pubdate as string | undefined);
      if (newScore > existScore) {
        byIsbn.set(isbn, tb);
      }
    }
  }

  const afterIsbnDedupe = [...byIsbn.values(), ...noIsbn];
  const isbnDupeCount = originalCount - afterIsbnDedupe.length;
  console.log(`ISBN 重複除去: ${isbnDupeCount} 件削除`);

  // ── Step 2: タイトル正規化 + publisher が同じ版違いの重複除去 ──
  // normalizedTitle + publisher をキーに、版違いを集約
  type DupeKey = string;
  const byNormalized = new Map<DupeKey, Record<string, unknown>[]>();

  for (const tb of afterIsbnDedupe) {
    const title = (tb.name as string) || "";
    const publisher = ((tb.publisher as string) || "").replace(/\s+/g, "");
    const normKey = `${normalizeTitle(title)}:::${publisher}`;

    const group = byNormalized.get(normKey);
    if (!group) {
      byNormalized.set(normKey, [tb]);
    } else {
      group.push(tb);
    }
  }

  // 各グループから最新版を1件だけ残す
  const afterVersionDedupe: Record<string, unknown>[] = [];
  let versionDupeCount = 0;

  for (const group of byNormalized.values()) {
    if (group.length === 1) {
      afterVersionDedupe.push(group[0]);
      continue;
    }
    // pubdate スコアが最大のものを残す (同点なら id の辞書順最大)
    const best = group.reduce((a, b) => {
      const sa = pubdateScore(a.pubdate as string | undefined);
      const sb = pubdateScore(b.pubdate as string | undefined);
      if (sb !== sa) return sb > sa ? b : a;
      // 同点なら id の辞書順大 (より新しいエントリが末尾に付与される傾向)
      return ((b.id as string) || "") > ((a.id as string) || "") ? b : a;
    });
    afterVersionDedupe.push(best);
    versionDupeCount += group.length - 1;
  }

  console.log(`版違い重複除去: ${versionDupeCount} 件削除`);

  const finalCount = afterVersionDedupe.length;
  const totalRemoved = originalCount - finalCount;
  console.log(
    `\n合計: ${originalCount} → ${finalCount} 件 (${totalRemoved} 件削除)`
  );

  // ── Step 3: ファイル生成 ──────────────────────────────────
  const now = new Date().toISOString();
  const header = `// AUTO-GENERATED by scripts/bulk-textbooks.ts
// openBD + NDL OpenSearch から取得した参考書バルクデータ
// 手書きの src/lib/textbooks.ts と src/lib/master/textbooks/index.ts は触らない
//
// 生成日時: ${now}
// 件数: ${finalCount}
// 重複除去: ISBN重複 ${isbnDupeCount}件 + 版違い ${versionDupeCount}件 = ${totalRemoved}件削除

import type { Textbook } from "./types";

export const TEXTBOOKS_BULK: Textbook[] = [
`;

  const body = afterVersionDedupe
    .map((tb) => serializeTextbook(tb))
    .join(",\n");

  const output = header + body + "\n];\n";

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
