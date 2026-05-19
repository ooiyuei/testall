// 今日のスケジュールエンジン v0.1
// 「今からやる」を押した瞬間〜就寝まで、15分刻みで自動スケジューリング。
// ご飯・お風呂で崩れても「途中復帰」で現在時刻から再計算するだけ。

export type ScheduleInput = {
  startTime: string;     // "16:42" — 現在時刻
  bedtime: string;       // "24:00" — 就寝時間
  finalBlocks: number;   // 計画AIが決めた目標ブロック数
  tasks?: { title: string; blocks: number; subject?: string; taskId?: string }[];
  fixedSlots?: { startTime: string; durationMin: number; label: string }[];
  subjects?: string[];   // 各ブロックに割り当てたい科目 (例: ["math","math","english"])
};

export type ScheduleSlot = {
  startTime: string;       // "16:45" (15分刻み)
  durationMin: number;     // 15, 30, 45...
  kind: "study" | "break" | "buffer" | "meal" | "sleep-soon";
  label: string;
  blockIdx?: number;       // 0始まりのブロック番号
  taskId?: string;
};

export type ScheduleResult = {
  slots: ScheduleSlot[];
  finalBlocks: number;   // 実際に入ったブロック数
  fitsInTime: boolean;   // 就寝までに収まったか
};

// ── 時刻ユーティリティ ─────────────────────

export function timeToMin(hhmm: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return 0;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  // 24:xx は翌日0時以降として保持（24*60+mm）
  return h * 60 + mm;
}

export function minToTime(totalMin: number): string {
  // 24:00 以降は "24:xx" 形式で返す（就寝時間と比較できるように）
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** 15分単位に切り上げ or 切り捨て */
export function roundToQuarter(hhmm: string, dir: "up" | "down"): string {
  const total = timeToMin(hhmm);
  const unit = 15;
  if (dir === "up") {
    return minToTime(Math.ceil(total / unit) * unit);
  }
  return minToTime(Math.floor(total / unit) * unit);
}

// ── ラベル生成ヘルパー ─────────────────────

const SUBJECT_LABEL: Record<string, string> = {
  japanese: "国語",
  math: "数学",
  english: "英語",
  science: "理科",
  social: "社会",
};

function subjectLabel(s: string | undefined): string {
  if (!s) return "";
  return SUBJECT_LABEL[s] ?? s;
}

function studyLabel(
  blockIdx: number,
  tasks: ScheduleInput["tasks"],
  subjects: string[] | undefined,
): string {
  // まず tasks から割り当てを決める
  let taskTitle: string | undefined;
  let taskSubject: string | undefined;

  if (tasks && tasks.length > 0) {
    let remaining = blockIdx;
    for (const t of tasks) {
      if (remaining < t.blocks) {
        taskTitle = t.title;
        taskSubject = t.subject;
        break;
      }
      remaining -= t.blocks;
    }
  }

  const subj = taskSubject
    ? subjectLabel(taskSubject)
    : subjects && subjects[blockIdx]
    ? subjectLabel(subjects[blockIdx])
    : "";

  const prefix = subj ? `${subj} ` : "";
  const title = taskTitle ?? "自由学習";
  return `${prefix}${title} (B${blockIdx + 1})`;
}

// ── メインエンジン ─────────────────────────

export function buildTodaySchedule(input: ScheduleInput): ScheduleResult {
  const { finalBlocks, tasks, subjects, fixedSlots } = input;

  // 1. startTime を 15分切り上げ
  const startMin = timeToMin(roundToQuarter(input.startTime, "up"));
  const bedMin = timeToMin(input.bedtime);

  // 就寝前 60分は新規ブロック追加しない
  const blockCutoffMin = bedMin - 60;

  // 2. 固定スロット（食事など）をマップ化
  type FixedBlock = { startMin: number; endMin: number; label: string };
  const fixed: FixedBlock[] = (fixedSlots ?? [])
    .map((fs) => {
      const s = timeToMin(roundToQuarter(fs.startTime, "down"));
      return { startMin: s, endMin: s + fs.durationMin, label: fs.label };
    })
    .sort((a, b) => a.startMin - b.startMin);

  const slots: ScheduleSlot[] = [];
  let cursor = startMin;
  let blockIdx = 0;
  let consecutiveStudy = 0; // 2ブロック連続したらロングブレイク

  while (cursor < bedMin) {
    // 固定スロットが今ここに重なるか確認
    const overlap = fixed.find(
      (f) => f.startMin >= cursor && f.startMin < cursor + 15,
    );

    if (overlap) {
      // 食事などの固定スロット
      slots.push({
        startTime: minToTime(cursor),
        durationMin: overlap.endMin - overlap.startMin,
        kind: "meal",
        label: overlap.label,
      });
      cursor = overlap.endMin;
      consecutiveStudy = 0;
      continue;
    }

    // 就寝 60分前クッション
    if (cursor >= blockCutoffMin) {
      const remainMin = bedMin - cursor;
      if (remainMin > 0) {
        slots.push({
          startTime: minToTime(cursor),
          durationMin: remainMin,
          kind: "sleep-soon",
          label: "就寝準備",
        });
      }
      cursor = bedMin;
      break;
    }

    // ブロックが全て詰まった場合はバッファで埋める
    if (blockIdx >= finalBlocks) {
      // 15分単位でバッファ
      const remainBeforeCutoff = blockCutoffMin - cursor;
      if (remainBeforeCutoff <= 0) break;
      slots.push({
        startTime: minToTime(cursor),
        durationMin: Math.min(15, remainBeforeCutoff),
        kind: "buffer",
        label: "自由時間",
      });
      cursor += 15;
      continue;
    }

    // 2ブロック連続 → 15分ロングブレイク
    if (consecutiveStudy >= 2) {
      slots.push({
        startTime: minToTime(cursor),
        durationMin: 15,
        kind: "break",
        label: "ひと休み",
      });
      cursor += 15;
      consecutiveStudy = 0;
      continue;
    }

    // 次のブロック (30分) が収まるか確認
    const blockEnd = cursor + 30;
    if (blockEnd > blockCutoffMin) {
      // このブロックは入らない → バッファへ
      slots.push({
        startTime: minToTime(cursor),
        durationMin: blockCutoffMin - cursor,
        kind: "buffer",
        label: "自由時間",
      });
      cursor = blockCutoffMin;
      break;
    }

    // 学習ブロック: 25分集中
    slots.push({
      startTime: minToTime(cursor),
      durationMin: 25,
      kind: "study",
      label: studyLabel(blockIdx, tasks, subjects),
      blockIdx,
    });
    cursor += 25;

    // 5分休憩
    slots.push({
      startTime: minToTime(cursor),
      durationMin: 5,
      kind: "break",
      label: "小休憩",
      blockIdx,
    });
    cursor += 5;

    blockIdx++;
    consecutiveStudy++;
  }

  const fitsInTime = blockIdx >= finalBlocks;

  return {
    slots,
    finalBlocks: blockIdx,
    fitsInTime,
  };
}
