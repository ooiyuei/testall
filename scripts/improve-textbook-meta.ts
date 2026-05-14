// 参考書メタデータ (subject / level / usageTags / forGrades) の改善スクリプト。
// 中学・小学向け書籍の除外も行う。
//
// 実行: pnpm tsx scripts/improve-textbook-meta.ts

import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { Textbook, TextbookLevel, TextbookUsageTag } from "../src/lib/master/types";

const BULK_PATH = resolve(
  process.cwd(),
  "src/lib/master/textbooks-bulk.ts"
);

// ── 除外対象キーワード (中学・小学) ────────────────────────────
const EXCLUDE_PATTERNS = [
  /中学[1-3１-３一二三]?/,
  /中[1-3１-３一二三]年/,
  /小学[1-6１-６一二三四五六]?/,
  /小[1-6１-６一二三四五六]年/,
  /ジュニア/,
  /中等(教育|学校)/,
  // 高校入試は「高校入試問題集」= 中学生向けなので除外
  /高校入試/,
  /中学生(向け|用)?/,
  /中学校/,
];

function isExcluded(name: string): boolean {
  return EXCLUDE_PATTERNS.some((re) => re.test(name));
}

// ── subject 推定 ────────────────────────────────────────────
type SubjectRule = {
  subject: string;
  patterns: RegExp[];
};

const SUBJECT_RULES: SubjectRule[] = [
  {
    subject: "math",
    patterns: [
      /数学[IⅠABCⅡⅢ\d+]/i,
      /数[IⅠABCⅡⅢ]/,
      /数学[基礎応用標準入門]/,
      /チャート式.*数学/,
      /Focus\s*Gold/i,
      /1対1対応.*数学/,
      /大学への数学/,
      /確率/,
      /微分積分/,
      /線形代数/,
      /数学$/,
      /数学問題/,
    ],
  },
  {
    subject: "english",
    patterns: [
      /英語/,
      /英文(法|解釈|読解|作文|読解)/,
      /英[単語熟語]/,
      /[Ee]nglish/,
      /TOEIC/i,
      /TOEFL/i,
      /英検/,
      /速読英[熟単]/,
      /ターゲット.*英/,
      /Duo\s*3/i,
      /システム英単語/,
      /リーディング/,
      /リスニング/,
    ],
  },
  {
    subject: "japanese",
    patterns: [
      /国語/,
      /現代文/,
      /古[文典語]/,
      /漢文/,
      /小論文/,
      /古典文法/,
      /出口.*現代文/,
      /田村.*現代文/,
    ],
  },
  {
    subject: "science",
    patterns: [
      /物理[基礎]?/,
      /化学[基礎]?/,
      /生物[基礎]?/,
      /地学[基礎]?/,
      /理科/,
    ],
  },
  {
    subject: "social",
    patterns: [
      /世界史/,
      /日本史/,
      /地理[AB総]/,
      /政治経済/,
      /倫理/,
      /現代社会/,
      /歴史総合/,
      /地理総合/,
      /公共/,
      /地理[探究]/,
      /社会/,
    ],
  },
  {
    subject: "info",
    patterns: [
      /情報[IⅠⅡAB]/,
      /情報科学/,
      /プログラミング/,
      /コンピュータ/,
    ],
  },
];

function inferSubject(name: string, currentSubject: string): string {
  for (const rule of SUBJECT_RULES) {
    if (rule.patterns.some((re) => re.test(name))) {
      return rule.subject;
    }
  }
  return currentSubject;
}

