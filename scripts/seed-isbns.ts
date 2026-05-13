// 受験参考書の ISBN を NDL OpenSearch から大量に収集する。
// 出版社×シリーズ名のクエリでループし、結果から ISBN を抜き出して
// seed/isbns.json に保存する。
//
// 実行: pnpm sync:isbns
//
// 出典: 国立国会図書館サーチ OpenSearch
//   https://ndlsearch.ndl.go.jp/api/opensearch
//
// 注意:
// - レート制限: 秒間 5 req 程度を上限とする (200ms スリープ)
// - cnt=200 で 1 ページ最大 200 件取得
// - 13 桁 ISBN を優先、10 桁しかない古い書誌は除外
// - 重複は ISBN ベースで除去

import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { XMLParser } from "fast-xml-parser";

const NDL_ENDPOINT = "https://ndlsearch.ndl.go.jp/api/opensearch";
const SLEEP_MS = 220; // 秒 ~4.5 req
const PER_PAGE = 200;

// 受験参考書を網羅するためのクエリ群。
// 大まかに「出版社 × シリーズ名」「ジャンル × キーワード」で叩く。
// 順序はノイズの少なそうな具体的クエリから。
const QUERIES: string[] = [
  // 数研出版 数学
  "チャート式 基礎からの数学",
  "チャート式 解法と演習",
  "チャート式 基礎と演習",
  "チャート式 数学",
  "数学 重要問題集 数研",
  "ニューグローバル 数学",
  "リードα 数学",
  "リードα 物理",
  "リードα 化学",
  "リードα 生物",
  "サクシード 数学",
  "クリアー 数学",
  "4STEP 数学",
  // 啓林館
  "Focus Gold",
  "Focus Z",
  // 旺文社
  "ターゲット 英単語",
  "英単語ターゲット",
  "英熟語ターゲット",
  "英文法ターゲット",
  "基礎問題精講",
  "標準問題精講",
  "入門問題精講",
  "全レベル問題集 英語",
  "全レベル問題集 数学",
  "全レベル問題集 古文",
  "全レベル問題集 現代文",
  "全レベル問題集 化学",
  "全レベル問題集 物理",
  "大学入試問題集 旺文社",
  "百式英単語",
  // 河合出版
  "やっておきたい英語長文",
  "やっておきたい英語長文 300",
  "やっておきたい英語長文 500",
  "やっておきたい英語長文 700",
  "やっておきたい英語長文 1000",
  "文系数学の良問プラチカ",
  "理系数学の良問プラチカ",
  "良問の風 物理",
  "名問の森 物理",
  "物理のエッセンス",
  "化学の良問問題集",
  "化学頻出 スタンダード",
  "マーク式総合問題集 河合",
  "実戦模試演習 河合",
  // 東進ブックス
  "東進 一問一答",
  "システム英単語",
  "シス単 駿台",
  "金谷の日本史",
  "ハイレベル 数学",
  "今井の英文法教室",
  "安河内の英語",
  "東進 共通テスト 過去問",
  // Z会
  "速読英単語",
  "速読英熟語",
  "速読英文法",
  "Z会 実戦問題集",
  "英作文のトレーニング",
  "リンガメタリカ",
  "Z会 数学 入試問題集",
  "Z会 古文上達",
  // KADOKAWA
  "はじめからていねいに",
  "面白いほどわかる本",
  "実況中継",
  "きめる 共通テスト",
  // 教学社
  "赤本",
  "難関校過去問シリーズ",
  "共通テスト 過去問 教学社",
  "センター試験 過去問 教学社",
  "教学社 大学入試シリーズ",
  // 駿台文庫
  "駿台 Top Grade",
  "数学の真髄",
  "中堅私大",
  "駿台 入試英語",
  "英文解釈の技術 100",
  "基礎英文解釈の技術",
  "ポレポレ英文読解",
  "ビジュアル英文解釈",
  "新・基本英文700選",
  // 桐原書店
  "ネクステージ NextStage",
  "Vintage 英文法",
  "頻出英文法・語法",
  "Forest 桐原",
  "Evergreen 桐原",
  "桐原 英文法",
  "英頻 桐原",
  "解体英熟語",
  // 東京出版
  "1対1対応の演習",
  "大学への数学",
  "新数学スタンダード演習",
  "新数学演習",
  "解法の探求",
  "微積分基礎の極意",
  "新スタンダード演習",
  "東京出版 数学",
  // 三省堂
  "化学の新研究",
  "化学の新演習",
  "化学の新標準演習",
  // 学研
  "ハイパートレーニング",
  "英語長文ハイパートレーニング",
  "学研 英語",
  "英文読解の透視図",
  // 第一学習社
  "セミナー 化学",
  "セミナー 物理",
  "セミナー 生物",
  "第一学習社 リードα",
  // 数研出版 理科
  "化学重要問題集",
  "物理重要問題集",
  "生物重要問題集",
  // 古文・漢文
  "古文単語ゴロゴ",
  "古文単語315",
  "565 古文単語",
  "マドンナ古文",
  "望月光の古文",
  "ステップアップノート 古典文法",
  "富井の古典文法",
  "漢文ヤマのヤマ",
  "漢文早覚え速答法",
  "土屋の古文",
  // 現代文
  "現代文 アクセス",
  "入試現代文へのアクセス",
  "現代文と格闘する",
  "船口のゼロから読み解く",
  "出口 現代文",
  "得点奪取 現代文",
  // 英語
  "DUO 3.0",
  "鉄壁",
  "鉄緑会 英単語",
  "英単語 Stock",
  "LEAP 英単語",
  "ユメタン",
  "キクタン",
  "速読英単語 必修編",
  "速読英単語 上級編",
  "リープ英単語",
  "リープ 旺文社",
  "音読英単語",
  "東大英単語",
  "英作文 ハイパートレーニング",
  "ドラゴンイングリッシュ",
  // 社会
  "山川 詳説日本史",
  "山川 詳説世界史",
  "山川 一問一答",
  "実況中継 日本史",
  "実況中継 世界史",
  "ナビゲーター世界史",
  "石川晶康 日本史",
  "斎藤の世界史",
  "村瀬の世界史",
  "東進 日本史 金谷",
  "東進 世界史 荒巻",
  "地理 山岡",
  "瀬川の地理",
  "倫理 政治経済 蔭山",
  "畠山のスパッとわかる",
  "現代社会 共通テスト",
  // 物理
  "物理のエッセンス 力学",
  "物理のエッセンス 波動",
  "為近の物理",
  "難系 物理",
  "難問題の系統とその解き方",
  "漆原の物理",
  "宇宙一わかりやすい物理",
  // 化学
  "宇宙一わかりやすい化学",
  "鎌田の化学",
  "福間の無機化学",
  "鎌田の有機化学",
  "化学計算の考え方",
  "DOシリーズ 化学",
  // 生物
  "大森徹の最強講義",
  "大森徹の最強問題集",
  "生物 田部",
  "生物 基礎問題精講",
  // 数学
  "やさしい理系数学",
  "ハイレベル理系数学",
  "数学 標準問題精講",
  "数学 上級問題精講",
  "理系数学の良問プラチカ 数学III",
  "数学 入試の核心",
  "数学I・A 入試問題集",
  "プレ大学への数学",
  "総合的研究 数学",
  // 共通テスト対策
  "共通テスト 予想問題集",
  "共通テスト 過去問",
  "共通テスト 実戦問題集",
  "共通テスト 対策 数学",
  "共通テスト 対策 英語",
  "共通テスト 対策 国語",
  "共通テスト 対策 物理",
  "共通テスト 対策 化学",
  "共通テスト 対策 生物",
  "共通テスト 対策 日本史",
  "共通テスト 対策 世界史",
  "共通テスト 対策 地理",
  // 英文法・構文
  "英文法 レベル別問題集",
  "英文法ファイナル問題集",
  "英文法・語法 良問",
  "頻出英文法・語法問題",
  "英文法 スクランブル",
  "英文法 解体英熟語",
  "Z会 英文法",
  "総合英語 Be",
  "総合英語 Forest",
  "Roundabout 総合英語",
  "アトラス 総合英語",
  // 情報
  "情報I 共通テスト",
  "情報 参考書",
  "高校 情報",
];

