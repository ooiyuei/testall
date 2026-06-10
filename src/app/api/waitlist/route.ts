import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // 同一 IP からの連投でファイルを無限に肥大化させない
  const rl = rateLimit(`waitlist:${clientIp(req)}`, { limit: 5, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  try {
    const body = (await req.json()) as { email?: string };
    const email = (body.email ?? "").trim();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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