// ── subjectDetail 推定 ─────────────────────────────────────
function inferSubjectDetail(name: string, subject: string): string | undefined {
  if (subject === "math") {
    if (/数[学]?[IⅠ][AB]?(?![ⅡBCⅢ])|数学1A|数[IⅠ]A/i.test(name)) return "math-1a";
    if (/数[学]?[IⅠ](?![AB])/i.test(name) && !/[ⅡBCⅢ]/.test(name)) return "math-1";
    if (/数[学]?[IⅠⅡ2][AB]?[ⅡBⅢ]|数学2B|数[IⅠ][IⅠ]B/i.test(name)) return "math-2b";
    if (/数[学]?[IⅡ2](?![AB])/i.test(name) && !/[ⅢB]/.test(name)) return "math-2";
    if (/数[学]?[Ⅲ3C]/i.test(name)) return "math-3c";
    if (/数[学]?A(?![Ⅰ1Ⅱ2B])/i.test(name)) return "math-a";
    if (/数[学]?B(?![Ⅰ1Ⅱ2])/i.test(name)) return "math-b";
    if (/数[学]?C/i.test(name)) return "math-c";
    if (/確率統計|統計/i.test(name)) return "math-statistics";
    if (/ベクトル/i.test(name)) return "math-vector";
  }
  if (subject === "english") {
    if (/英単語|単語|ターゲット|システム英単|DUO|duo|速読英単|Duo/i.test(name)) return "english-vocab";
    if (/英文法|文法|Grammar/i.test(name)) return "english-grammar";
    if (/英作文|Writing/i.test(name)) return "english-writing";
    if (/英文解釈|読解|Reading/i.test(name)) return "english-reading";
    if (/リスニング|Listening/i.test(name)) return "english-listening";
  }
  if (subject === "science") {
    if (/物理基礎/i.test(name)) return "physics-basic";
    if (/物理(?![基礎])/i.test(name)) return "physics";
    if (/化学基礎/i.test(name)) return "chemistry-basic";
    if (/化学(?![基礎])/i.test(name)) return "chemistry";
    if (/生物基礎/i.test(name)) return "biology-basic";
    if (/生物(?![基礎])/i.test(name)) return "biology";
    if (/地学基礎/i.test(name)) return "earth-science-basic";
    if (/地学(?![基礎])/i.test(name)) return "earth-science";
  }
  if (subject === "social") {
    if (/世界史探究|世界史B/i.test(name)) return "world-history";
    if (/世界史(?![AB探究])/i.test(name)) return "world-history";
    if (/日本史探究|日本史B/i.test(name)) return "japanese-history";
    if (/日本史(?![AB探究])/i.test(name)) return "japanese-history";
    if (/地理総合/i.test(name)) return "geography-general";
    if (/地理探究|地理B/i.test(name)) return "geography";
    if (/地理(?![AB総合探究])/i.test(name)) return "geography";
    if (/政治経済/i.test(name)) return "politics-economics";
    if (/倫理/i.test(name)) return "ethics";
    if (/現代社会/i.test(name)) return "modern-society";
    if (/歴史総合/i.test(name)) return "history-general";
    if (/公共/i.test(name)) return "civics";
  }
  if (subject === "japanese") {
    if (/現代文/i.test(name)) return "japanese-modern";
    if (/古文/i.test(name)) return "japanese-classic";
    if (/漢文/i.test(name)) return "japanese-kanbun";
    if (/古典[文語]/i.test(name)) return "japanese-classic";
    if (/小論文/i.test(name)) return "japanese-essay";
  }
  return undefined;
}

// ── level 推定 ─────────────────────────────────────────────
function inferLevel(name: string, currentLevel: TextbookLevel): TextbookLevel {
  // top (最難関)
  if (
    /最[高難]|ハイレベル|難問|[Tt]op|超難|最上位|[赤]本(?!過去問)|最難関|上位[難問]|発展問題|難関突破/i.test(name)
  )
    return "top";

  // advanced (応用)
  if (
    /上級|応用|実戦|実践|発展|[Aa]dvanced|ハイ|[Ss]tandard[Aa]dv|演習[上応]/i.test(name) &&
    !/入門|基礎|やさしい|はじめ|初め|初歩|易|わかる/i.test(name)
  )
    return "advanced";

  // basic (入門・基礎)
  if (
    /入門|基礎|はじめから|初め|初歩|やさしい|わかりやすい|丁寧|ていねい|やさし[いい]|基本|[Bb]asic|易しい|やさしく|[Ss]tarter|[Bb]eginn/i.test(
      name
    )
  )
    return "basic";

  // standard (標準)
  if (
    /標準|[Ss]tandard|中級|定番|必修|[Cc]ore|普通|[Mm]iddle/i.test(name)
  )
    return "standard";

  return currentLevel;
}

// ── usageTags 推定 ──────────────────────────────────────────
function inferUsageTags(name: string, currentTags: TextbookUsageTag[]): TextbookUsageTag[] {
  const tags = new Set<TextbookUsageTag>(currentTags);

  // 単語系
  if (
    /単語|ターゲット|システム英単|DUO|Duo|速読英単|英熟語|英単語|シス単|鉄壁|金フレ|[Vv]ocab/i.test(name)
  )
    tags.add("vocab");

  // 問題集・演習系
  if (
    /問題集|演習|ドリル|練習問題|問題精講|入試問題|過去問(?!集)|実戦問題|[Dd]rill|[Ee]xercise/i.test(
      name
    ) && !/過去問集/i.test(name)
  )
    tags.add("drill");

  // 過去問
  if (
    /過去問|赤本|青本|共通テスト.*問題集|[Pp]ast.*[Ee]xam|センター試験.*過去/i.test(name)
  )
    tags.add("past-exam");

  // 講義系・インプット
  if (
    /入門|はじめからていねいに|わかりやすい|講義|講座|[Ll]ecture|解説|やさしい|読み物|[Ii]ntro/i.test(
      name
    )
  )
    tags.add("input");

  // 網羅系
  if (
    /網羅|チャート式|[Ff]ocus.*[Gg]old|[Gg]old|体系|総合|全範囲|完全|[Cc]omplete/i.test(name)
  )
    tags.add("comprehensive");

  // 模試対策
  if (/模試|共通テスト対策|センター対策|模擬|[Mm]ock/i.test(name))
    tags.add("mock-prep");

  // 短期
  if (/短期|\d+日間?|[Ss]peed|速攻|速習|一問一答/i.test(name))
    tags.add("speed-run");

  // 弱点補強
  if (/弱点|苦手|補強|克服/i.test(name)) tags.add("weak-point");

  // タグが空なら drill をデフォルトとして付与 (問題集っぽいものが大半)
  if (tags.size === 0) tags.add("drill");

  return [...tags];
}

