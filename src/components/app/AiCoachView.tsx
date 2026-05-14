"use client";

// AI コーチ専用フルスクリーン画面 — PDF「AI コーチ」スタイル
// 上: < AIコーチ ●オンライン
// 中: メッセージスレッド (assistant=cream bubble / user=black bubble)
// 下: クイックアクション 🍃ルートを見る ⏰25分はじめる 😊今日はやめる + 入力欄
//
// 既存 AiChat (HomeView 埋め込み版) と同じ /api/chat ロジックを使うが、
// レイアウトはフルスクリーン専用。

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mic, MicOff, Send } from "lucide-react";
import { useStore } from "@/lib/hooks/useStore";
import { addChatMessage } from "@/lib/store";
import type { ChatMessage } from "@/lib/store";
import { cn } from "@/lib/cn";

function newId(): string {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const QUICK_ACTIONS = [
  { emoji: "🍃", label: "ルートを見る", href: "/app/me" },
  { emoji: "⏰", label: "25分はじめる", href: "/app/focus/run" },
  { emoji: "😊", label: "今日はやめる", action: "today-off" as const },
];

// Window.SpeechRecognition / webkitSpeechRecognition は AiChat.tsx で宣言済み

export function AiCoachView() {
  const { state, hydrated } = useStore();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messages: ChatMessage[] = state.chatMessages ?? [];
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const recogRef = useRef<any>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, loading]);

  async function sendMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed || loading) return;
    setInput("");
    setError(null);
    setLoading(true);
    addChatMessage({ id: newId(), role: "user", content: trimmed, timestamp: new Date().toISOString() });
    try {
      const profile = state.profile;
      const latest = state.tests[0];
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          context: {
            grade: profile?.grade,
            target: profile?.target,
            latestTest: latest
              ? { subject: latest.input.subject, score: latest.input.score, fullScore: latest.input.fullScore }
              : null,
          },
        }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok || !data.reply) throw new Error(data.error || "AI 応答が取得できませんでした");
      addChatMessage({ id: newId(), role: "assistant", content: data.reply, timestamp: new Date().toISOString() });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "通信エラー";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function toggleVoice() {
    const Recog = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recog) {
      setError("お使いのブラウザは音声入力に未対応です");
      return;
    }
    if (listening) {
      recogRef.current?.stop();
      setListening(false);
      return;
    }
    const r = new Recog();
    r.lang = "ja-JP";
    r.continuous = false;
    r.interimResults = false;
    r.onresult = (e: any) => {
      const transcript = e.results[0]?.[0]?.transcript ?? "";
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    r.start();
    recogRef.current = r;
    setListening(true);
  }

  const hasMessages = messages.length > 0;
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 11) return "おはよう。";
    if (h < 17) return "こんにちは。";
    return "こんばんは。";
  })();
  const latest = state.tests[0];
  const introLines = [
    `${greeting}今日のテストの結果、見ました。`,
    latest && latest.input.fullScore > 0
      ? `${latest.input.subject}が${Math.round((latest.input.score / latest.input.fullScore) * 100)}%だったね。一緒に立て直しましょう。`
      : "テストをまだ登録していませんが、まずは今日の25分から整えましょう。",
  ];

  return (
    <div className="flex h-[100dvh] flex-col bg-cream-50">
      {/* ヘッダー */}
      <header className="flex flex-none items-center justify-between border-b border-ink-100/60 bg-cream-50/95 px-4 py-3 backdrop-blur-md">
        <Link href="/app" aria-label="戻る" className="flex h-9 w-9 items-center justify-center rounded-full text-ink-700 active:bg-ink-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex flex-1 items-center justify-center gap-2">
          <span className="text-[15px] font-bold text-ink-900">AI コーチ</span>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-mint-600">
            <span className="h-1.5 w-1.5 rounded-full bg-mint-500" />
            オンライン
          </span>
        </div>
        <div className="w-9" />
      </header>

      {/* メッセージ */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {!hydrated ? null : (
          <div className="space-y-3">
            {/* 時刻 */}
            <div className="text-center text-[11px] text-ink-400">
              今 {new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
            </div>
            {/* 自動挨拶 (履歴ゼロ時のみ) */}
            {!hasMessages
              ? introLines.map((line, i) => (
                  <div key={i} className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl bg-white px-3.5 py-2.5 text-[13px] leading-[1.7] text-ink-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                      {line}
                    </div>
                  </div>
                ))
              : null}
            {/* 履歴 */}
            {messages.map((m) => (
              <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-[1.7]",
                    m.role === "user"
                      ? "bg-ink-900 text-white"
                      : "bg-white text-ink-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {/* タイピング中 */}
            {loading ? (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white px-3.5 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-ink-400"
                        style={{ animation: "pulse 1.4s ease-in-out infinite", animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
            {error ? (
              <div className="rounded-xl border border-coral-300 bg-coral-50 px-3 py-2 text-[12px] text-coral-700">
                {error}
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* クイックアクション */}
      <div className="flex-none border-t border-ink-100/60 bg-cream-50 px-4 pt-3">
        <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar">
          {QUICK_ACTIONS.map((q) =>
            "href" in q ? (
              <Link
                key={q.label}
                href={q.href as string}
                className="inline-flex flex-none items-center gap-1.5 rounded-full bg-white px-3 py-2 text-[12px] font-medium text-ink-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] active:scale-95"
              >
                <span>{q.emoji}</span>
                {q.label}
              </Link>
            ) : (
              <button
                key={q.label}
                type="button"
                onClick={() => void sendMessage("今日は休みたい")}
                className="inline-flex flex-none items-center gap-1.5 rounded-full bg-white px-3 py-2 text-[12px] font-medium text-ink-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] active:scale-95"
              >
                <span>{q.emoji}</span>
                {q.label}
              </button>
            ),
          )}
        </div>

        {/* 入力欄 */}
        <div className="flex items-center gap-2 pb-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage(input);
                }
              }}
              placeholder="メッセージを入力..."
              className="w-full rounded-full border border-ink-200/70 bg-white px-4 py-3 pr-10 text-[13px] text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
            />
            <button
              type="button"
              onClick={toggleVoice}
              className={cn("absolute right-3 top-1/2 -translate-y-1/2 transition", listening ? "text-coral-500" : "text-ink-300")}
              aria-label={listening ? "音声入力停止" : "音声入力開始"}
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          </div>
          <button
            type="button"
            disabled={!input.trim() || loading}
            onClick={() => void sendMessage(input)}
            aria-label="送信"
            className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-ink-900 text-white transition disabled:opacity-40 active:scale-95"
          >
            <Send className="h-4 w-4" strokeWidth={2.6} />
          </button>
        </div>
      </div>
    </div>
  );
}
