"use client";

// AI コーチ — フルスクリーン LINE風チャット
// 上: < AIコーチ ●オンライン
// 中: メッセージスレッド (assistant=cream bubble / user=black bubble)
// 下: クイックアクション 🍃ルートを見る ⏰25分はじめる 😊今日はやめる + 入力欄

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Mic, MicOff, Send } from "lucide-react";
import { useStore } from "@/lib/hooks/useStore";
import { addChatMessage, logDailyMood } from "@/lib/store";
import type { ChatMessage } from "@/lib/store";
import { cn } from "@/lib/cn";
import { toast } from "@/components/ui/Toast";
import { confirm } from "@/components/ui/ConfirmDialog";
import { useRouter } from "next/navigation";

function newId(): string {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const QUICK_ACTIONS = [
  { emoji: "🍃", label: "ルートを見る", href: "/app/me" },
  { emoji: "⏰", label: "25分はじめる", href: "/app/focus/run" },
  { emoji: "😊", label: "今日はやめる", action: "today-off" as const },
];

// 空チャット時の「何を聞けばいいか」の取っ掛かり（タップで送信）
const STARTER_QUESTIONS = [
  "次の25分、何をやればいい？",
  "苦手のつぶし方を教えて",
  "今週の計画を立てて",
  "志望校まであと何が必要？",
];

// Web Speech API のミニマル型 (TS lib.dom が SpeechRecognition を未定義の環境に対応)
type LocalSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: LocalSpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
};
type LocalSpeechRecognitionEvent = {
  results: { [index: number]: { [index: number]: { transcript: string } }; length: number };
};

export function AiCoachView() {
  const router = useRouter();
  const { state, hydrated } = useStore();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [degraded, setDegraded] = useState(false);
  const messages: ChatMessage[] = state.chatMessages ?? [];
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const recogRef = useRef<LocalSpeechRecognition | null>(null);

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
      // /api/chat の契約に合わせて: history + userMessage + context
      const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history,
          userMessage: trimmed,
          context: {
            grade: profile?.grade,
            target: profile?.target,
            latestTest: latest?.input
              ? { subject: latest.input.subject, score: latest.input.score, fullScore: latest.input.fullScore }
              : null,
          },
        }),
      });
      const data = (await res.json()) as { ok?: boolean; text?: string; degraded?: boolean; error?: string };
      if (!res.ok || !data.ok || !data.text) {
        throw new Error(data.error || "AI 応答が取得できませんでした");
      }
      setDegraded(Boolean(data.degraded));
      addChatMessage({ id: newId(), role: "assistant", content: data.text, timestamp: new Date().toISOString() });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "通信エラー";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function toggleVoice() {
    const Recog =
      (window as unknown as { SpeechRecognition?: new () => LocalSpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => LocalSpeechRecognition }).webkitSpeechRecognition;
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
    r.onresult = (e: LocalSpeechRecognitionEvent) => {
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
        <div className="flex flex-1 items-center justify-center gap-2.5">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-sky-500 text-[13px] font-bold text-white">
            S
          </span>
          <div className="flex flex-col items-start leading-tight">
            <span className="text-[15px] font-bold text-ink-900">Sara</span>
            {degraded ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sun-600">
                <span className="h-1.5 w-1.5 rounded-full bg-sun-500" />
                制限モード
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-mint-600">
                <span className="h-1.5 w-1.5 rounded-full bg-mint-500" />
                オンライン
              </span>
            )}
          </div>
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
            {/* 質問の例（取っ掛かり）— 履歴ゼロ時のみ */}
            {!hasMessages ? (
              <div className="flex flex-col items-start gap-2 pl-1 pt-1">
                <span className="text-[11px] font-medium text-ink-400">
                  こう聞いてみよう
                </span>
                <div className="flex flex-wrap gap-2">
                  {STARTER_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => void sendMessage(q)}
                      className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-[12px] font-medium text-sky-700 transition active:scale-95"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
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
                onClick={async () => {
                  // 誤タップ防止: 確認してから当日 mood を today-off 記録 + ホームへ
                  const ok = await confirm({
                    title: "今日はお休みにする？",
                    body: "今日を休みとして記録して、ホームに戻ります。",
                  });
                  if (!ok) return;
                  logDailyMood({
                    dateISO: new Date().toISOString().slice(0, 10),
                    mood: "today-off",
                    returnTime: state.profile?.returnTime ?? "18:30",
                    finalBlocks: 0,
                    reason: "AI コーチで今日はやめると選択",
                    createdAt: new Date().toISOString(),
                  });
                  toast.success("今日はゆっくり休んでね 🌙");
                  router.push("/app");
                }}
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
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" strokeWidth={2.6} />}
          </button>
        </div>
      </div>
    </div>
  );
}
