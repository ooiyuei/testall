// 参考書 DB の bulk 取得スクリプト。
// seed/isbns.json の ISBN を入力に openBD と NDL を並列照会して
// src/lib/master/textbooks-bulk.ts を生成する。
//
// 実行: pnpm sync:textbooks
//
// マージ規則:
// - title       : openBD 優先 → NDL → fromQuery 名
// - publisher   : openBD 優先 → NDL
// - author      : openBD 優先 → NDL
// - coverUrl    : openBD のみ (空なら null)
// - pages       : NDL の <dc:extent> から抽出
// - pubYear     : NDL → openBD
//
// 既存 src/lib/textbooks.ts の TEXTBOOKS は ISBN プロパティを持たないため
// 機械的な重複除去はできないが、master/textbooks/index.ts 側で既知の
// ISBN を BOOK_ENRICHMENT に入れているのでそこは除外する。
//
// 出典: openBD https://api.openbd.jp/ , NDL https://ndlsearch.ndl.go.jp/

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { XMLParser } from "fast-xml-parser";

type SeedRecord = {
  isbn: string;
  rawTitle?: string;
  rawPublisher?: string;
  rawAuthor?: string;
  rawExtent?: string;
  rawDate?: string;
  fromQuery: string;
};

type OpenBdEntry = {
  summary?: {
    isbn?: string;
    title?: string;
    author?: string;
    publisher?: string;
    cover?: string;
    pubdate?: string;
    series?: string;
    volume?: string;
  };
};

type Fetched = {
  isbn: string;
  title?: string;
  author?: string;
  publisher?: string;
  coverUrl?: string;
  pubYear?: string;
  pages?: number;
  series?: string;
  fromQuery: string;
};

const OPENBD_BATCH = 1000; // openBD は ?isbn=a,b,c,... を最大 1000 まで OK
const NDL_BATCH = 5; // NDL は秒 5 req 程度なので 5 並列
const NDL_BATCH_SLEEP = 1100; // 並列 5 件投げたら 1.1 秒待つ

// ─── openBD ────────────────────────────────
async function fetchOpenBdBatch(isbns: string[]): Promise<Map<string, Fetched>> {
  const out = new Map<string, Fetched>();
  if (isbns.length === 0) return out;
  const url = `https://api.openbd.jp/v1/get?isbn=${isbns.join(",")}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`openBD ${res.status}`);
    return out;
  }
  const data = (await res.json()) as (OpenBdEntry | null)[];
  for (let i = 0; i < isbns.length; i++) {
    const entry = data[i];
    const s = entry?.summary;
    if (!s) continue;
    out.set(isbns[i], {
      isbn: isbns[i],
      title: s.title || undefined,
      author: s.author || undefined,
      publisher: s.publisher || undefined,
      coverUrl: s.cover || undefined,
      pubYear: s.pubdate ? s.pubdate.slice(0, 4) : undefined,
      series: s.series || undefined,
      fromQuery: "",
    });
  }
  return out;
}

// ─── NDL ────────────────────────────────
const ndlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  isArray: (n) => n === "item" || n === "dc:identifier",
});

type NdlItem = {
  title?: string;
  author?: string;
  "dc:publisher"?: string | { "#text"?: string };
  "dc:date"?: string | { "#text"?: string };
  "dc:extent"?: string | { "#text"?: string };
};

function asText(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "#text" in (v as Record<string, unknown>)) {
    const t = (v as Record<string, unknown>)["#text"];
    return typeof t === "string" ? t : undefined;
  }
  return undefined;
}

function parsePages(extent?: string): number | undefined {
  if (!extent) return undefined;
  const m = /(\d+)\s*p/.exec(extent);
  if (!m) return undefined;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 && n < 4000 ? n : undefined;
}

async function fetchNdlByIsbn(isbn: string): Promise<NdlItem | null> {
  const url = `https://ndlsearch.ndl.go.jp/api/opensearch?isbn=${isbn}`;
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return null;
    const xml = await res.text();
    const parsed = ndlParser.parse(xml);
    const items = parsed?.rss?.channel?.item;
    if (!items) return null;
    const arr = Array.isArray(items) ? items : [items];
    return arr[0] ?? null;
  } catch {
    return null;
  }
}

