import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { checkRateLimit, tooManyRequests } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const rl = checkRateLimit(req, { name: "waitlist", limit: 5, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfter);
  try {
    const body = (await req.json()) as { email?: string };
    const email = (body.email ?? "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }

    const dir = path.join(process.cwd(), ".data");
    await fs.mkdir(dir, { recursive: true });
    const file = path.join(dir, "waitlist.jsonl");
    const line = JSON.stringify({ email, at: new Date().toISOString() }) + "\n";
    await fs.appendFile(file, line, "utf8");

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
