import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

// base64 で約 33% 膨らむため、元画像 ~7.5MB 相当
const MAX_BASE64_LENGTH = 10 * 1024 * 1024;
const MAX_FILE_BYTES = 8 * 1024 * 1024;

// ---------------------------------------------------------------------------
// 答案画像からのテスト情報抽出
// ---------------------------------------------------------------------------
// Vision で読み取るのは「写真の中に書かれた事実だけ」。推測は confidence で示す。
// 単元別の「ミスの原因 (cause)」だけは正答率パターンから AI が判定して良い。

const SYSTEM_PROMPT = `あなたは日本の高校生向けテスト答案を読み取る AI アシスタントです。
画像 (答案・成績票・模試結果) から事実だけを抽出して、必ず JSON 1つだけで返してください。
前置きや後置き、Markdown フェンス、説明文は一切書かない。

# 抽出ルール

1. **写真に書かれた数字以外は作り出さない**。読めない箇所は null。
2. **テスト名**: 表紙や上部に書かれた文字列をそのまま。なければ「○年○月 △△テスト」程度に推測。推測した場合は \`testNameSource: "inferred"\`。
3. **科目** (subject) は次の正規化リストから選ぶ:
   - 数学・英語・国語・理科・社会
   - 物理/化学/生物/地学 → 理科
   - 日本史/世界史/地理/政経/倫理/現代社会 → 社会
4. **点数 (score, fullScore)**:
   - 答案の合計得点を採点者が書いた数字から取る。
   - 満点が見えない場合 100。
   - score > fullScore は禁止 (もし読み取り結果がそうなったら逆転させない。confidence.score を "low" に)。
5. **単元 (units)**:
   - 大問ごとに区切る。「大問1: 二次関数」→ unit="二次関数"。
   - correct, total は答案の正誤マーク (○ × △ や 配点/得点) から数える。
   - △ や部分点は correct に含めない (整数のみ)。
   - 5 個以上は重要な順に最大 8 個まで。
6. **cause** (ミスの原因) は次の規則で判定:
   - 正答率 0% かつ全く解いていない (空白多数) → "time"
   - 正答率 0-30% で式は書いてあるが間違い多数 → "understanding"
   - 正答率 50-70% で計算ミスや単純なケアレス → "careless"
   - 用語問題で空白が目立つ → "knowledge"
   - 判定困難 → null
7. **confidence** は high / medium / low の 3 段階で、読み取った数字の確からしさ。

# 出力スキーマ (この通りに JSON で返す)

{
  "subject": "数学" | "英語" | "国語" | "理科" | "社会" | null,
  "testName": "string | null",
  "testNameSource": "image" | "inferred" | null,
  "score": number | null,
  "fullScore": number | null,
  "units": [
    {
      "unit": "string",
      "correct": number | null,
      "total": number | null,
      "cause": "knowledge" | "understanding" | "time" | "careless" | null
    }
  ],
  "confidence": {
    "overall": "high" | "medium" | "low",
    "score": "high" | "medium" | "low",
    "units": "high" | "medium" | "low"
  },
  "notes": "string | null  // 読み取れなかった箇所や注意点を1文で"
}

# 注意

- スマホで撮影された画像は傾き・反射・影が混じる。読めない箇所は null + confidence を "low" に。
- 解答用紙ではなく問題用紙だけが写っている場合、units だけ抽出して score は null。
- 画像にテスト関連の情報が全く写っていない場合は全てのフィールドを null にし、notes に「テストではない画像」と書く。

# 期待される入出力例（参照用 — 以下はモデルが学習のために使う例示であり、実際の抽出には入力画像のみを使うこと）

## 例1: 数学テスト答案
入力説明: 「数学Ⅰ・A 期末テスト」と書かれた答案。採点済みで合計 67 点 / 100 点。大問1（数と式）は 6 問中 4 問正解、大問2（二次関数）は 6 問中 2 問正解（式は書いてあるが符号ミス多数）、大問3（場合の数・確率）は 5 問中 5 問正解。
期待出力:
{"subject":"数学","testName":"数学Ⅰ・A 期末テスト","testNameSource":"image","score":67,"fullScore":100,"units":[{"unit":"数と式","correct":4,"total":6,"cause":"careless"},{"unit":"二次関数","correct":2,"total":6,"cause":"understanding"},{"unit":"場合の数・確率","correct":5,"total":5,"cause":null}],"confidence":{"overall":"high","score":"high","units":"high"},"notes":null}

## 例2: 英語テスト答案
入力説明: 「2年2学期 中間テスト 英語」と書かれた答案。合計 82 点 / 100 点。大問1（語彙・単語）は 10 問中 6 問正解（空白が目立つ）、大問2（長文読解）は 8 問中 7 問正解、大問3（英作文）は得点の記載が読めない。
期待出力:
{"subject":"英語","testName":"2年2学期 中間テスト 英語","testNameSource":"image","score":82,"fullScore":100,"units":[{"unit":"語彙・単語","correct":6,"total":10,"cause":"knowledge"},{"unit":"長文読解","correct":7,"total":8,"cause":"careless"},{"unit":"英作文","correct":null,"total":null,"cause":null}],"confidence":{"overall":"medium","score":"high","units":"medium"},"notes":"英作文の得点が読み取れなかったため units の confidence を medium に設定"}

※ 上記は例示のみ。モデルは必ず実際に送られてくる画像から事実を抽出し、これらの例の数値を流用しないこと。`;

