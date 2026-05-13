import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { ChatMessage } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM_PROMPT =
  "あなたは Testall の AI 学習コーチ Sara です。受験生の計画調整・励まし・科目相談に答えます。" +
  "回答は簡潔かつ具体的に、敬語で、200文字以内を目安にしてください。";

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "api_not_configured" }, { status: 503 });
  }

  try {
    const body = (await req.json()) as {
      history: ChatMessage[];
      userMessage: string;
    };

    const client = new Anthropic({ apiKey });

    const messages: Anthropic.MessageParam[] = [
      ...body.history.slice(-10).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: body.userMessage },
    ];

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages,
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ ok: true, text });
  } catch (e) {
    console.error("[chat] failed", e);
    return NextResponse.json({ ok: false, error: "chat_failed" }, { status: 500 });
  }
}
