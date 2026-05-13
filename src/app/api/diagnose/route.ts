import { NextResponse } from "next/server";
import { diagnose } from "@/lib/diagnose";
import type { TestInput } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const input = (await req.json()) as TestInput;
    const out = await diagnose(input);
    return NextResponse.json({ ok: true, diagnosis: out });
  } catch (e) {
    console.error("[diagnose] failed", e);
    return NextResponse.json(
      { ok: false, error: "diagnose_failed" },
      { status: 500 },
    );
  }
}