type RssItem = {
  title?: string;
  author?: string;
  "dc:publisher"?: string;
  "dc:date"?: string | { "#text"?: string };
  "dc:extent"?: string;
  "dc:identifier"?: NdlIdentifier | NdlIdentifier[];
};

type NdlIdentifier =
  | { "@_xsi:type"?: string; "#text"?: string }
  | string;

type SeedRecord = {
  isbn: string;
  rawTitle?: string;
  rawPublisher?: string;
  rawAuthor?: string;
  rawExtent?: string;
  rawDate?: string;
  fromQuery: string;
};

function extractIsbn(item: RssItem): string | null {
  const raw = item["dc:identifier"];
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  for (const id of list) {
    if (typeof id === "string") {
      const cleaned = id.replace(/[-\s]/g, "");
      if (/^\d{13}$/.test(cleaned)) return cleaned;
      continue;
    }
    const type = id["@_xsi:type"];
    const text = id["#text"];
    if (
      typeof text === "string" &&
      (type === "dcndl:ISBN" || (!type && /\d{10,13}/.test(text)))
    ) {
      const cleaned = text.replace(/[-\s]/g, "");
      if (/^\d{13}$/.test(cleaned)) return cleaned;
    }
  }
  return null;
}

function asText(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "#text" in (v as Record<string, unknown>)) {
    const t = (v as Record<string, unknown>)["#text"];
    return typeof t === "string" ? t : undefined;
  }
  return undefined;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  isArray: (name) => name === "item" || name === "dc:identifier",
});

