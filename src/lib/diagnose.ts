import Anthropic from "@anthropic-ai/sdk";
import type { Diagnosis, TestInput, MissCause } from "./types";

const SYSTEM_PROMPT = `あなたは「Testall」という受験戦略OSのAI学習マネージャーです。
役割は、生徒のテスト結果・志望校・所有参考書・使える時間から、
- 苦手分野の原因分解（知識不足 / 理解不足 / 時間不足 / ケアレスミス）
- 志望校との差分の現実的な評価
- 持っている参考書を回すルート提案（新しい本を増やさない）
- 1週間計画と「今日の25分ブロック」の具体タスクまでの落とし込み
を行うことです。

口調:
- 受験生の自尊心を潰さず、ただし甘やかさない。
- 「次の25分だけ勝てばいい」というメッセージを通底させる。
- 抽象論ではなく、参考書名・例題番号・回数・時間まで具体。
- 反省ではなく作戦に変える。

制約:
- 出力は必ず指定のJSONスキーマに従う。前置きや後置きの文章は一切書かない。
- 参考書は生徒が持っているもののみ。持っていないものは推奨しない。
- 25分ブロックは「完了条件（completion）」を必ず行動可能な形で書く。例: 「4問中3問を答えを見ずに解ける」。
- weekPlanは7日分、todayBlocksは3〜5個。
`;

const JSON_SCHEMA_HINT = `
{
  "summary": "全体評。3文以内。志望校とのギャップを率直に。",
  "level": "現在地の総合評価。例: '基礎は固まっているが応用で失点が多い'",
  "gap": "志望校到達までに必要な作業量の現実的な見積もり。例: '残り180日。週20時間ペースで間に合うが、二次関数と長文読解の固定枠が必要'",
  "weaknesses": [
    {
      "unit": "単元名",
      "cause": "knowledge | understanding | time | careless",
      "severity": "high | mid | low",
      "reason": "なぜそう判定したか（生徒の正答率や入力から）",
      "recovery": "回復するための具体ルート"
    }
  ],
  "strengths": ["強みになっている単元・観点を2-3個"],
  "textbookPlan": [
    {
      "name": "持っている参考書名",
      "units": ["対象単元1", "対象単元2"],
      "pace": "1日あたりのページ数や例題数",
      "reps": "周回回数と復習タイミング"
    }
  ],
  "weekPlan": [
    {
      "day": "月",
      "focus": "その日の主目的（短文）",
      "subjects": ["数学", "英語"],
      "blocks": 3
    }
  ],
  "todayBlocks": [
    {
      "startTime": "17:00",
      "endTime": "17:25",
      "subject": "数学",
      "topic": "二次関数",
      "source": "チャート式 例題12〜15",
      "goal": "平方完成を自力でできる",
      "completion": "4問中3問を答えを見ずに解ける"
    }
  ],
  "encouragement": "1-2文。励ましというよりは作戦の宣言。25分単位で書く。"
}
`;

