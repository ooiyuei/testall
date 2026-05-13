import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `あなたは日本の受験生のテスト答案を読み取る AI です。画像から以下を抽出して JSON のみで返してください。前置きや後置きの文章は一切書かない。

{
  "subject": "数学" | "英語" | "国語" | "理科" | "社会",
  "testName": "テスト名（推測）",
  "score": 採点された得点（数値）,
  "fullScore": 満点（数値、不明なら100）,
  "units": [{ "unit": "単元名", "correct": 正答数（数値）, "total": 設問数（数値）, "cause": "knowledge" | "understanding" | "time" | "careless" | null }]
}

抽出できない項目は null または省略する。`;

export type VisionResult = {
  subject: string;
  testName: string;
  score: number;
  fullScore: number;
  units: {
    unit: string;
    correct: number;
    total: number;
    cause: "knowledge" | "understanding" | "time" | "careless" | null;
  }[];
};

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "api_key_not_configured" },
      { status: 503 },
    );
  }

  let base64Data: string;
  let mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("image");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "image_required" },
        { status: 400 },
      );
    }
    const mimeType = file.type as typeof mediaType;
    if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(mimeType)) {
      return NextResponse.json(
        { ok: false, error: "unsupported_image_type" },
        { status: 400 },
      );
    }
    mediaType = mimeType;
    const buffer = await file.arrayBuffer();
    base64Data = Buffer.from(buffer).toString("base64");
  } else {
    const body = (await req.json()) as { image?: string; mediaType?: string };
    if (!body.image) {
      return NextResponse.json(
        { ok: false, error: "image_required" },
        { status: 400 },
      );
    }
    base64Data = body.image;
    mediaType = (body.mediaType as typeof mediaType) ?? "image/jpeg";
  }

  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64Data },
            },
            {
              type: "text",
              text: "このテスト答案を分析して、指定のJSONフォーマットで返してください。",
            },
          ],
        },
      ],
    });

    const rawText = msg.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { ok: false, error: "parse_failed" },
        { status: 500 },
      );
    }

    const result = JSON.parse(jsonMatch[0]) as VisionResult;
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    console.error("[diagnose-from-image] failed", e);
    return NextResponse.json(
      { ok: false, error: "vision_failed" },
      { status: 500 },
    );
  }
}
