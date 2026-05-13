// 参考書書誌情報の同期スクリプト
// ISBN を入力に、openBD（一次） → NDL Search（フォールバック）から
// 書名・著者・出版社・書影を取得して seed/textbooks_raw.json に追記する
//
// 実行例:
//   pnpm dlx tsx scripts/sync-textbooks.ts 9784010347027 9784410104213
//   pnpm dlx tsx scripts/sync-textbooks.ts --file isbn-list.txt
//
// 出力:
//   seed/textbooks_raw.json (raw データ。後で master_textbooks_raw テーブルへ投入)
//   seed/textbooks_enrichment.json (取得した author/cover_url のサマリ)
//
// 注意:
// - openBD はカジュアル利用OK・無料・レート制限なし
// - NDLサーチは1秒1リクエスト目安
// - 本文や問題文は一切保存しない（書誌のみ）

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";

type OpenBdResponse = {
  onix?: {
    DescriptiveDetail?: {
      TitleDetail?: { TitleElement?: { TitleText?: { content?: string } } };
      Contributor?: { PersonName?: { content?: string } }[];
    };
    PublishingDetail?: {
      Imprint?: { ImprintName?: string };
      Publisher?: { PublisherName?: string };
    };
    CollateralDetail?: {
      SupportingResource?: {
        ResourceVersion?: { ResourceLink?: string }[];
      }[];
    };
  };
  summary?: {
    isbn?: string;
    title?: string;
    author?: string;
    publisher?: string;
    cover?: string;
    pubdate?: string;
  };
};

type Enriched = {
  isbn: string;
  title?: string;
  author?: string;
  publisher?: string;
  coverUrl?: string;
  pubdate?: string;
  source: "openbd" | "ndl" | "none";
  fetchedAt: string;
};

async function fetchOpenBd(isbn: string): Promise<Enriched | null> {
  const res = await fetch(`https://api.openbd.jp/v1/get?isbn=${isbn}`);
  if (!res.ok) return null;
  const data = (await res.json()) as (OpenBdResponse | null)[];
  const entry = data?.[0];
  if (!entry || !entry.summary) return null;
  const s = entry.summary;
  return {
    isbn,
    title: s.title,
    author: s.author,
    publisher: s.publisher,
    coverUrl: s.cover,
    pubdate: s.pubdate,
    source: "openbd",
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchNdl(isbn: string): Promise<Enriched | null> {
  // NDL Search SRU API
  // ref: https://iss.ndl.go.jp/information/api/api-lists/sru-api/
  const url = `https://iss.ndl.go.jp/api/sru?operation=searchRetrieve&query=isbn=${isbn}&recordSchema=dcndl_simple&maximumRecords=1`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const xml = await res.text();
  const title = /<dc:title>([^<]+)<\/dc:title>/.exec(xml)?.[1];
  const author = /<dc:creator>([^<]+)<\/dc:creator>/.exec(xml)?.[1];
  const publisher = /<dc:publisher>([^<]+)<\/dc:publisher>/.exec(xml)?.[1];
  if (!title) return null;
  return {
    isbn,
    title,
    author,
    publisher,
    source: "ndl",
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchOne(isbn: string): Promise<Enriched> {
  const cleaned = isbn.replace(/[-\s]/g, "");
  console.log(`[sync] ${cleaned} …`);
  try {
    const fromOpenBd = await fetchOpenBd(cleaned);
    if (fromOpenBd) return fromOpenBd;
  } catch (e) {
    console.warn(`  openBD error: ${(e as Error).message}`);
  }
  // NDL fallback - 1秒待機
  await new Promise((r) => setTimeout(r, 1100));
  try {
    const fromNdl = await fetchNdl(cleaned);
    if (fromNdl) return fromNdl;
  } catch (e) {
    console.warn(`  NDL error: ${(e as Error).message}`);
  }
  return {
    isbn: cleaned,
    source: "none",
    fetchedAt: new Date().toISOString(),
  };
}

async function loadIsbnList(args: string[]): Promise<string[]> {
  const fileIdx = args.indexOf("--file");
  if (fileIdx >= 0 && args[fileIdx + 1]) {
    const content = await readFile(args[fileIdx + 1], "utf8");
    return content
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return args.filter((a) => /^\d{10,13}$/.test(a.replace(/[-\s]/g, "")));
}

async function main() {
  const isbns = await loadIsbnList(process.argv.slice(2));
  if (isbns.length === 0) {
    console.error("usage: tsx scripts/sync-textbooks.ts <isbn>...");
    console.error("       tsx scripts/sync-textbooks.ts --file isbn-list.txt");
    process.exit(1);
  }

  const results: Enriched[] = [];
  for (const isbn of isbns) {
    const r = await fetchOne(isbn);
    results.push(r);
    console.log(
      `  ${r.source.padEnd(6)} ${r.title ?? "(not found)"} — ${r.publisher ?? ""}`,
    );
    // openBDは厳密なレートリミットなしだが礼儀程度に待つ
    await new Promise((r) => setTimeout(r, 200));
  }

  const outDir = resolve(process.cwd(), "seed");
  if (!existsSync(outDir)) await mkdir(outDir, { recursive: true });

  const rawPath = resolve(outDir, "textbooks_raw.json");
  await writeFile(rawPath, JSON.stringify(results, null, 2));

  const enrichmentPath = resolve(outDir, "textbooks_enrichment.json");
  const enrichment = results.reduce<Record<string, Enriched>>((acc, r) => {
    if (r.title) acc[r.isbn] = r;
    return acc;
  }, {});
  await writeFile(enrichmentPath, JSON.stringify(enrichment, null, 2));

  const found = results.filter((r) => r.source !== "none").length;
  console.log(`\n✓ ${found}/${results.length} 件取得`);
  console.log(`  → ${rawPath}`);
  console.log(`  → ${enrichmentPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