function buildUserPrompt(input: TestInput): string {
  const totalCorrect = input.units.reduce((a, b) => a + b.correct, 0);
  const totalQ = input.units.reduce((a, b) => a + b.total, 0);
  const pct =
    totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : Math.round((input.score / input.fullScore) * 100);

  const unitLines = input.units
    .map((u) => {
      const p = u.total > 0 ? Math.round((u.correct / u.total) * 100) : 0;
      const cause = u.cause ? `  原因: ${labelCause(u.cause)}` : "";
      return `- ${u.unit}: ${u.correct}/${u.total} (${p}%)${cause}`;
    })
    .join("\n");

  const profileContext = (input as TestInput & {
    deviation?: number;
    schoolName?: string;
    weekdayMinutes?: number;
    weekendMinutes?: number;
    targetUniversities?: { universityId: string; faculty?: string }[];
  });

  const extraLines: string[] = [];
  if (profileContext.deviation) {
    extraLines.push(`- 現在の全国偏差値（おおよそ）: ${profileContext.deviation}`);
  }
  if (profileContext.schoolName) {
    extraLines.push(`- 学校: ${profileContext.schoolName}`);
  }
  if (
    typeof profileContext.weekdayMinutes === "number" &&
    typeof profileContext.weekendMinutes === "number"
  ) {
    extraLines.push(
      `- 1日に勉強できる時間: 平日 ${profileContext.weekdayMinutes}分 / 休日 ${profileContext.weekendMinutes}分`,
    );
  }
  if (profileContext.targetUniversities && profileContext.targetUniversities.length > 0) {
    const list = profileContext.targetUniversities
      .map((tu, i) =>
        `  第${i + 1}志望: ${tu.universityId}${tu.faculty ? ` / ${tu.faculty}` : ""}`,
      )
      .join("\n");
    extraLines.push(`- 志望校:\n${list}`);
  }

  // v0.5: 過去のテスト履歴 / 学習ログ / 本棚を活用
  const history = input.history;
  const historyLines: string[] = [];

  if (history?.pastTests && history.pastTests.length > 0) {
    const sorted = [...history.pastTests]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5);
    historyLines.push(
      `直近のテスト履歴 (新→古):`,
      ...sorted.map((t) => {
        const dev = t.deviation ? `偏差値${t.deviation}` : "";
        const weak = t.weakUnits?.length ? ` / 苦手: ${t.weakUnits.slice(0, 3).join("・")}` : "";
        return `- ${t.createdAt.slice(0, 10)} ${t.subject} ${t.testName}: ${t.scorePct}%${dev ? ` (${dev})` : ""}${weak}`;
      }),
    );
    // トレンドを示唆
    if (sorted.length >= 2) {
      const newest = sorted[0].scorePct;
      const previous = sorted[1].scorePct;
      const delta = newest - previous;
      if (Math.abs(delta) >= 5) {
        historyLines.push(
          `→ 直近2回の差: ${delta > 0 ? "+" : ""}${delta}% (${delta > 0 ? "改善傾向" : "下降傾向"})`,
        );
      }
    }
  }

  if (history?.recentBlockLogs && history.recentBlockLogs.length > 0) {
    const last14 = history.recentBlockLogs.slice(-14);
    const days = new Set(last14.map((b) => b.date.slice(0, 10))).size;
    const avgRating =
      last14.reduce((s, b) => s + b.rating, 0) / last14.length;
    historyLines.push(
      `直近14日の学習ログ: ${last14.length}ブロック完了 (${days}日、平均自己評価 ${avgRating.toFixed(1)}/5)`,
    );
  }

  if (history?.bookshelf && history.bookshelf.length > 0) {
    historyLines.push(
      `本棚 (UI に登録済み):`,
      ...history.bookshelf.slice(0, 12).map((b) => `- ${b.name}${b.kind ? ` (${b.kind})` : ""}`),
    );
  }

  return `生徒データ:
- 学年: ${input.grade}
- 志望校レベル: ${input.target}
- 本番日: ${input.examDate}
- 1日に勉強できる平均時間: ${input.availableMinutesPerDay}分
${extraLines.join("\n")}

直近のテスト:
- テスト名: ${input.testName}
- 科目: ${input.subject}
- 点数: ${input.score}/${input.fullScore} (${Math.round((input.score / input.fullScore) * 100)}%)
- 単元別正答率 (全体 ${pct}%):
${unitLines}

所有参考書 (旧形式):
${input.textbooks.length === 0 ? "- 未入力（本棚 or 汎用ルートで提案）" : input.textbooks.map((t) => `- ${t}`).join("\n")}

${historyLines.length > 0 ? historyLines.join("\n") + "\n" : ""}
このデータをもとに、Testallの診断レポートを上記JSONスキーマで返してください。
注意:
- 志望校に複数候補がある場合、第1志望をベースに、第2・3志望も無理なくカバーできる作戦にする。
- 偏差値と志望校最低ラインのギャップが大きい場合はそれを率直に書く（精神論ではなく作戦で埋める）。
- 学年に応じた範囲で提案する（高1は基礎、高3は本番直結）。
- 過去のテスト履歴が与えられている場合、トレンド (改善/停滞/悪化) を summary で言及する。
- 本棚に登録された参考書を最優先で使い、未登録のものは推奨しない。
- 直近14日のブロック数から「無理のないペース」を推定し、weekPlan に反映する。
今日は${new Date().toLocaleDateString("ja-JP", { weekday: "long", month: "long", day: "numeric" })}です。
todayBlocksは、今日の夕方17:00以降を想定して3-5個 (25分単位) 提案してください。`;
}

