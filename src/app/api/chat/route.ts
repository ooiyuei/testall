import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { ChatMessage } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM_PROMPT =
  "あなたは Testall の AI 学習コーチ Sara です。受験生の計画調整・励まし・科目相談に答えます。" +
  "回答は簡潔かつ具体的に、敬語で、200文字以内を目安にしてください。";

function fallbackReply(userMessage: string): string {
  const m = userMessage.toLowerCase();
  if (/次の25分|今日|何やる|なにやる|今やる/.test(userMessage)) {
    return "直近のテストで一番点数が低かった単元から取り組むのがおすすめです。25分タイマーを開始して、完了条件を 1 つに絞ってみてください。";
  }
  if (/苦手|わからない/.test(userMessage)) {
    return "苦手単元は『マイ』→各教科で確認できます。「知識不足」か「理解不足」かを切り分けると次の一手が決まります。";
  }
  if (/作戦|計画|スケジュール/.test(userMessage)) {
    return "今週は『計画』タブで目標ブロック数を確定 → 毎朝『気分』を入れて自動調整、の流れが続きやすいです。";
  }
  if (/志望校|ギャップ/.test(userMessage)) {
    return "現在の偏差値と志望校ボーダーの差から、必要週ブロック数が試算されます。『マイ』のレベルカードで確認できます。";
  }
  return "AI のリアルタイム応答は現在停止中です。テスト追加・25分タイマー・週次計画は問題なく使えます。具体的な質問があれば短く書いてみてください。";
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  let body: { history: ChatMessage[]; userMessage: string } | null = null;
  try {
    body = (await req.json()) as {
      history: ChatMessage[];
      userMessage: string;
    };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  // API キー無し → フォールバックを返す
  if (!apiKey) {
    return NextResponse.json({
      ok: true,
      text: fallbackReply(body.userMessage),
      degraded: true,
    });
  }

  try {
    const client = new Anthropic({ apiKey });

    const messages: Anthropic.MessageParam[] = [
      ...body.history.slice(-10).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: body.userMessage },
    ];

    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages,
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ ok: true, text });
  } catch (e) {
    console.error("[chat] failed", e);
    // 失敗時もフォールバック応答を返す
    return NextResponse.json({
      ok: true,
      text: fallbackReply(body.userMessage),
      degraded: true,
    });
  }
}
