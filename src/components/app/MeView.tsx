"use client";

// マイページ v2 - ユーザー要件に沿った再構築:
//   ヘッダ: 名前 / 学年 / 第一志望 / @ユーザーID
//   タップで自己紹介展開 (性別/生年月日/都道府県/高校/志望校1〜3)
//   本棚: 現在使ってる参考書・教科書 (追加可)
//   ステータス五角形: 主要5科目
//     クリック → 9教科8科目
//     さらにクリック → 教科ごとの詳細 (領域・単元・能力値, 1〜3年トグル)
//
//   削除: 連続日数 / 今月完了数 / テスト統計 / 本番カウントダウン

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AtSign,
  BookMarked,
  ChevronDown,
  ChevronRight,
  Edit3,
  GraduationCap,
  Plus,
  Settings,
  Target,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/hooks/useStore";
import {
  addBookshelfItem,
  ensureUserId,
  removeBookshelfItem,
  setProfile,
  DEVIATION_BUCKETS,
} from "@/lib/store";
import type {
  BookshelfItem,
  DeviationBucket,
  StoredProfile,
} from "@/lib/store";
import { GRADES } from "@/lib/subjects";
import { findUniversity } from "@/lib/universities";
import {
  CURRICULUM,
  SUBJECT_AREAS,
} from "@/lib/master/subjects/hierarchy";
import type { GradeId, SubjectAreaId } from "@/lib/master/subjects";
import { RadarChart, type RadarPoint } from "@/components/me/RadarChart";
import { BookshelfAddModal } from "@/components/me/BookshelfAddModal";
import { LevelMountain } from "@/components/me/LevelMountain";
import { computeTotalExp, levelFromExp } from "@/lib/exp";
import { defaultRemainingMonths, estimateGoalGap, estimateRequiredBlocks } from "@/lib/planning";

// 主要5科目（五角形）
const PRIMARY_AREAS: SubjectAreaId[] = [
  "japanese",
  "math",
  "english",
  "science",
  "history",
];

