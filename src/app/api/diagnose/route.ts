import { NextResponse } from "next/server";
import { diagnose, fallbackDiagnosisPublic } from "@/lib/diagnose";
import type { TestInput } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  let input: TestInput | null = null;
  try {
    input = (await req.json()) as TestInput;
    // 最低限の入力検証 (フォームからは満たされるが、外部呼びで欠落していると
    // diagnose 内で TypeError を吐くので事前に 400 で返す)
    if (
      !input ||
      typeof input !== "object" ||
      !Array.isArray(input.units) ||
      typeof input.subject !== "string"
    ) {
      return NextResponse.json(
        { ok: false, error: "invalid_input" },
        { status: 400 },
      );
    }
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