// ── forGrades 推定 ─────────────────────────────────────────
function inferForGrades(name: string, currentGrades: string[]): string[] {
  if (/高[一1１]年?|1年生|一年生/i.test(name)) return ["h1"];
  if (/高[二2２]年?|2年生|二年生/i.test(name)) return ["h1", "h2"];
  if (/高[三3３]年?|3年生|三年生/i.test(name)) return ["h2", "h3", "ronin"];
  if (/浪人/i.test(name)) return ["h3", "ronin"];
  // 指定なしは全学年
  return currentGrades.length > 0 ? currentGrades : ["h1", "h2", "h3", "ronin"];
}

// ── オブジェクトシリアライズ ─────────────────────────────────
function serializeTextbook(tb: Textbook): string {
  const lines: string[] = ["  {"];
  for (const [key, val] of Object.entries(tb)) {
    if (val === undefined || val === null) continue;
    if (Array.isArray(val)) {
      if (val.length === 0) {
        lines.push(`    ${key}: [],`);
      } else {
        const items = val.map((v: unknown) => JSON.stringify(v)).join(", ");
        lines.push(`    ${key}: [${items}],`);
      }
    } else if (typeof val === "string") {
      lines.push(`    ${key}: ${JSON.stringify(val)},`);
    } else if (typeof val === "number") {
      lines.push(`    ${key}: ${val},`);
    } else if (typeof val === "boolean") {
      lines.push(`    ${key}: ${val},`);
    } else {
      lines.push(`    ${key}: ${JSON.stringify(val)},`);
    }
  }
  lines.push("  }");
  return lines.join("\n");
}

async function main() {
  console.log("Loading textbooks-bulk.ts ...");
  const mod = await import(BULK_PATH + `?t=${Date.now()}`);
  const textbooks: Textbook[] = mod.TEXTBOOKS_BULK;
  const originalCount = textbooks.length;
  console.log(`読み込み件数: ${originalCount}`);

  let excludedCount = 0;
  let subjectChangedCount = 0;
  let levelChangedCount = 0;
  let subjectDetailAddedCount = 0;
  let tagsChangedCount = 0;

  const result: Textbook[] = [];

  for (const tb of textbooks) {
    const name = tb.name || "";

    // ── 除外判定 ──────────────────────────────────────────
    if (isExcluded(name)) {
      excludedCount++;
      continue;
    }

    // ── subject 改善 ──────────────────────────────────────
    const newSubject = inferSubject(name, tb.subject);
    if (newSubject !== tb.subject) subjectChangedCount++;

    // ── subjectDetail ─────────────────────────────────────
    const newSubjectDetail = inferSubjectDetail(name, newSubject);
    if (newSubjectDetail && newSubjectDetail !== tb.subjectDetail) {
      subjectDetailAddedCount++;
    }

    // ── level 改善 ────────────────────────────────────────
    const newLevel = inferLevel(name, tb.level);
    if (newLevel !== tb.level) levelChangedCount++;

    // ── usageTags 改善 ────────────────────────────────────
    const newTags = inferUsageTags(name, tb.usageTags);
    if (JSON.stringify(newTags.sort()) !== JSON.stringify([...tb.usageTags].sort())) {
      tagsChangedCount++;
    }

    // ── forGrades 改善 ────────────────────────────────────
    const newForGrades = inferForGrades(name, tb.forGrades);

    result.push({
      ...tb,
      subject: newSubject,
      ...(newSubjectDetail ? { subjectDetail: newSubjectDetail } : {}),
      level: newLevel,
      usageTags: newTags,
      forGrades: newForGrades,
    });
  }

  const finalCount = result.length;

  // ── ファイル生成 ──────────────────────────────────────────
  const now = new Date().toISOString();
  const header = `// @ts-nocheck
// AUTO-GENERATED by scripts/bulk-textbooks.ts
// openBD + NDL OpenSearch から取得した参考書バルクデータ
// 手書きの src/lib/textbooks.ts と src/lib/master/textbooks/index.ts は触らない
//
// 生成日時: ${now}
// 件数: ${finalCount}
// meta改善: subject${subjectChangedCount}件 level${levelChangedCount}件 subjectDetail${subjectDetailAddedCount}件 tags${tagsChangedCount}件
// 中学小学除外: ${excludedCount}件

import type { Textbook } from "./types";

export const TEXTBOOKS_BULK: Textbook[] = [
`;

  const body = result.map(serializeTextbook).join(",\n");
  const output = header + body + "\n];\n";

  await writeFile(BULK_PATH, output, "utf-8");

  console.log(`\n✓ ${BULK_PATH} を更新しました`);
  console.log(`  中学・小学除外: ${excludedCount}件`);
  console.log(`  subject 再分類: ${subjectChangedCount}件`);
  console.log(`  subjectDetail 追加: ${subjectDetailAddedCount}件`);
  console.log(`  level 再分類: ${levelChangedCount}件`);
  console.log(`  usageTags 更新: ${tagsChangedCount}件`);
  console.log(`  合計: ${originalCount} → ${finalCount} 件`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