async function fetchNdl(query: string, page = 1): Promise<RssItem[]> {
  const start = (page - 1) * PER_PAGE + 1;
  const url = `${NDL_ENDPOINT}?cnt=${PER_PAGE}&title=${encodeURIComponent(
    query,
  )}&idx=${start}`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    console.warn(`  NDL ${res.status}: ${query}`);
    return [];
  }
  const xml = await res.text();
  try {
    const parsed = parser.parse(xml);
    const items = parsed?.rss?.channel?.item;
    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  } catch (e) {
    console.warn(`  parse error: ${(e as Error).message}`);
    return [];
  }
}

async function main() {
  const seen = new Map<string, SeedRecord>();
  let queryIdx = 0;
  for (const q of QUERIES) {
    queryIdx++;
    let added = 0;
    try {
      const items = await fetchNdl(q, 1);
      for (const it of items) {
        const isbn = extractIsbn(it);
        if (!isbn) continue;
        if (seen.has(isbn)) continue;
        const dateRaw = it["dc:date"];
        const date =
          typeof dateRaw === "string" ? dateRaw : dateRaw?.["#text"];
        seen.set(isbn, {
          isbn,
          rawTitle: asText(it.title),
          rawPublisher: asText(it["dc:publisher"]),
          rawAuthor: asText(it.author),
          rawExtent: asText(it["dc:extent"]),
          rawDate: date,
          fromQuery: q,
        });
        added++;
      }
    } catch (e) {
      console.warn(`  error on "${q}": ${(e as Error).message}`);
    }
    console.log(
      `[${queryIdx}/${QUERIES.length}] "${q}" +${added} (total ${seen.size})`,
    );
    await new Promise((r) => setTimeout(r, SLEEP_MS));
  }

  const outDir = resolve(process.cwd(), "seed");
  if (!existsSync(outDir)) await mkdir(outDir, { recursive: true });
  const outPath = resolve(outDir, "isbns.json");
  const records = [...seen.values()];
  await writeFile(outPath, JSON.stringify(records, null, 2));

  console.log(`\n✓ ${records.length} ISBN を ${outPath} に保存`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