async function ndlEnrichBatched(
  fetched: Map<string, Fetched>,
  allIsbns: string[],
) {
  let done = 0;
  for (let i = 0; i < allIsbns.length; i += NDL_BATCH) {
    const batch = allIsbns.slice(i, i + NDL_BATCH);
    await Promise.all(
      batch.map(async (isbn) => {
        const item = await fetchNdlByIsbn(isbn);
        if (!item) return;
        const cur = fetched.get(isbn) ?? {
          isbn,
          fromQuery: "",
        };
        cur.title = cur.title ?? asText(item.title);
        cur.author = cur.author ?? asText(item.author);
        cur.publisher = cur.publisher ?? asText(item["dc:publisher"]);
        const date = asText(item["dc:date"]);
        cur.pubYear = cur.pubYear ?? (date ? date.slice(0, 4) : undefined);
        const ext = asText(item["dc:extent"]);
        cur.pages = cur.pages ?? parsePages(ext);
        fetched.set(isbn, cur);
      }),
    );
    done += batch.length;
    if ((done / NDL_BATCH) % 10 === 0) {
      console.log(`  NDL ${done}/${allIsbns.length}`);
    }
    await new Promise((r) => setTimeout(r, NDL_BATCH_SLEEP));
  }
}

// ─── 推定ロジック ────────────────────────────────

function inferSubject(title: string): string {
  // 単語マッチで優先度の高い順に
  const t = title;
  if (/(数学|数Ⅰ|数Ⅱ|数Ⅲ|数IA|数IIB|数IIBC|数IIIC|チャート|Focus Gold|1対1対応|大学への数学|やさしい理系|ハイレベル理系|プラチカ)/.test(t))
    return "math";
  if (
    /(英単語|英熟語|英文法|英作文|英文解釈|英語長文|システム英単語|ターゲット|DUO|鉄壁|速読英|リスニング|英語|総合英語|NextStage|Vintage|Forest|Evergreen|ハイパートレーニング|ポレポレ|透視図|キクタン|ユメタン|LEAP|Stock)/.test(
      t,
    )
  )
    return "english";
  if (/(現代文|古文|漢文|国語|古典|現古漢|アクセス|出口|船口|ゴロゴ|マドンナ|ヤマのヤマ|早覚え)/.test(t))
    return "japanese";
  if (
    /(物理|化学|生物|地学|理科|エッセンス|良問の風|名問の森|新研究|新演習|セミナー|重要問題集|難系|宇宙一)/.test(
      t,
    )
  )
    return "science";
  if (
    /(日本史|世界史|地理|政治経済|政経|倫理|公民|現代社会|詳説日本史|詳説世界史|ナビゲーター|金谷|荒巻|山岡|蔭山)/.test(
      t,
    )
  )
    return "social";
  if (/(情報I|情報1|情報基礎|情報科学|情報処理|情報通信)/.test(t)) return "info";
  return "math"; // フォールバック (理系参考書が多いため)
}

function inferLevel(title: string): "basic" | "standard" | "advanced" | "top" {
  if (/(基礎|入門|はじめから|やさしい|初学|易|スタート)/.test(title)) return "basic";
  if (/(最難関|東大|京大|医学部|超難関|ハイレベル|難系|新演習|プラチカ III|やさしい理系数学.*III|赤チャート)/.test(title))
    return "top";
  if (/(難関|応用|発展|上級|標準問題精講|青チャート|Focus Gold|1対1対応|名問の森|新研究)/.test(title))
    return "advanced";
  return "standard";
}

function inferUsageTags(title: string): string[] {
  const tags: string[] = [];
  if (/(単語|熟語|ターゲット|シス単|DUO|キクタン|ユメタン|Stock|LEAP)/.test(title)) tags.push("vocab");
  if (/(問題集|精講|演習|実戦|プラチカ|重要問題集|過去問|赤本|セミナー|リードα|4STEP)/.test(title)) tags.push("drill");
  if (/(過去問|赤本)/.test(title)) tags.push("past-exam");
  if (/(チャート|Focus Gold|総合英語|新研究|詳説|完全攻略|総整理)/.test(title)) tags.push("comprehensive");
  if (/(実況中継|はじめからていねいに|面白いほど|入門|講義|読本|エッセンス)/.test(title)) tags.push("input");
  if (/(短期|要点|ポイント|薄め|スピード|10日|14日|20日)/.test(title)) tags.push("speed-run");
  if (/(模試|予想問題)/.test(title)) tags.push("mock-prep");
  if (tags.length === 0) tags.push("drill");
  return [...new Set(tags)];
}

