// 単体の参考書を AI で深掘り
// Phase B のスクリプトは ANTHROPIC_API_KEY を必要とするが、ローカルに無いユーザー向けに
// production API 経由でも 1 冊ずつ enrichment を取れるようにする。
//
// 使い方: POST /api/enrich-textbook { title, publisher, subject, detailSubject?, level }
// 返り値: { ok: true, enrichment: EnrichedTextbook }
//
// 注意: rate limit 対策で 1 リクエスト 1 冊。クライアント側で順次呼ぶ。

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

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

type Body = {
  title: string;
  publisher: string;
  subject?: string;
  detailSubject?: string;
  level?: string;
  series?: string;
};

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "api_key_not_configured" },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  if (!body.title || !body.publisher) {
    return NextResponse.json(
      { ok: false, error: "title_and_publisher_required" },
      { status: 400 },
    );
  }

  const userPrompt = [
    "参考書情報:",
    `- タイトル: ${body.title}`,
    `- 出版社: ${body.publisher}`,
    body.subject ? `- 想定科目: ${body.subject}${body.detailSubject ? ` / ${body.detailSubject}` : ""}` : "",
    body.level ? `- 難易度帯: ${body.level}` : "",
    body.series ? `- シリーズ: ${body.series}` : "",
    "",
    "この本について、上記スキーマで JSON 1 つだけ返してください。",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      temperature: 0.2,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const candidate = fenced ? fenced[1] : text;
    const m = candidate.match(/\{[\s\S]*\}/);
    if (!m) {
      return NextResponse.json(
        { ok: false, error: "parse_failed", raw: text.slice(0, 300) },
        { status: 500 },
      );
    }
    const parsed = JSON.parse(m[0]);

    return NextResponse.json({
      ok: true,
      enrichment: {
        title: body.title,
        publisher: body.publisher,
        ...parsed,
      },
    });
  } catch (e) {
    console.error("[enrich-textbook] failed", e);
    return NextResponse.json(
      { ok: false, error: "enrichment_failed" },
      { status: 500 },
    );
  }
}