export function MeView() {
  const { state, hydrated } = useStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [focusedArea, setFocusedArea] = useState<SubjectAreaId | null>(null);
  const [bookshelfModal, setBookshelfModal] = useState(false);
  const [gradeToggle, setGradeToggle] = useState<GradeId>("h2");

  if (!hydrated) {
    return <div className="px-4 pt-10 text-sm text-ink-500">読み込み中…</div>;
  }

  const profile = state.profile;
  const userId = profile?.userId ?? ensureUserId();

  const gradeLabel =
    GRADES.find((g) => g.id === profile?.grade)?.name ?? "学年未設定";

  const firstTarget = profile?.targetUniversities?.[0];
  const firstUniName = firstTarget
    ? findUniversity(firstTarget.universityId)?.shortName ??
      findUniversity(firstTarget.universityId)?.name ??
      "志望校未設定"
    : "志望校未設定";

  // ステータス値: テスト結果から算出（暫定: 50固定 or直近結果）
  // TODO: 計画AI v0.2 で能力値ベースに置き換え
  const statusPoints = buildStatusPoints(state.tests, PRIMARY_AREAS);

  const allBookshelf: BookshelfItem[] = profile?.bookshelfItems ?? [];

  return (
    <div className="px-5 pb-8 pt-3 space-y-5">
      {/* ── ヘッダ ── */}
      <button
        type="button"
        onClick={() => setProfileOpen((v) => !v)}
        className="w-full overflow-hidden rounded-2xl border border-ink-100/80 bg-white p-4 text-left active:scale-[0.99] transition"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-ink-900 text-base font-bold text-white">
            {profile?.name?.[0] ?? "あ"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[15px] font-bold text-ink-900 truncate">
                {profile?.name ?? "あなた"}
              </span>
              <span className="flex items-center text-[10px] font-medium text-ink-400">
                <AtSign className="h-2.5 w-2.5" />
                {userId}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-500">
              <GraduationCap className="h-3 w-3" />
              {gradeLabel}
              <span className="mx-0.5 text-ink-300">·</span>
              <Target className="h-3 w-3" />
              <span className="truncate">{firstUniName}</span>
            </div>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 flex-none text-ink-400 transition-transform",
              profileOpen && "rotate-180",
            )}
          />
        </div>
      </button>

      {/* ── 自己紹介（展開時） ── */}
      {profileOpen ? (
        <ProfileDetails
          profile={profile}
          editing={editing}
          onEditToggle={() => setEditing((v) => !v)}
        />
      ) : null}

      {/* ── LV/経験値/山グラフ ── */}
      <LevelSection />

      {/* ── 本棚 ── */}
      <section>
        <div className="flex items-center justify-between">
          <SectionTitle icon={BookMarked} title="本棚" />
          <button
            type="button"
            onClick={() => setBookshelfModal(true)}
            className="flex h-7 items-center gap-1 rounded-full bg-cream-100 px-2.5 text-[10px] font-bold text-ink-700 hover:bg-cream-200"
          >
            <Plus className="h-3 w-3" />
            追加
          </button>
        </div>
        {allBookshelf.length === 0 ? (
          <p className="mt-2 text-[11px] text-ink-500">
            参考書・教科書がまだありません。
          </p>
        ) : (
          <ul className="mt-2 grid grid-cols-2 gap-2">
            {allBookshelf.map((b) => (
              <li
                key={b.id}
                className="relative rounded-2xl border border-ink-100/80 bg-white p-3"
              >
                <div className="text-[9px] font-bold uppercase tracking-widest text-ink-500">
                  {KIND_LABEL[b.kind]}
                </div>
                <div className="mt-0.5 text-xs font-black text-ink-900 line-clamp-2">
                  {b.name}
                </div>
                {b.progressPct !== undefined ? (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream-100">
                    <div
                      className="h-full rounded-full bg-sky-500"
                      style={{ width: `${b.progressPct}%` }}
                    />
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => removeBookshelfItem(b.id)}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full text-ink-400 hover:bg-cream-100"
                  aria-label="削除"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── ステータス（五角形 + 9教科 + 偏差値/スコア） ── */}
      <StatusCard
        profile={profile}
        statusPoints={statusPoints}
        focusedArea={focusedArea}
        onFocus={setFocusedArea}
        gradeToggle={gradeToggle}
        onGradeChange={setGradeToggle}
      />

      {/* ── メニュー ── */}
      <ul className="divide-y divide-ink-100/70 overflow-hidden rounded-2xl border border-ink-100/80 bg-white">
        <MenuLink
          href="/app/me/settings"
          icon={<Settings className="h-4 w-4" />}
          label="設定"
        />
      </ul>

      <p className="text-center text-[10px] text-ink-400">Testall v0.5.0</p>

      {/* ── 本棚追加モーダル ── */}
      {bookshelfModal ? (
        <BookshelfAddModal onClose={() => setBookshelfModal(false)} />
      ) : null}
    </div>
  );
}

// ─── 自己紹介（編集可能） ───
function ProfileDetails({
  profile,
  editing,
  onEditToggle,
}: {
  profile?: StoredProfile;
  editing: boolean;
  onEditToggle: () => void;
}) {
  const [draft, setDraft] = useState<Partial<StoredProfile>>({});
  const merged = { ...profile, ...draft };

  function save() {
    if (!profile) return;
    setProfile({ ...profile, ...draft });
    setDraft({});
    onEditToggle();
  }

  return (
    <section className="rounded-2xl border border-ink-100/80 bg-white p-4">
      <div className="flex items-center justify-between">
        <SectionTitle icon={Edit3} title="自己紹介" />
        {editing ? (
          <button
            type="button"
            onClick={save}
            className="flex h-7 items-center rounded-full bg-sky-500 px-3 text-[10px] font-black text-white"
          >
            保存
          </button>
        ) : (
          <button
            type="button"
            onClick={onEditToggle}
            className="flex h-7 items-center rounded-full bg-cream-100 px-3 text-[10px] font-bold text-ink-700"
          >
            編集
          </button>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <FieldRow
          label="名前"
          value={merged.name}
          editing={editing}
          onChange={(v) => setDraft((d) => ({ ...d, name: v }))}
          placeholder="未設定"
        />
        <FieldRow
          label="性別"
          value={GENDER_LABEL[merged.gender ?? "na"]}
          editing={editing}
          options={[
            { value: "male", label: "男性" },
            { value: "female", label: "女性" },
            { value: "other", label: "その他" },
            { value: "na", label: "回答しない" },
          ]}
          onChange={(v) => setDraft((d) => ({ ...d, gender: v as StoredProfile["gender"] }))}
          rawValue={merged.gender ?? "na"}
        />
        <FieldRow
          label="生年月日"
          value={merged.birthdate ?? ""}
          editing={editing}
          type="date"
          onChange={(v) => setDraft((d) => ({ ...d, birthdate: v }))}
        />
        <FieldRow
          label="都道府県"
          value={merged.prefecture ?? ""}
          editing={editing}
          onChange={(v) => setDraft((d) => ({ ...d, prefecture: v }))}
          placeholder="例: 東京都"
        />
        <FieldRow
          label="高校"
          value={merged.schoolName ?? ""}
          editing={editing}
          onChange={(v) => setDraft((d) => ({ ...d, schoolName: v }))}
          placeholder="例: ○○高校"
        />
      </div>

      {/* 志望校1〜3 */}
      <div className="mt-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
          志望校
        </div>
        <ul className="mt-1.5 space-y-1.5">
          {[1, 2, 3].map((p) => {
            const t = profile?.targetUniversities?.find((x) => x.priority === p);
            const u = t ? findUniversity(t.universityId) : undefined;
            return (
              <li
                key={p}
                className="flex items-center gap-3 rounded-2xl bg-cream-50 px-3 py-2"
              >
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-xl bg-sky-500 text-[10px] font-black text-white">
                  第{p}
                </span>
                <span className="flex-1 truncate text-xs font-bold text-ink-900">
                  {u ? u.name : "未設定"}
                </span>
                {t?.faculty ? (
                  <span className="text-[10px] text-ink-500">{t.faculty}</span>
                ) : null}
              </li>
            );
          })}
        </ul>
        <Link
          href="/onboarding"
          className="mt-2 inline-flex h-7 items-center gap-1 text-[10px] font-bold text-sky-600"
        >
          志望校を編集
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </section>
  );
}

const GENDER_LABEL: Record<string, string> = {
  male: "男性",
  female: "女性",
  other: "その他",
  na: "未設定",
};

function FieldRow({
  label,
  value,
  editing,
  onChange,
  placeholder,
  type,
  options,
  rawValue,
}: {
  label: string;
  value?: string;
  editing: boolean;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  options?: { value: string; label: string }[];
  rawValue?: string;
}) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
        {label}
      </div>
      {editing ? (
        options ? (
          <select
            value={rawValue ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="mt-1 h-9 w-full rounded-xl border border-cream-200 bg-cream-50 px-2 text-sm text-ink-900 outline-none focus:border-sky-400 focus:bg-white"
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            type={type}
            className="mt-1 h-9 w-full rounded-xl border border-cream-200 bg-cream-50 px-2 text-sm text-ink-900 outline-none focus:border-sky-400 focus:bg-white"
          />
        )
      ) : (
        <div className="mt-1 text-sm font-bold text-ink-900">
          {value || (placeholder ?? "—")}
        </div>
      )}
    </div>
  );
}

// ─── 教科詳細（領域・単元・能力値） ───
function AreaDetail({
  area,
  gradeToggle,
  onGradeChange,
  onClose,
}: {
  area: SubjectAreaId;
  gradeToggle: GradeId;
  onGradeChange: (g: GradeId) => void;
  onClose: () => void;
}) {
  const subjects = useMemo(
    () => CURRICULUM.filter((s) => s.area === area),
    [area],
  );
  const visibleSubjects = useMemo(
    () => subjects.filter((s) => s.grades.includes(gradeToggle)),
    [subjects, gradeToggle],
  );
  const areaDef = SUBJECT_AREAS.find((a) => a.id === area)!;

  // 能力値の集計（領域に出現する全 ability）
  const abilityCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of visibleSubjects) {
      for (const d of s.domains) {
        for (const u of d.units) {
          for (const a of u.abilities ?? []) {
            map.set(a, (map.get(a) ?? 0) + 1);
          }
        }
      }
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [visibleSubjects]);

  return (
    <section className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4">
      <div className="flex items-center justify-between">
        <SectionTitle
          icon={ChevronRight}
          title={`${areaDef.name}の詳細`}
        />
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-ink-500"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 学年トグル */}
      <ul className="mt-2 flex gap-1">
        {(["h1", "h2", "h3"] as GradeId[]).map((g) => (
          <li key={g}>
            <button
              type="button"
              onClick={() => onGradeChange(g)}
              className={cn(
                "h-7 rounded-full px-3 text-[10px] font-bold",
                gradeToggle === g
                  ? "bg-sky-500 text-white"
                  : "bg-white text-ink-700",
              )}
            >
              {g === "h1" ? "高1" : g === "h2" ? "高2" : "高3"}
            </button>
          </li>
        ))}
      </ul>

      {/* 科目 → 領域 → 単元 */}
      <ul className="mt-3 space-y-2">
        {visibleSubjects.map((s) => (
          <li
            key={s.id}
            className="rounded-2xl bg-white p-3"
          >
            <div className="text-xs font-black text-ink-900">{s.name}</div>
            <ul className="mt-1.5 space-y-1.5">
              {s.domains.map((d) => (
                <li key={d.id}>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
                    {d.name}
                  </div>
                  <ul className="mt-1 flex flex-wrap gap-1">
                    {d.units.map((u) => (
                      <li
                        key={u.id}
                        className="rounded-full bg-cream-50 px-2 py-0.5 text-[10px] text-ink-700"
                      >
                        {u.name}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      {/* 能力値リスト */}
      {abilityCounts.length > 0 ? (
        <div className="mt-3 rounded-2xl bg-white p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
            必要な能力値
          </div>
          <ul className="mt-1.5 flex flex-wrap gap-1">
            {abilityCounts.map(([name, count]) => (
              <li
                key={name}
                className="rounded-full bg-peach-100 px-2 py-0.5 text-[10px] font-bold text-peach-500"
              >
                {name}
                <span className="ml-1 text-ink-400 tabular-nums">×{count}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

// ─── 本棚追加 ─── (新しい検索・絞り込み付きモーダルを使う)

const KIND_LABEL: Record<BookshelfItem["kind"], string> = {
  textbook: "参考書",
  "school-textbook": "教科書",
  workbook: "問題集",
  "past-exam": "過去問",
  other: "その他",
};

// ─── ステータスカード ─────────────────────────
function StatusCard({
  profile,
  statusPoints,
  focusedArea,
  onFocus,
  gradeToggle,
  onGradeChange,
}: {
  profile?: StoredProfile;
  statusPoints: RadarPoint[];
  focusedArea: SubjectAreaId | null;
  onFocus: (a: SubjectAreaId | null) => void;
  gradeToggle: GradeId;
  onGradeChange: (g: GradeId) => void;
}) {
  // アプリスコア (暫定): 直近テスト得点率の平均
  const appScore = useMemo(() => {
    if (statusPoints.length === 0) return 0;
    const vals = statusPoints.map((p) => p.value);
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }, [statusPoints]);

  const deviation = profile?.deviation;

  return (
    <section className="rounded-2xl border border-ink-100/80 bg-white p-4">
      <div className="flex items-baseline justify-between">
        <SectionTitle icon={Target} title="ステータス" />
        <span className="text-[10px] text-ink-400">タップで詳細</span>
      </div>

      {/* 数字 (偏差値 / アプリスコア) + 五角形 */}
      <div className="mt-2 flex items-center gap-3">
        <div className="flex-1 space-y-2">
          <div className="rounded-xl bg-cream-50/70 p-2.5">
            <div className="text-[10px] font-medium text-ink-500">偏差値</div>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="text-2xl font-bold leading-none tabular-nums text-ink-900">
                {deviation ?? "—"}
              </span>
            </div>
          </div>
          <div className="rounded-xl bg-cream-50/70 p-2.5">
            <div className="text-[10px] font-medium text-ink-500">アプリスコア</div>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="text-2xl font-bold leading-none tabular-nums text-ink-900">
                {appScore}
              </span>
              <span className="text-[10px] font-medium text-ink-400">/ 100</span>
            </div>
          </div>
        </div>
        {/* 五角形（コンパクト） */}
        <div className="w-[150px] flex-none">
          <RadarChart
            data={statusPoints}
            size={150}
            onPick={(idx) => onFocus(PRIMARY_AREAS[idx])}
          />
        </div>
      </div>

      {/* 9教科グリッド（タップで詳細展開） */}
      <ul className="mt-4 grid grid-cols-3 gap-1.5">
        {SUBJECT_AREAS.map((a) => {
          const focused = focusedArea === a.id;
          return (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => onFocus(focused ? null : a.id)}
                className={cn(
                  "flex w-full items-center gap-1.5 rounded-lg px-2 py-2 transition",
                  focused
                    ? "bg-ink-900 text-white"
                    : "bg-cream-50/80 text-ink-900 hover:bg-cream-100",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 flex-none items-center justify-center rounded-md text-[10px] font-bold",
                    focused ? "bg-white/15 text-white" : a.tone,
                  )}
                >
                  {a.shortName}
                </span>
                <span className="text-[11px] font-bold">{a.name}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* 教科詳細 */}
      {focusedArea ? (
        <div className="mt-3">
          <AreaDetail
            area={focusedArea}
            gradeToggle={gradeToggle}
            onGradeChange={onGradeChange}
            onClose={() => onFocus(null)}
          />
        </div>
      ) : null}
    </section>
  );
}

type TestRecord = ReturnType<typeof useStore>["state"]["tests"][number];

// ─── LV / 経験値 / 山グラフ ─────────────────
function LevelSection() {
  const { state, hydrated } = useStore();
  if (!hydrated) return null;
  const totalExp = computeTotalExp({
    tasks: state.tasks ?? [],
    tests: state.tests ?? [],
    blockLogs: state.blockLogs ?? [],
    loginDays: (state.dailyMoodLogs ?? []).length,
  });
  const lv = levelFromExp(totalExp);

  // 目標 (border 偏差値) までの残りブロック数を概算
  const profile = state.profile;
  let remainingBlocks: number | undefined;
  let overallProgress = Math.min(1, lv.totalExp / 50000);
  let goalLabel = "目標";
  if (profile?.deviation && profile.targetUniversities?.length) {
    const grade = (profile.grade as "h1" | "h2" | "h3" | "ronin") ?? "h2";
    const months = defaultRemainingMonths(grade);
    const remainingWeeks = Math.max(1, Math.round((months * 30) / 7));
    const border = 65;
    const gap = estimateGoalGap({
      targets: [
        {
          universityId: profile.targetUniversities[0].universityId,
          priority: 1,
          borderDeviation: border,
          safeDeviation: border + 3,
          stretchDeviation: border + 5,
        },
      ],
      currentTotal: profile.deviation,
      currentByArea: {},
      remainingWeeks,
    });
    const req = estimateRequiredBlocks({ gap, remainingWeeks });
    const future = req.futureRequiredHours.upper / (25 / 60);
    const done = (state.blockLogs ?? []).length;
    remainingBlocks = Math.max(0, Math.round(future - done));
    overallProgress = Math.min(1, done / Math.max(1, future));
    goalLabel = "本番";
  }

  return (
    <LevelMountain
      level={lv.level}
      currentLevelExp={lv.currentLevelExp}
      nextLevelExp={lv.nextLevelExp}
      goalLabel={goalLabel}
      overallProgress={overallProgress}
      blocksRemaining={remainingBlocks}
    />
  );
}

// ─── ステータス計算 ───
function buildStatusPoints(
  tests: TestRecord[],
  areas: SubjectAreaId[],
): RadarPoint[] {
  // 暫定: 各科目の直近テスト得点率
  // TODO: 計画AI v0.2 で能力値ベース指標に置き換え
  return areas.map((a) => {
    const areaDef = SUBJECT_AREAS.find((x) => x.id === a)!;
    const filtered = tests.filter((t) => guessArea(t.input.subject) === a);
    let value = 0;
    if (filtered.length > 0) {
      const recent = filtered[0];
      value = Math.round((recent.input.score / recent.input.fullScore) * 100);
    } else {
      value = 35; // 未記録のときの薄い表示
    }
    return {
      label: areaDef.name,
      shortLabel: areaDef.shortName,
      value,
    };
  });
}

function guessArea(name: string): SubjectAreaId {
  if (/数学|数IA|数IIBC|数IIIC|数Ⅰ|数Ⅱ|数Ⅲ|数A|数B|数C/.test(name)) return "math";
  if (/英語|英コミュ|英表現|リーディング|リスニング|英作|英解/.test(name)) return "english";
  if (/国語|現代文|古文|古典|漢文/.test(name)) return "japanese";
  if (/物理|化学|生物|地学|理科/.test(name)) return "science";
  if (/日本史|世界史|地理|歴総|地総/.test(name)) return "history";
  if (/公共|倫理|政治経済|政経|社会/.test(name)) return "civics";
  if (/情報/.test(name)) return "info";
  return "math";
}

// ─── 共通 UI ───
function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: typeof Target;
  title: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-ink-500" />
      <h2 className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
        {title}
      </h2>
    </div>
  );
}

function MenuLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 px-4 py-3.5 active:bg-cream-100"
      >
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-cream-100 text-ink-700">
          {icon}
        </span>
        <span className="flex-1 text-sm font-bold text-ink-900">{label}</span>
        <ChevronRight className="h-4 w-4 text-ink-400" />
      </Link>
    </li>
  );
}
