import { NextResponse } from "next/server";
import { diagnose, fallbackDiagnosisPublic } from "@/lib/diagnose";
import type { TestInput } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  let input: TestInput | null = null;
  try {
    input = (await req.json()) as TestInput;
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