function inferGrades(title: string): string[] {
  if (/(中学|中1|中2|中3)/.test(title)) return ["h1"]; // 中学向けは高1で使える
  if (/(高1|高一|1年|高校1年)/.test(title)) return ["h1"];
  if (/(高2|高二|2年|高校2年)/.test(title)) return ["h1", "h2"];
  if (/(浪人|大学受験|入試)/.test(title)) return ["h2", "h3", "ronin"];
  return ["h1", "h2", "h3", "ronin"]; // デフォルトは広めに
}

function slugFromIsbn(isbn: string, title: string): string {
  const titleSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
  return `tb-bulk-${isbn}${titleSlug ? `-${titleSlug}` : ""}`;
}

// ─── マスター textbooks の既知 ISBN を読む ────────────────
async function loadKnownIsbns(): Promise<Set<string>> {
  // 既存 master/textbooks/index.ts の BOOK_ENRICHMENT に書かれた ISBN を抽出する。
  // 文字列パースで OK (TypeScript の import はここでは重い)
  const known = new Set<string>();
  const masterPath = resolve(
    process.cwd(),
    "src/lib/master/textbooks/index.ts",
  );
  if (existsSync(masterPath)) {
    const src = await readFile(masterPath, "utf8");
    const re = /isbn:\s*"(\d{10,13})"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) known.add(m[1]);
  }
  // seed/textbooks_enrichment.json (parallel researcher の成果物) があれば取り込む
  const enrichPath = resolve(process.cwd(), "seed/textbooks_enrichment.json");
  if (existsSync(enrichPath)) {
    try {
      const j = JSON.parse(await readFile(enrichPath, "utf8")) as Record<
        string,
        unknown
      >;
      for (const k of Object.keys(j)) {
        const cleaned = k.replace(/[-\s]/g, "");
        if (/^\d{10,13}$/.test(cleaned)) known.add(cleaned);
      }
    } catch {
      /* skip */
    }
  }
  return known;
}

// ─── 出力生成 ────────────────────────────────

