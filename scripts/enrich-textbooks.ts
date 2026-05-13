// Phase B: 主要 200 冊について AI で目次・強み・推奨対象を生成
// 使い方: pnpm tsx scripts/enrich-textbooks.ts
//
// 前提:
//   - ANTHROPIC_API_KEY が環境変数に設定されていること
//   - scripts/top-priority-textbooks.ts の TOP_PRIORITY に対象が定義されていること
//   - src/lib/master/textbooks-bulk.ts が生成済み (Phase A の出力)
//
// 出力: src/lib/master/textbooks-enriched.ts
//   各エントリに次のフィールドを追加:
//     - tableOfContents (AI 生成、confidence 付き)
//     - strengths (3-5 個)
//     - weaknesses (2-3 個)
//     - recommendedFor (対象学年・偏差値帯)
//     - estimatedHours (1 周にかかる目安)

import { writeFile } from "node:fs/promises";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { TOP_PRIORITY, type PriorityTextbook } from "./top-priority-textbooks";

const OUTPUT_PATH = path.resolve(
  process.cwd(),
  "src/lib/master/textbooks-enriched.ts",
);

const MODEL = "claude-sonnet-4-5";
const BATCH_SIZE = 5; // 並列数
const DELAY_MS = 1500; // バッチ間ディレイ (rate limit 対策)

type EnrichmentResult = {
  rank: number;
  title: string;
  publisher: string;
  // AI 生成データ
  tableOfContents: { section: string; items: string[]; confidence: "high" | "medium" | "low" }[];
  strengths: string[];
  weaknesses: string[];
  recommendedFor: string;
  estimatedHours: number;
  // ハルシネーション対策
  overallConfidence: "high" | "medium" | "low";
  notes: string;
};

const SYSTEM_PROMPT = `あなたは日本の大学受験参考書に詳しい学習コーチです。
指定された参考書について、目次・強み・推奨対象などを正確な JSON で返してください。

# 厳守ルール

1. **知らない本は知らないと言う**: その本を確実に知っている場合のみ詳細を書く。曖昧な記憶で書かない。
2. **confidence の使い分け**:
   - high: 内容を完全に把握しており、目次・特徴・対象が正確に答えられる
   - medium: シリーズ・著者・形式は分かるが、具体的な章立ては自信がない部分がある
   - low: 名前は聞いたことがあるが詳細は不明。最低限の情報のみ。
3. **目次 (tableOfContents)**:
   - 章レベルで分け、各章の主要トピックを 3-6 個列挙
   - 知らない場合は空配列でも良い (overallConfidence: "low")
4. **strengths**: 「網羅性が高い」のような抽象表現は禁止。「例題 1000 問超で入試範囲を網羅」のように具体的に。
5. **recommendedFor**: 学年 + 偏差値帯 + 志望校レベル + 学習段階の 4 要素を含む。例: 「高2-3、偏差値55-65、MARCH-早慶志望、基礎は固まっているが応用が手薄な受験生」
6. **estimatedHours**: 1 周にかかる目安時間 (時間単位、整数)。問題集なら 30-100、参考書なら 15-50 が典型。

# 出力スキーマ

{
  "tableOfContents": [
    { "section": "章名", "items": ["項目1", "項目2", "..."], "confidence": "high"|"medium"|"low" }
  ],
  "strengths": ["強み1", "強み2", "強み3"],
  "weaknesses": ["弱点1", "弱点2"],
  "recommendedFor": "対象を具体的に1文で",
  "estimatedHours": 30,
  "overallConfidence": "high"|"medium"|"low",
  "notes": "知識の範囲・注意点を1文で"
}

JSON のみで返す。前置きや後置きの文章は禁止。`;

function buildUserPrompt(t: PriorityTextbook): string {
  return `参考書情報:
- タイトル: ${t.title}
- 出版社: ${t.publisher}
- 想定科目: ${t.subject}${t.detailSubject ? ` / ${t.detailSubject}` : ""}
- 難易度帯: ${t.level}
${t.series ? `- シリーズ: ${t.series}` : ""}
${t.notes ? `- 注記: ${t.notes}` : ""}

この本について、上記スキーマで JSON 1 つだけ返してください。`;
}

