"use client";

// 毎日のヒント — 1 日 1 回、ホームに表示
// ルールベース (30 テンプレ) + ユーザー状況に応じて選別
// 軽量・無料・即表示。AI 呼び出しなし

import { useEffect, useMemo, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { useStore } from "@/lib/hooks/useStore";
import { currentDayISO } from "@/lib/store";
import { cn } from "@/lib/cn";

const SHOWN_KEY_PREFIX = "testall:daily-tip-shown:";

type Tip = {
  text: string;
  // condition で対象を絞る (省略時は全員)
  condition?: (ctx: TipContext) => boolean;
};

type TipContext = {
  hour: number;
  weekday: number; // 0=日
  hasTests: boolean;
  hasBlocksToday: boolean;
  streak: number;
  weakSubjects: string[];
  totalBlocks: number;
};

const TIPS: Tip[] = [
  // 朝 (5-10 時)
  {
    text: "おはよう。朝の 25分は集中力のゴールデンタイム。",
    condition: (c) => c.hour >= 5 && c.hour < 10,
  },
  {
    text: "今日の最初の 25分を、一番苦手な単元から始めよう。",
    condition: (c) => c.hour >= 5 && c.hour < 10 && c.weakSubjects.length > 0,
  },
  // 朝〜昼 (10-13)
  {
    text: "10時の脳は計算問題に強い。数学・物理を当ててみよう。",
    condition: (c) => c.hour >= 10 && c.hour < 13,
  },
  // 午後 (13-17)
  {
    text: "午後は読解力が落ちる。25分タイマーで強制集中。",
    condition: (c) => c.hour >= 13 && c.hour < 17,
  },
  {
    text: "間違いノートを 5 分めくる。それだけで次に間違えにくくなる。",
    condition: (c) => c.hour >= 13 && c.hour < 17,
  },
  // 夕方 (17-20) — メイン学習タイム
  {
    text: "夕方は集中の山。今日の 25分はもう始めた？",
    condition: (c) => c.hour >= 17 && c.hour < 20 && !c.hasBlocksToday,
  },
  {
    text: "ご飯前の 25分を 1 つ。終わったら気持ちよく食べられる。",
    condition: (c) => c.hour >= 17 && c.hour < 19,
  },
  // 夜 (20-23)
  {
    text: "暗記系は寝る前 25分が定着しやすい。",
    condition: (c) => c.hour >= 20 && c.hour < 23,
  },
  {
    text: "今日やった内容を頭の中で 1 分だけ復習してから寝よう。",
    condition: (c) => c.hour >= 21 && c.hour < 24,
  },
  // 深夜 (0-5)
  {
    text: "深夜は判断が荒くなる。明日の 25分のために、今日は休もう。",
    condition: (c) => c.hour < 5 || c.hour >= 23,
  },

  // ストリーク系
  {
    text: "連続 7 日達成おめでとう！習慣の入口に立ちました。",
    condition: (c) => c.streak === 7,
  },
  {
    text: "30 日連続。もう「やる気」じゃなくて「歯磨き」だね。",
    condition: (c) => c.streak === 30,
  },
  {
    text: "100 日連続！受験生史上稀に見るレベル。",
    condition: (c) => c.streak === 100,
  },
  {
    text: `${"連続"}日数を切らさないコツは、「とりあえず 1 ブロックだけ」やること。`,
    condition: (c) => c.streak >= 3 && c.streak < 7,
  },

  // テスト無し
  {
    text: "テストを 1 つ追加すると、AI が今日の 25分を整えてくれます。",
    condition: (c) => !c.hasTests,
  },

  // 平日 / 休日
  {
    text: "今日は土曜。平日にできない「やり込み」のチャンス。",
    condition: (c) => c.weekday === 6,
  },
  {
    text: "日曜の夜に明日の準備を 5 分しておくと、月曜が軽くなる。",
    condition: (c) => c.weekday === 0 && c.hour >= 19,
  },
  {
    text: "金曜日。今週分の振り返りで弱点が見えてくる。",
    condition: (c) => c.weekday === 5 && c.hour >= 17,
  },

  // 一般
  {
    text: "完璧を狙わず、「8 割で次へ」を意識すると進みが速い。",
  },
  {
    text: "ノートに書く前に「自分の言葉で言える？」と問いかける。",
  },
  {
    text: "苦手は逃げると残る。25分だけ向き合うと意外と進む。",
  },
  {
    text: "間違えた問題を「赤本のあのページ」と紐付けて覚える。",
  },
  {
    text: "答えを丸暗記せず、「なぜそうなる？」を 1 度言葉にする。",
  },
  {
    text: "復習は「翌日 → 1週間後 → 1ヶ月後」のリズムが効く。",
  },
  {
    text: "問題を解く前に、「何を聞かれているか」を 5 秒考える。",
  },
  {
    text: "今日の自分を、昨日の自分と比べる。それで十分。",
  },
  {
    text: "勉強机の周りを 1 分整える。集中力が 10% 上がる。",
  },
  {
    text: "気が乗らない日は「単語 50 個だけ」など最小目標で OK。",
    condition: (c) => !c.hasBlocksToday,
  },
  {
    text: "5 分だけやろうと始めると、10 分続くものです。",
    condition: (c) => !c.hasBlocksToday,
  },
];

function pickTip(ctx: TipContext, dateISO: string): Tip {
  // 条件マッチするものを先にフィルタ
  const eligible = TIPS.filter((t) => !t.condition || t.condition(ctx));
  // dateISO のハッシュで決定的に選ぶ (同じ日は同じ tip)
  let hash = 0;
  for (let i = 0; i < dateISO.length; i++) {
    hash = (hash * 31 + dateISO.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % Math.max(1, eligible.length);
  return eligible[idx] ?? TIPS[0];
}

export function DailyTip() {
  const { state, hydrated } = useStore();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (typeof window === "undefined") return;
    const today = currentDayISO();
    try {
      if (localStorage.getItem(SHOWN_KEY_PREFIX + today + ":dismissed")) {
        setDismissed(true);
      }
    } catch {
      /* noop */
    }
  }, [hydrated]);

  const tip = useMemo(() => {
    if (!hydrated) return null;
    const today = currentDayISO();
    const now = new Date();
    const blockLogs = state.blockLogs ?? [];
    const todayLogs = blockLogs.filter(
      (b) => currentDayISO(new Date(b.completedAt)) === today,
    );
    // ストリーク計算 (簡易版)
    const days = new Set(
      blockLogs.map((b) => currentDayISO(new Date(b.completedAt))),
    );
    let streak = 0;
    const cursor = new Date(today + "T00:00:00");
    while (days.has(cursor.toISOString().slice(0, 10))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    const weakSubjects = (state.tests[0]?.diagnosis.weaknesses ?? [])
      .slice(0, 3)
      .map((w) => w.unit);
    const ctx: TipContext = {
      hour: now.getHours(),
      weekday: now.getDay(),
      hasTests: state.tests.length > 0,
      hasBlocksToday: todayLogs.length > 0,
      streak,
      weakSubjects,
      totalBlocks: blockLogs.length,
    };
    return pickTip(ctx, today);
  }, [hydrated, state.blockLogs, state.tests]);

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(SHOWN_KEY_PREFIX + currentDayISO() + ":dismissed", "1");
    } catch {
      /* noop */
    }
  }

  if (!hydrated || !tip || dismissed) return null;

  return (
    <section
      className={cn(
        "relative flex items-start gap-3 rounded-2xl border border-mint-200/60 bg-gradient-to-br from-mint-50/70 to-cream-50 p-4 shadow-soft",
      )}
    >
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-white text-mint-600 shadow-soft">
        <Sparkles className="h-4 w-4" strokeWidth={2.2} />
      </span>
      <div className="min-w-0 flex-1 pr-6">
        <div className="text-[10px] font-bold tracking-wide text-mint-600">
          今日のヒント
        </div>
        <p className="mt-1 text-[13px] leading-[1.7] text-ink-700">{tip.text}</p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-ink-400 hover:bg-cream-100"
        aria-label="閉じる"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </section>
  );
}