function escapeTsString(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type OutputBook = {
  id: string;
  isbn: string;
  name: string;
  author?: string;
  publisher: string;
  coverUrl?: string;
  subject: string;
  subjectDetail?: string;
  level: "basic" | "standard" | "advanced" | "top";
  forGrades: string[];
  usageTags: string[];
  description: string;
  source: "ndl" | "openbd" | "seed";
};

function renderOutput(books: OutputBook[]): string {
  const lines: string[] = [];
  lines.push("// AUTO-GENERATED by scripts/bulk-textbooks.ts");
  lines.push("// openBD + NDL OpenSearch から取得した参考書バルクデータ");
  lines.push("// 手書きの src/lib/textbooks.ts と src/lib/master/textbooks/index.ts は触らない");
  lines.push("//");
  lines.push(`// 生成日時: ${new Date().toISOString()}`);
  lines.push(`// 件数: ${books.length}`);
  lines.push("");
  lines.push('import type { Textbook } from "./types";');
  lines.push("");
  lines.push("export const TEXTBOOKS_BULK: Textbook[] = [");
  for (const b of books) {
    lines.push("  {");
    lines.push(`    id: "${escapeTsString(b.id)}",`);
    lines.push(`    isbn: "${b.isbn}",`);
    lines.push(`    name: "${escapeTsString(b.name)}",`);
    if (b.author) lines.push(`    author: "${escapeTsString(b.author)}",`);
    lines.push(`    publisher: "${escapeTsString(b.publisher)}",`);
    if (b.coverUrl) lines.push(`    coverUrl: "${escapeTsString(b.coverUrl)}",`);
    lines.push(`    subject: "${b.subject}",`);
    if (b.subjectDetail)
      lines.push(`    subjectDetail: "${escapeTsString(b.subjectDetail)}",`);
    lines.push(`    level: "${b.level}",`);
    lines.push(
      `    forGrades: [${b.forGrades.map((g) => `"${g}"`).join(", ")}],`,
    );
    lines.push(
      `    usageTags: [${b.usageTags.map((t) => `"${t}"`).join(", ")}],`,
    );
    lines.push(`    description: "${escapeTsString(b.description)}",`);
    lines.push(`    source: "${b.source}",`);
    lines.push("  },");
  }
  lines.push("];");
  lines.push("");
  return lines.join("\n");
}

// ─── main ────────────────────────────────

async function main() {
  const seedPath = resolve(process.cwd(), "seed/isbns.json");
  if (!existsSync(seedPath)) {
    console.error(`先に pnpm sync:isbns を実行してください: ${seedPath}`);
    process.exit(1);
  }
  const seed = JSON.parse(await readFile(seedPath, "utf8")) as SeedRecord[];
  console.log(`Seed ISBN: ${seed.length} 件`);

  const known = await loadKnownIsbns();
  console.log(`既知 ISBN (master + seed/enrichment): ${known.size} 件`);

  const candidates = seed.filter((r) => !known.has(r.isbn));
  console.log(`重複除外後の候補: ${candidates.length} 件`);

  const seedByIsbn = new Map(candidates.map((r) => [r.isbn, r]));

  // openBD: 1000 件単位でバッチ取得
  const fetched = new Map<string, Fetched>();
  const isbns = [...seedByIsbn.keys()];
  for (let i = 0; i < isbns.length; i += OPENBD_BATCH) {
    const slice = isbns.slice(i, i + OPENBD_BATCH);
    console.log(`openBD batch ${i + 1}-${i + slice.length}`);
    const result = await fetchOpenBdBatch(slice);
    for (const [k, v] of result) {
      v.fromQuery = seedByIsbn.get(k)?.fromQuery ?? "";
      fetched.set(k, v);
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  console.log(`openBD ヒット: ${fetched.size}/${isbns.length}`);

  // NDL: title が無いものだけ補完 (時間節約)。
  // title はあるが pages 不足のものは description に書くだけなので NDL は呼ばない。
  const needNdl = isbns.filter((isbn) => {
    const f = fetched.get(isbn);
    return !f || !f.title;
  });
  console.log(`NDL 補完対象 (title 無し): ${needNdl.length}`);
  await ndlEnrichBatched(fetched, needNdl);

  // 出力レコード組み立て
  const books: OutputBook[] = [];
  let noTitleCount = 0;
  for (const isbn of isbns) {
    const f = fetched.get(isbn);
    const seedRow = seedByIsbn.get(isbn);
    const title = f?.title ?? seedRow?.rawTitle;
    if (!title) {
      noTitleCount++;
      continue;
    }
    const publisher = f?.publisher ?? seedRow?.rawPublisher ?? "(不明)";
    const author = f?.author ?? seedRow?.rawAuthor;
    const pages = f?.pages ?? parsePages(seedRow?.rawExtent);
    const subject = inferSubject(title);
    const level = inferLevel(title);
    const usageTags = inferUsageTags(title);
    const forGrades = inferGrades(title);
    const description = [
      seedRow?.fromQuery ? `[${seedRow.fromQuery}]` : "",
      author ?? "",
      publisher,
      pages ? `${pages}p` : "",
      f?.pubYear ?? "",
    ]
      .filter(Boolean)
      .join(" / ");
    books.push({
      id: slugFromIsbn(isbn, title),
      isbn,
      name: title,
      author,
      publisher,
      coverUrl: f?.coverUrl,
      subject,
      level,
      forGrades,
      usageTags,
      description: description || "(取得失敗)",
      source: f?.coverUrl ? "openbd" : f?.title ? "openbd" : "ndl",
    });
  }
  console.log(`\n出力候補: ${books.length} 件 (タイトル取得失敗: ${noTitleCount})`);

  // 出力
  const outPath = resolve(
    process.cwd(),
    "src/lib/master/textbooks-bulk.ts",
  );
  await writeFile(outPath, renderOutput(books));
  console.log(`✓ ${outPath} に ${books.length} 件書き出し`);

  // サマリ
  const bySubject = books.reduce<Record<string, number>>((acc, b) => {
    acc[b.subject] = (acc[b.subject] ?? 0) + 1;
    return acc;
  }, {});
  console.log("\n科目別:");
  for (const [k, v] of Object.entries(bySubject).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(10)} ${v}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