function labelCause(c: MissCause): string {
  return {
    knowledge: "知識不足",
    understanding: "理解不足",
    time: "時間不足",
    careless: "ケアレスミス",
  }[c];
}

export async function diagnose(input: TestInput): Promise<Diagnosis> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return fallbackDiagnosis(input);
  }

  const client = new Anthropic({ apiKey });
  const res = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4096,
    system: SYSTEM_PROMPT + "\n\n出力JSONスキーマ:\n" + JSON_SCHEMA_HINT,
    messages: [{ role: "user", content: buildUserPrompt(input) }],
  });

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  return extractJson<Diagnosis>(text) ?? fallbackDiagnosis(input);
}

function extractJson<T>(text: string): T | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < 0) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

export function fallbackDiagnosisPublic(input: TestInput): Diagnosis {
  return fallbackDiagnosis(input);
}

function fallbackDiagnosis(input: TestInput): Diagnosis {
  const weakest = [...input.units].sort(
    (a, b) =>
      (a.correct / Math.max(1, a.total)) - (b.correct / Math.max(1, b.total)),
  );
  const top3Weak = weakest.slice(0, 3);
  const strengths = weakest
    .slice(-2)
    .map((u) => `${u.unit}（${Math.round((u.correct / Math.max(1, u.total)) * 100)}%）`);
  const causes: MissCause[] = ["understanding", "knowledge", "time"];
  return {
    summary: `${input.subject}は${Math.round((input.score / input.fullScore) * 100)}%。志望校到達には主要単元の穴埋めが優先。`,
    level: "基礎の取りこぼしが点数の主因。応用の前に土台を直す段階。",
    gap: "本番までに苦手3単元を週1テーマで回せば、現実的に届く。",
    weaknesses: top3Weak.map((u, i) => ({
      unit: u.unit,
      cause: u.cause ?? causes[i % causes.length],
      severity: i === 0 ? "high" : i === 1 ? "mid" : "low",
      reason: `正答率 ${Math.round((u.correct / Math.max(1, u.total)) * 100)}%。失点の中心はこの単元。`,
      recovery: "基本例題を3周。1周目は理解、2周目は解法定着、3周目は時間内自力。",
    })),
    strengths: strengths.length ? strengths : ["継続できる勉強リズムは確保できている"],
    textbookPlan:
      input.textbooks.length > 0
        ? input.textbooks.map((t) => ({
            name: t,
            units: top3Weak.map((u) => u.unit),
            pace: "1日 例題4問",
            reps: "3周（理解→定着→時間内自力）",
          }))
        : [
            {
              name: "（参考書未入力）汎用ルート",
              units: top3Weak.map((u) => u.unit),
              pace: "1日 例題4問",
              reps: "3周（理解→定着→時間内自力）",
            },
          ],
    weekPlan: ["月", "火", "水", "木", "金", "土", "日"].map((d, i) => ({
      day: d,
      focus: i % 2 === 0 ? `${input.subject}：${top3Weak[0]?.unit ?? "弱点単元"}` : "復習と他科目バランス",
      subjects: i % 2 === 0 ? [input.subject] : [input.subject, "英語"],
      blocks: i === 5 ? 5 : i === 6 ? 4 : 3,
    })),
    todayBlocks: [
      {
        startTime: "17:00",
        endTime: "17:45",
        subject: input.subject,
        topic: top3Weak[0]?.unit ?? "弱点単元",
        source: input.textbooks[0] ?? "手持ち基礎問題集",
        goal: "基本例題を理解する",
        completion: "4問中3問を答えを見ずに解ける",
      },
      {
        startTime: "20:00",
        endTime: "20:45",
        subject: input.subject,
        topic: top3Weak[1]?.unit ?? "次の弱点",
        source: input.textbooks[0] ?? "手持ち基礎問題集",
        goal: "解法の型を覚える",
        completion: "解法を白紙に再現できる",
      },
    ],
    encouragement: "次の25分だけ勝てばいい。それを積み上げれば届く。",
  };
}
