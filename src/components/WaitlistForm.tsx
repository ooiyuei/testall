"use client";

import { useState } from "react";
import { Button } from "./ui/Button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("メールアドレスの形式が正しくありません");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("failed");
      setDone(true);
    } catch {
      setError("登録に失敗しました。少し時間をおいて再度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-mint-200 bg-mint-50 px-5 py-4 text-left">
        <CheckCircle2 className="h-6 w-6 flex-none text-mint-500" />
        <div>
          <div className="text-sm font-black text-ink-900">先行登録完了</div>
          <div className="mt-0.5 text-xs text-ink-600">
            初月無料コードはローンチ時にお送りします。
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="メールアドレス（先行登録）"
        className="h-12 flex-1 rounded-full border border-cream-200 bg-white px-5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-sky-400 focus:outline-none"
        autoComplete="email"
      />
      <Button type="submit" disabled={loading} size="md">
        {loading ? "登録中..." : "先行登録"}
        <ArrowRight className="h-4 w-4" />
      </Button>
      {error && (
        <div className="mt-1 w-full text-left text-xs text-coral-500 sm:order-last">
          {error}
        </div>
      )}
    </form>
  );
}
