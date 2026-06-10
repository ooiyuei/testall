import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { ChatMessage } from "@/lib/store";
import { getChatCache, setChatCache } from "@/lib/chat-cache";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM_PROMPT_BASE =
  "あなたは Testall の AI 学習コーチ Sara です。受験生の計画調整・励まし・科目相談に答えます。\n" +
  "回答は簡潔かつ具体的に、敬語で、200文字以内を目安にしてください。\n" +
  "ユーザーの学年・志望校・直近テスト結果が与えられている場合は、それを踏まえて作戦を具体化します。\n" +
  "精神論ではなく、具体的な参考書名や時間配分・25分ブロックでの行動を返してください。";

type ChatContext = {
  grade?: string;
  deviation?: number;
  targetUniversity?: string;
  examDate?: string;
  latestTest?: {
    subject: string;
    testName: string;
    scorePct: number | null;
    weakUnits?: string[];
  } | null;
  recentBlocks14d?: number;
};

function buildSystemBlocks(ctx?: ChatContext): Anthropic.TextBlockParam[] {
  const baseBlock: Anthropic.TextBlockParam = {
    type: "text",
    text: SYSTEM_PROMPT_BASE,
    cache_control: { type: "ephemeral" },
  };

  if (!ctx) return [baseBlock];

  const lines: string[] = ["# ユーザーの最新状況"];
  if (ctx.grade) lines.push(`- 学年: ${ctx.grade}`);
  if (typeof ctx.deviation === "number")
    lines.push(`- 現在の偏差値 (おおよそ): ${ctx.deviation}`);
  if (ctx.targetUniversity) lines.push(`- 第1志望: ${ctx.targetUniversity}`);
  if (ctx.examDate) lines.push(`- 本番日: ${ctx.examDate}`);
  if (ctx.latestTest) {
    const t = ctx.latestTest;
    lines.push(
      `- 直近テスト: ${t.subject} ${t.testName} ${
        t.scorePct !== null ? `(${t.scorePct}%)` : ""
      }`,
    );
    if (t.weakUnits && t.weakUnits.length > 0)
      lines.push(`- 苦手単元: ${t.weakUnits.join("・")}`);
  }
  if (typeof ctx.recentBlocks14d === "number")
    lines.push(`- 直近14日の完了ブロック: ${ctx.recentBlocks14d}`);

  return [
    baseBlock,
    { type: "text", text: lines.join("\n") },
  ];
}

function fallbackReply(userMessage: string): string {
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
  let body: {
    history: ChatMessage[];
    userMessage: string;
    context?: ChatContext;
  } | null = null;
  try {
    body = (await req.json()) as {
      history: ChatMessage[];
      userMessage: string;
      context?: ChatContext;
    };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  if (typeof body.userMessage !== "string" || !body.userMessage.trim()) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  if (body.userMessage.length > 2000) {
    return NextResponse.json({ ok: false, error: "message_too_long" }, { status: 400 });
  }
  if (!Array.isArray(body.history)) body.history = [];

  // 匿名アクセスでの API クォータ焼き尽くし防止
  const rl = rateLimit(`chat:${clientIp(req)}`, { limit: 20, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  // API キー無し → フォールバックを返す
  if (!apiKey) {
    return NextResponse.json({
      ok: true,
      text: fallbackReply(body.userMessage),
      degraded: true,
    });
  }

  // キャッシュヒット確認 (5分以内の同一質問+コンテキスト)
  const cached = getChatCache(body.userMessage, body.context);
  if (cached) {
    return NextResponse.json({ ok: true, text: cached, cached: true });
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
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system: buildSystemBlocks(body.context),
      messages,
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    if (text) {
      setChatCache(body.userMessage, body.context, text);
    }

    return NextResponse.json({ ok: true, text });
  } catch (e) {
    console.error("[chat] failed", e);
    return NextResponse.json({
      ok: true,
      text: fallbackReply(body.userMessage),
      degraded: true,
    });
  }
}