// ---------------------------------------------------------------------------
// 型定義 (UI 側と共有)
// ---------------------------------------------------------------------------

export type Confidence = "high" | "medium" | "low";

export type VisionResult = {
  subject: string | null;
  testName: string | null;
  testNameSource?: "image" | "inferred" | null;
  score: number | null;
  fullScore: number | null;
  units: {
    unit: string;
    correct: number | null;
    total: number | null;
    cause: "knowledge" | "understanding" | "time" | "careless" | null;
  }[];
  confidence?: {
    overall: Confidence;
    score: Confidence;
    units: Confidence;
  };
  notes?: string | null;
};

// 後方互換: 旧 UI が期待していた形 (score/fullScore が必ず number) に正規化
export type LegacyVisionResult = {
  subject: string;
  testName: string;
  score: number;
  fullScore: number;
  units: {
    unit: string;
    correct: number;
    total: number;
    cause: "knowledge" | "understanding" | "time" | "careless" | null;
  }[];
  confidence?: VisionResult["confidence"];
  notes?: string | null;
};

// ---------------------------------------------------------------------------
// バリデーション
// ---------------------------------------------------------------------------

function clampInt(n: unknown, min: number, max: number): number | null {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function normalizeSubject(s: unknown): string | null {
  if (typeof s !== "string") return null;
  const t = s.trim();
  if (["数学", "英語", "国語", "理科", "社会"].includes(t)) return t;
  // よくある別表記
  if (/物理|化学|生物|地学/.test(t)) return "理科";
  if (/日本史|世界史|地理|政経|倫理|現代社会|歴史|公民/.test(t)) return "社会";
  if (/英/.test(t)) return "英語";
  if (/数/.test(t)) return "数学";
  if (/国/.test(t)) return "国語";
  if (/理/.test(t)) return "理科";
  if (/社/.test(t)) return "社会";
  return null;
}

function normalizeCause(
  c: unknown,
): "knowledge" | "understanding" | "time" | "careless" | null {
  if (typeof c !== "string") return null;
  if (["knowledge", "understanding", "time", "careless"].includes(c)) {
    return c as "knowledge" | "understanding" | "time" | "careless";
  }
  return null;
}

function normalizeConfidence(c: unknown): Confidence {
  if (c === "high" || c === "medium" || c === "low") return c;
  return "medium";
}

function validateAndNormalize(
  raw: unknown,
): { ok: true; result: VisionResult } | { ok: false; reason: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, reason: "not_object" };
  }
  const r = raw as Record<string, unknown>;

  const subject = normalizeSubject(r.subject);
  const testName = typeof r.testName === "string" ? r.testName.trim() : null;
  const testNameSource =
    r.testNameSource === "image" || r.testNameSource === "inferred"
      ? r.testNameSource
      : null;

  let score = clampInt(r.score, 0, 1000);
  let fullScore = clampInt(r.fullScore, 0, 1000);
  // 正規化: score > fullScore なら逆転させずに信頼度を落とす
  let scoreConfidence: Confidence = "high";
  if (score !== null && fullScore !== null && score > fullScore) {
    scoreConfidence = "low";
    // 推測値クランプ: 100 を仮の満点として
    if (fullScore < 50 && score <= 100) {
      fullScore = 100;
    } else {
      score = null;
    }
  }
  if (score !== null && fullScore === null) fullScore = 100;

  // units
  const rawUnits = Array.isArray(r.units) ? r.units.slice(0, 12) : [];
  const units: VisionResult["units"] = [];
  for (const u of rawUnits) {
    if (!u || typeof u !== "object") continue;
    const ur = u as Record<string, unknown>;
    const unitName = typeof ur.unit === "string" ? ur.unit.trim() : "";
    if (!unitName) continue;
    const correct = clampInt(ur.correct, 0, 1000);
    const total = clampInt(ur.total, 0, 1000);
    // 正答数 > 設問数 は禁止 (反転させない)
    if (correct !== null && total !== null && correct > total) {
      units.push({ unit: unitName, correct: null, total, cause: null });
      continue;
    }
    units.push({
      unit: unitName,
      correct,
      total,
      cause: normalizeCause(ur.cause),
    });
  }

  // confidence
  const rawConfidence = (r.confidence as Record<string, unknown> | undefined) ?? {};
  const confidence = {
    overall: normalizeConfidence(rawConfidence.overall),
    score: scoreConfidence === "low" ? "low" : normalizeConfidence(rawConfidence.score),
    units: normalizeConfidence(rawConfidence.units),
  } as VisionResult["confidence"];

  return {
    ok: true,
    result: {
      subject,
      testName,
      testNameSource,
      score,
      fullScore,
      units,
      confidence,
      notes: typeof r.notes === "string" ? r.notes : null,
    },
  };
}

