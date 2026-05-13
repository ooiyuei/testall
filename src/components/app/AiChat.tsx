"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, RotateCcw, Sparkles } from "lucide-react";
import { addChatMessage, clearChat } from "@/lib/store";
import type { StoreState, ChatMessage } from "@/lib/store";
import { cn } from "@/lib/cn";

// Web Speech API の型宣言
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
  readonly isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
}

function newId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function AiChat({ state }: { state: StoreState }) {
  const messages = state.chatMessages ?? [];
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    setError(null);

    const userMsg: ChatMessage = {
      id: newId(),
      role: "user",
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };
    addChatMessage(userMsg);
    setInput("");
    setLoading(true);

    try {
      // v0.5: 学習コンテキストを AI に渡してパーソナライズ
      const profile = state.profile;
      const latest = state.tests?.[0];
      const recentBlocks = (state.blockLogs ?? []).slice(0, 14).length;
      const context = {
        grade: profile?.grade,
        deviation: profile?.deviation,
        targetUniversity: profile?.targetUniversities?.[0]?.universityId,
        examDate: profile?.examDate,
        latestTest: latest
          ? {
              subject: latest.input.subject,
              testName: latest.input.testName,
              scorePct:
                latest.input.fullScore > 0
                  ? Math.round(
                      (latest.input.score / latest.input.fullScore) * 100,
                    )
                  : null,
              weakUnits: (latest.diagnosis.weaknesses ?? [])
                .slice(0, 3)
                .map((w) => w.unit),
            }
          : null,
        recentBlocks14d: recentBlocks,
      };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: messages,
          userMessage: text.trim(),
          context,
        }),
      });
      const data = (await res.json()) as { ok: boolean; text?: string; error?: string };

      if (!data.ok) {
        if (data.error === "api_not_configured") {
          setError("AI チャットは現在準備中です。");
        } else {
          setError("エラーが発生しました。もう一度お試しください。");
        }
        return;
      }

      const aiMsg: ChatMessage = {
        id: newId(),
        role: "assistant",
        content: data.text ?? "",
        timestamp: new Date().toISOString(),
      };
      addChatMessage(aiMsg);
    } catch {
      setError("通信エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  function toggleVoice() {
    const SpeechRecognitionCtor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "ja-JP";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0]?.[0]?.transcript ?? "";
      setInput((prev) => prev + transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return (
    <section className="mt-7">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-mint-600" strokeWidth={2.5} />
          <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-400">
            AI に相談
          </h2>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => clearChat()}
            className="flex items-center gap-1 text-[10px] font-medium text-ink-400"
          >
            <RotateCcw className="h-3 w-3" />
            クリア
          </button>
        )}
      </div>

      {/* クイックプロンプト (初回表示) */}
      {messages.length === 0 && !loading && (
        <div className="mb-3 rounded-2xl border border-mint-200/70 bg-mint-50/40 p-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-mint-600">
            こんなこと聞けます
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[
              "次の25分は何をやる？",
              "苦手な単元を教えて",
              "今週の作戦は？",
              "志望校までのギャップは？",
            ].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => void sendMessage(q)}
                className="rounded-full bg-white px-3 py-1.5 text-[11px] font-medium text-ink-700 transition active:scale-95 hover:bg-mint-100"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 会話履歴 */}
      {messages.length > 0 && (
        <div className="mb-3 max-h-72 overflow-y-auto rounded-2xl border border-ink-100/80 bg-white p-4 space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex gap-2",
                m.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              {m.role === "assistant" && (
                <div className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-mint-100 text-mint-700 text-[10px] font-bold">
                  S
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3 py-2 text-[13px] leading-[1.7]",
                  m.role === "user"
                    ? "bg-ink-900 text-white"
                    : "bg-cream-100 text-ink-800",
                )}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start gap-2">
              <div className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-mint-100 text-mint-700 text-[10px] font-bold">
                S
              </div>
              <div className="rounded-2xl bg-cream-100 px-3 py-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-ink-400 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* エラー */}
      {error && (
        <div className="mb-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-[12px] text-red-700">
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-2 font-bold underline"
          >
            閉じる
          </button>
        </div>
      )}

      {/* 入力欄 */}
      <div className="flex gap-2">
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
            placeholder="Sara に相談する..."
            className="w-full rounded-2xl border border-ink-200/70 bg-white px-4 py-3 pr-10 text-[13px] text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-mint-400/40"
          />
          <button
            type="button"
            onClick={toggleVoice}
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 transition",
              listening ? "text-red-500" : "text-ink-300",
            )}
          >
            {listening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </button>
        </div>
        <button
          type="button"
          disabled={!input.trim() || loading}
          onClick={() => void sendMessage(input)}
          className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-ink-900 text-white transition disabled:opacity-40 active:scale-95"
        >
          <Send className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
      <p className="mt-2 text-center text-[10px] text-ink-300">
        AI が生成した内容です。重要な判断は自身で確認してください。
      </p>
    </section>
  );
}
