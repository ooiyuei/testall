// today-schedule.test.ts — 最小限の単体テスト
// tsx で実行: npx tsx src/lib/planning/today-schedule.test.ts

import {
  roundToQuarter,
  buildTodaySchedule,
  timeToMin,
} from "./today-schedule";

let passed = 0;
let failed = 0;

function assert(desc: string, actual: unknown, expected: unknown) {
  const ok =
    typeof expected === "object"
      ? JSON.stringify(actual) === JSON.stringify(expected)
      : actual === expected;
  if (ok) {
    console.log(`  PASS  ${desc}`);
    passed++;
  } else {
    console.error(`  FAIL  ${desc}`);
    console.error(`        expected: ${JSON.stringify(expected)}`);
    console.error(`        actual  : ${JSON.stringify(actual)}`);
    failed++;
  }
}

// ── roundToQuarter ─────────────────────────
console.log("\nroundToQuarter");

assert("16:42 up → 16:45", roundToQuarter("16:42", "up"), "16:45");
assert("16:45 up → 16:45 (既に15分刻み)", roundToQuarter("16:45", "up"), "16:45");
assert("16:46 up → 17:00", roundToQuarter("16:46", "up"), "17:00");
assert("16:42 down → 16:30", roundToQuarter("16:42", "down"), "16:30");
assert("23:59 up → 24:00", roundToQuarter("23:59", "up"), "24:00");

// ── buildTodaySchedule — 基本ケース ────────
console.log("\nbuildTodaySchedule — 基本");

{
  const r = buildTodaySchedule({
    startTime: "22:00",
    bedtime: "24:00",
    finalBlocks: 3,
  });
  // 22:00 → 23:00 がブロック禁止クッション (就寝60分前)
  // 実際に入れられるのは 22:00〜23:00 の 60分 = 2ブロック (30分×2)
  assert("fitsInTime=false (入らないケース)", r.fitsInTime, false);
  assert("finalBlocks <= 2", r.finalBlocks <= 2, true);
  const studySlots = r.slots.filter((s) => s.kind === "study");
  assert("学習スロット 2以下", studySlots.length <= 2, true);
}

// ── buildTodaySchedule — 十分な時間 ─────────
console.log("\nbuildTodaySchedule — 十分な時間");

{
  const r = buildTodaySchedule({
    startTime: "17:00",
    bedtime: "24:00",
    finalBlocks: 4,
  });
  assert("fitsInTime=true", r.fitsInTime, true);
  assert("finalBlocks=4", r.finalBlocks, 4);

  const studySlots = r.slots.filter((s) => s.kind === "study");
  assert("学習スロット 4つ", studySlots.length, 4);

  // blockIdx は 0 始まり連番
  const indices = studySlots.map((s) => s.blockIdx);
  assert("blockIdx 0〜3", JSON.stringify(indices), JSON.stringify([0, 1, 2, 3]));

  // 先頭スロットは 17:00 (既に15分刻み)
  assert("先頭時刻 17:00", r.slots[0].startTime, "17:00");
}

// ── buildTodaySchedule — 切り上げ ──────────
console.log("\nbuildTodaySchedule — 開始時刻切り上げ");

{
  const r = buildTodaySchedule({
    startTime: "16:42",
    bedtime: "24:00",
    finalBlocks: 1,
  });
  assert("先頭スロット 16:45 (切り上げ)", r.slots[0].startTime, "16:45");
}

// ── buildTodaySchedule — 固定スロット ───────
console.log("\nbuildTodaySchedule — 固定スロット (食事)");

{
  const r = buildTodaySchedule({
    startTime: "17:00",
    bedtime: "24:00",
    finalBlocks: 3,
    fixedSlots: [{ startTime: "18:00", durationMin: 30, label: "夕食" }],
  });
  const mealSlots = r.slots.filter((s) => s.kind === "meal");
  assert("食事スロットが 1つある", mealSlots.length, 1);
  assert("食事ラベル", mealSlots[0].label, "夕食");
}

// ── buildTodaySchedule — tasks 割り当て ─────
console.log("\nbuildTodaySchedule — tasks 割り当て");

{
  const r = buildTodaySchedule({
    startTime: "17:00",
    bedtime: "24:00",
    finalBlocks: 2,
    tasks: [{ title: "数学 場合の数", blocks: 2, subject: "math" }],
  });
  const studySlots = r.slots.filter((s) => s.kind === "study");
  assert("学習ラベルに科目が含まれる", studySlots[0].label.includes("数学"), true);
}

// ── sleep-soon スロット ──────────────────────
console.log("\nbuildTodaySchedule — 就寝直前クッション");

{
  const r = buildTodaySchedule({
    startTime: "23:30",
    bedtime: "24:00",
    finalBlocks: 5,
  });
  const sleepSlots = r.slots.filter((s) => s.kind === "sleep-soon");
  assert("就寝準備スロットが存在", sleepSlots.length > 0, true);
}

// ── 2ブロック連続でロングブレイク ─────────────
console.log("\nbuildTodaySchedule — 2ブロック後ロングブレイク");

{
  const r = buildTodaySchedule({
    startTime: "17:00",
    bedtime: "24:00",
    finalBlocks: 4,
  });
  // 2ブロック (B1,B2) の後に 15分 break が入るはず
  const slots = r.slots;
  // study が 2つ続いた後の休憩を探す
  let foundLongBreak = false;
  for (let i = 0; i < slots.length - 1; i++) {
    if (
      slots[i].kind === "break" &&
      slots[i].label === "ひと休み" &&
      slots[i].durationMin === 15
    ) {
      foundLongBreak = true;
      break;
    }
  }
  assert("2ブロック後に15分ロングブレイクがある", foundLongBreak, true);
}

// ── 結果サマリ ───────────────────────────────
console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