async function enrichOne(
  client: Anthropic,
  t: PriorityTextbook,
): Promise<EnrichmentResult | null> {
  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      temperature: 0.2,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(t) }],
    });

    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const candidate = fenced ? fenced[1] : text;
    const m = candidate.match(/\{[\s\S]*\}/);
    if (!m) {
      console.warn(`[skip] ${t.rank}. ${t.title}: JSON not found`);
      return null;
    }
    const parsed = JSON.parse(m[0]);
    return {
      rank: t.rank,
      title: t.title,
      publisher: t.publisher,
      tableOfContents: Array.isArray(parsed.tableOfContents) ? parsed.tableOfContents : [],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      recommendedFor: typeof parsed.recommendedFor === "string" ? parsed.recommendedFor : "",
      estimatedHours:
        typeof parsed.estimatedHours === "number" ? parsed.estimatedHours : 30,
      overallConfidence: parsed.overallConfidence ?? "medium",
      notes: typeof parsed.notes === "string" ? parsed.notes : "",
    };
  } catch (e) {
    console.error(`[error] ${t.rank}. ${t.title}:`, e instanceof Error ? e.message : e);
    return null;
  }
}

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY が設定されていません。");
    process.exit(1);
  }
  const client = new Anthropic({ apiKey });

  console.log(`📚 ${TOP_PRIORITY.length} 冊の AI 深掘り開始...`);
  const results: EnrichmentResult[] = [];

  for (let i = 0; i < TOP_PRIORITY.length; i += BATCH_SIZE) {
    const batch = TOP_PRIORITY.slice(i, i + BATCH_SIZE);
    console.log(`バッチ ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(TOP_PRIORITY.length / BATCH_SIZE)}`);

    const batchResults = await Promise.all(
      batch.map((t) => enrichOne(client, t)),
    );
    for (const r of batchResults) {
      if (r) results.push(r);
    }

    if (i + BATCH_SIZE < TOP_PRIORITY.length) {
      await delay(DELAY_MS);
    }
  }

  // 信頼度別の件数
  const byConfidence = results.reduce(
    (acc, r) => ({ ...acc, [r.overallConfidence]: (acc[r.overallConfidence] ?? 0) + 1 }),
    {} as Record<string, number>,
  );
  console.log("✅ 完了");
  console.log("   信頼度内訳:", byConfidence);
  console.log("   合計:", results.length, "冊");

  // master の textbookCurationKey と同じ正規化ロジックで key を生成
  const normKey = (title: string, publisher: string) => {
    const norm = (s: string) =>
      s
        .replace(/\s+/g, "")
        .replace(/[「」『』\(\)（）【】]/g, "")
        .toLowerCase();
    return `${norm(title)}:::${norm(publisher)}`;
  };

  // master/textbooks/index.ts から探せる Map<key, enrichment> 形式で出力
  const enrichmentMap: Record<string, typeof results[number]> = {};
  for (const r of results) {
    enrichmentMap[normKey(r.title, r.publisher)] = r;
  }

  const lines = [
    "// Auto-generated by scripts/enrich-textbooks.ts",
    "// 主要参考書の AI 深掘りデータ。手で編集しないこと。",
    "// 信頼度 low のものは UI で「ユーザー編集待ち」表示にする。",
    "// master/textbooks/index.ts の getAllTextbooks() が title+publisher 正規化キーでマージする。",
    "",
    "export type EnrichedTextbook = {",
    "  rank: number;",
    "  title: string;",
    "  publisher: string;",
    "  tableOfContents: { section: string; items: string[]; confidence: 'high' | 'medium' | 'low' }[];",
    "  strengths: string[];",
    "  weaknesses: string[];",
    "  recommendedFor: string;",
    "  estimatedHours: number;",
    "  overallConfidence: 'high' | 'medium' | 'low';",
    "  notes: string;",
    "};",
    "",
    `export const TEXTBOOKS_ENRICHED: EnrichedTextbook[] = ${JSON.stringify(results, null, 2)};`,
    "",
    `export const TEXTBOOKS_ENRICHED_BY_KEY: Record<string, EnrichedTextbook> = ${JSON.stringify(enrichmentMap, null, 2)};`,
    "",
  ];

  await writeFile(OUTPUT_PATH, lines.join("\n"), "utf-8");
  console.log(`📝 ${OUTPUT_PATH} に書き出し完了`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