// ---------------------------------------------------------------------------
// 旧 UI 互換: null フィールドを埋めて LegacyVisionResult を作る
// ---------------------------------------------------------------------------
function toLegacy(v: VisionResult): LegacyVisionResult {
  return {
    subject: v.subject ?? "数学",
    testName: v.testName ?? "",
    score: v.score ?? 0,
    fullScore: v.fullScore ?? 100,
    units: v.units.map((u) => ({
      unit: u.unit,
      correct: u.correct ?? 0,
      total: u.total ?? 0,
      cause: u.cause,
    })),
    confidence: v.confidence,
    notes: v.notes,
  };
}

// ---------------------------------------------------------------------------
// ハンドラ
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "api_key_not_configured" },
      { status: 503 },
    );
  }

  // Vision はトークン消費が大きいので厳しめに制限
  const rl = rateLimit(`vision:${clientIp(req)}`, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  let base64Data: string;
  let mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("image");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "image_required" },
        { status: 400 },
      );
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { ok: false, error: "image_too_large" },
        { status: 413 },
      );
    }
    const mimeType = file.type as typeof mediaType;
    if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(mimeType)) {
      return NextResponse.json(
        { ok: false, error: "unsupported_image_type" },
        { status: 400 },
      );
    }
    mediaType = mimeType;
    const buffer = await file.arrayBuffer();
    base64Data = Buffer.from(buffer).toString("base64");
  } else {
    const body = (await req.json()) as { image?: string; mediaType?: string };
    if (!body.image) {
      return NextResponse.json(
        { ok: false, error: "image_required" },
        { status: 400 },
      );
    }
    if (body.image.length > MAX_BASE64_LENGTH) {
      return NextResponse.json(
        { ok: false, error: "image_too_large" },
        { status: 413 },
      );
    }
    base64Data = body.image;
    mediaType = (body.mediaType as typeof mediaType) ?? "image/jpeg";
  }

  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4096, // 長い答案でも切れないよう拡張
      temperature: 0.1, // ハルシネーション抑制
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64Data },
            },
            {
              type: "text",
              text:
                "この画像を読み取り、指定の JSON スキーマで返してください。\n" +
                "- 必ず JSON 1 つだけ。前置き・後置き・コードフェンス禁止。\n" +
                "- 自信が無いフィールドは null + confidence を 'low' に。\n" +
                "- 写真に無い数字を絶対に作らない。",
            },
          ],
        },
      ],
    });

    const rawText = msg.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    // JSON 抽出: フェンス対応 + 最外 { ... }
    const fenced = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    const candidate = fenced ? fenced[1] : rawText;
    const jsonMatch = candidate.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // モデル出力はサーバーログのみに残し、クライアントには返さない (情報漏洩防止)
      console.error("[diagnose-from-image] parse failed:", rawText.slice(0, 500));
      return NextResponse.json(
        { ok: false, error: "parse_failed" },
        { status: 500 },
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      console.error("[diagnose-from-image] JSON parse failed:", jsonMatch[0].slice(0, 500));
      return NextResponse.json(
        { ok: false, error: "parse_failed" },
        { status: 500 },
      );
    }

    const validated = validateAndNormalize(parsed);
    if (!validated.ok) {
      return NextResponse.json(
        { ok: false, error: "validation_failed", reason: validated.reason },
        { status: 500 },
      );
    }

    // 旧 UI は LegacyVisionResult を期待しているので両方返す
    return NextResponse.json({
      ok: true,
      result: toLegacy(validated.result),
      detail: validated.result, // confidence / notes を見たい場合
    });
  } catch (e) {
    console.error("[diagnose-from-image] failed", e);
    return NextResponse.json(
      { ok: false, error: "vision_failed" },
      { status: 500 },
    );
  }
}
