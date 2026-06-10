import { NextResponse } from "next/server";
import { diagnose, fallbackDiagnosisPublic } from "@/lib/diagnose";
import type { TestInput } from "@/lib/types";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

// 異常な大きさの入力を弾く (AI に流すトークン量の上限)
function capInput(input: TestInput): TestInput {
  return {
    ...input,
    units: Array.isArray(input.units) ? input.units.slice(0, 30) : input.units,
    textbooks: Array.isArray(input.textbooks) ? input.textbooks.slice(0, 30) : input.textbooks,
    subjects: Array.isArray(input.subjects) ? input.subjects.slice(0, 15) : input.subjects,
    history: input.history
      ? {
          pastTests: Array.isArray(input.history.pastTests)
            ? input.history.pastTests.slice(0, 20)
            : undefined,
          recentBlockLogs: Array.isArray(input.history.recentBlockLogs)
            ? input.history.recentBlockLogs.slice(0, 100)
            : undefined,
          bookshelf: Array.isArray(input.history.bookshelf)
            ? input.history.bookshelf.slice(0, 30)
            : undefined,
        }
      : input.history,
  };
}

export async function POST(req: Request) {
  const rl = rateLimit(`diagnose:${clientIp(req)}`, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  let input: TestInput | null = null;
  try {
    input = capInput((await req.json()) as TestInput);
    const out = await diagnose(input);
    return NextResponse.json({ ok: true, diagnosis: out });
  } catch (e) {
    console.error("[diagnose] failed", e);
    // フォールバックを返す: API失敗でもユーザーが進めるように
    if (input) {
      try {
        const fallback = fallbackDiagnosisPublic(input);
        return NextResponse.json({
          ok: true,
          diagnosis: fallback,
          degraded: true,
        });
      } catch {
        /* swallow */
      }
    }
    return NextResponse.json(
      { ok: false, error: "diagnose_failed" },
      { status: 500 },
    );
  }
}
