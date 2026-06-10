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
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AtSign,
  BookMarked,
  ChevronDown,
  ChevronRight,
  Edit3,
  GraduationCap,
  Plus,
  Search,
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
import { HighschoolEditModal } from "@/components/me/HighschoolEditModal";
import { LevelCard } from "@/components/me/LevelCard";
import { AnalyticsSection } from "@/components/me/AnalyticsSection";
import { computeTotalExp, levelFromExp } from "@/lib/exp";
import { defaultRemainingMonths, estimateGoalGap, estimateRequiredBlocks } from "@/lib/planning";
import { HOURS_PER_BLOCK } from "@/lib/planning/constants";
import { bucketMid } from "@/lib/store";
import { guessArea, PRIMARY_AREAS } from "@/lib/master/subjects/guessArea";
import { LoadingState } from "@/components/ui/LoadingState";
import { Card } from "@/components/ui/Card";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { MeSkeleton } from "@/components/ui/Skeleton";
import { toDateString } from "@/lib/date-safe";
import { toast } from "@/components/ui/Toast";
import { confirm } from "@/components/ui/ConfirmDialog";
import { PullToRefresh } from "@/components/ui/PullToRefresh";

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];

export function MeView() {
  const { state, hydrated } = useStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [bookshelfModal, setBookshelfModal] = useState(false);

  useEffect(() => {
    if (!profileOpen) setEditing(false);
  }, [profileOpen]);

  if (!hydrated) {
    return <MeSkeleton />;
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
    <PullToRefresh
      onRefresh={() => {
        toast.success("最新の状態に更新しました");
      }}
    >
    <div className="px-5 pb-8 pt-4 space-y-5">
      {/* ── ヘッダ ── */}
      <ProfileButton
        profile={profile}
        userId={userId}
        gradeLabel={gradeLabel}
        firstUniName={firstUniName}
        open={profileOpen}
        onToggle={() => setProfileOpen((v) => !v)}
      />

      {/* ── 自己紹介（展開時） ── */}
      {profileOpen ? (
        <ProfileDetails
          profile={profile}
          editing={editing}
          onEditToggle={() => setEditing((v) => !v)}
        />
      ) : null}

      {/* ── LV/経験値 ── */}
      <LevelSection />

      {/* ── 学習分析 (streak / 週月集計 / 7日バー / 科目配分 / バッジ) ── */}
      <AnalyticsSection />

      {/* ── 本棚 ── */}
      <BookshelfSection
        allBookshelf={allBookshelf}
        onAdd={() => setBookshelfModal(true)}
      />

      {/* ── ステータス（五角形 + 9教科リンク + 偏差値/スコア） ── */}
      <StatusCard profile={profile} statusPoints={statusPoints} />

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
    </PullToRefresh>
  );
}

// ─── プロフィールボタン（ヘッダ） ───────────────────
function ProfileButton({
  profile,
  userId,
  gradeLabel,
  firstUniName,
  open,
  onToggle,
}: {
  profile?: StoredProfile;
  userId: string;
  gradeLabel: string;
  firstUniName: string;
  open: boolean;
  onToggle: () => void;
}) {
  const initials = profile?.name?.[0] ?? "あ";

  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full overflow-hidden rounded-2xl border border-ink-100/80 bg-white p-5 text-left shadow-soft active:scale-[0.99] transition"
    >
      <div className="flex items-center gap-4">
        {/* アバター: グラデーション背景 */}
        <div
          className="flex h-14 w-14 flex-none items-center justify-center rounded-full text-[18px] font-bold text-white"
          style={{
            background: "linear-gradient(135deg, #3b82f6 0%, #0f9b5e 100%)",
          }}
        >
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          {/* 名前 */}
          <div className="flex items-center gap-2">
            <span className="text-[20px] font-bold leading-tight text-ink-900 truncate">
              {profile?.name ?? "あなた"}
            </span>
          </div>
          {/* @ID — 控えめ */}
          <div className="mt-0.5 flex items-center gap-0.5 text-[10px] text-ink-400">
            <AtSign className="h-2.5 w-2.5 flex-none" />
            <span className="truncate">{userId}</span>
          </div>
          {/* 学年 + 第一志望 */}
          <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-ink-500">
            <GraduationCap className="h-3.5 w-3.5 flex-none" />
            <span>{gradeLabel}</span>
            <span className="text-ink-300">·</span>
            <Target className="h-3.5 w-3.5 flex-none" />
            <span className="truncate">{firstUniName}</span>
          </div>
        </div>

        <ChevronDown
          className={cn(
            "h-5 w-5 flex-none text-ink-300 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </div>
    </button>
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
  const [draft, setDraft] = useState<Partial<StoredProfile>>(() => ({ ...profile }));
  const [highschoolModal, setHighschoolModal] = useState(false);
  const merged = { ...profile, ...draft };

  function save() {
    if (!profile) return;
    setProfile({ ...profile, ...draft });
    setDraft({});
    onEditToggle();
  }

  function handleHighschoolSelect(name: string) {
    setDraft((d) => ({ ...d, schoolName: name }));
    if (profile && !editing) {
      setProfile({ ...profile, schoolName: name });
    }
  }

  return (
    <Card as="section" padding="lg">
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

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
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
          value={merged.prefecture ?? "未設定"}
          editing={editing}
          options={[
            { value: "", label: "未設定" },
            ...PREFECTURES.map((p) => ({ value: p, label: p })),
          ]}
          onChange={(v) => setDraft((d) => ({ ...d, prefecture: v || undefined }))}
          rawValue={merged.prefecture ?? ""}
        />
        <HighschoolField
          editing={editing}
          value={merged.schoolName}
          onChange={(v) => setDraft((d) => ({ ...d, schoolName: v }))}
          onSearch={() => setHighschoolModal(true)}
        />
      </div>

      {/* 志望校1〜3 */}
      <TargetUniversities profile={profile} />

      {highschoolModal ? (
        <HighschoolEditModal
          currentName={merged.schoolName}
          onSelect={handleHighschoolSelect}
          onClose={() => setHighschoolModal(false)}
        />
      ) : null}
    </Card>
  );
}

function HighschoolField({
  editing,
  value,
  onChange,
  onSearch,
}: {
  editing: boolean;
  value?: string;
  onChange: (v: string) => void;
  onSearch: () => void;
}) {
  return (
    <div>
      <div className="text-[10px] font-medium text-ink-500">高校</div>
      {editing ? (
        <div className="mt-1 flex items-center gap-1">
          <input
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="例: ○○高校"
            className="h-9 flex-1 rounded-xl border border-cream-200 bg-cream-50 px-2 text-sm text-ink-900 outline-none focus:border-sky-400 focus:bg-white"
          />
          <button
            type="button"
            onClick={onSearch}
            className="flex h-9 w-9 flex-none items-center justify-center rounded-xl border border-cream-200 bg-cream-50 text-ink-500 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-600 transition"
            aria-label="高校を検索"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="mt-1 flex items-center gap-1">
          <div className="flex-1 text-sm font-bold text-ink-900">
            {value || "未設定"}
          </div>
          <button
            type="button"
            onClick={onSearch}
            className="flex h-7 w-7 flex-none items-center justify-center rounded-lg text-ink-400 hover:bg-cream-100 hover:text-ink-700 transition"
            aria-label="高校を検索"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function TargetUniversities({ profile }: { profile?: StoredProfile }) {
  return (
    <div className="mt-4">
      <div className="text-[10px] font-medium text-ink-500">志望校</div>
      <ul className="mt-2 space-y-1.5">
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
      <div className="text-[10px] font-medium text-ink-500">{label}</div>
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
    <section className="rounded-2xl border border-sky-200 bg-sky-50/70 p-5">
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
      <ul className="mt-3 flex gap-1">
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
      <ul className="mt-4 space-y-2">
        {visibleSubjects.map((s) => (
          <li
            key={s.id}
            className="rounded-2xl bg-white p-4"
          >
            <div className="text-xs font-black text-ink-900">{s.name}</div>
            <ul className="mt-2 space-y-2">
              {s.domains.map((d) => (
                <li key={d.id}>
                  <div className="text-[10px] font-medium text-ink-500">
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

      {abilityCounts.length > 0 ? (
        <div className="mt-4 rounded-2xl bg-white p-4">
          <div className="text-[10px] font-medium text-ink-500">
            必要な能力値
          </div>
          <ul className="mt-2 flex flex-wrap gap-1">
            {abilityCounts.map(([name, count]) => (
              <li
                key={name}
                className="rounded-full bg-coral-100 px-2 py-0.5 text-[10px] font-bold text-coral-500"
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

const KIND_LABEL: Record<BookshelfItem["kind"], string> = {
  textbook: "参考書",
  "school-textbook": "教科書",
  workbook: "問題集",
  "past-exam": "過去問",
  other: "その他",
};

// ─── 本棚セクション ─────────────────────────
function BookshelfSection({
  allBookshelf,
  onAdd,
}: {
  allBookshelf: BookshelfItem[];
  onAdd: () => void;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <SectionTitle icon={BookMarked} title="本棚" />
        <button
          type="button"
          onClick={onAdd}
          className="flex h-8 items-center gap-1.5 rounded-full bg-sky-500 px-3 text-[11px] font-bold text-white hover:bg-sky-600 active:scale-[0.97] transition"
        >
          <Plus className="h-3.5 w-3.5" />
          追加
        </button>
      </div>
      {allBookshelf.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-cream-50/60 p-8 text-center">
          <BookMarked className="mx-auto h-8 w-8 text-ink-300 mb-2" />
          <p className="text-[12px] text-ink-500">
            参考書・教科書がまだありません
          </p>
          <button
            type="button"
            onClick={onAdd}
            className="mt-3 flex h-9 items-center gap-1.5 rounded-full bg-sky-500 px-4 text-[12px] font-bold text-white mx-auto hover:bg-sky-600 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            最初の一冊を追加
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-2">
          {allBookshelf.map((b) => (
            <BookshelfCard key={b.id} item={b} />
          ))}
        </ul>
      )}
    </section>
  );
}

function BookshelfCard({ item }: { item: BookshelfItem }) {
  return (
    <li className="relative rounded-2xl border border-ink-100/80 bg-white p-4 shadow-soft hover:shadow-card active:scale-[0.98] transition">
      <div className="text-[10px] font-medium text-ink-500">
        {KIND_LABEL[item.kind]}
      </div>
      <div className="mt-1 text-xs font-black text-ink-900 line-clamp-2 leading-[1.5]">
        {item.name}
      </div>
      {item.progressPct !== undefined ? (
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-[10px] text-ink-400">
            <span>進捗</span>
            <span className="tabular-nums">{item.progressPct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-cream-100">
            <div
              className="h-full rounded-full bg-sky-500 transition-all"
              style={{ width: `${item.progressPct}%` }}
            />
          </div>
        </div>
      ) : null}
      <button
        type="button"
        onClick={async () => {
          const ok = await confirm({
            title: "本棚から削除しますか?",
            body: `「${item.name}」の進捗も一緒に消えます。`,
            confirmLabel: "削除",
            danger: true,
          });
          if (ok) {
            const snapshot = { ...item };
            removeBookshelfItem(item.id);
            toast.success("本棚から削除しました", {
              action: {
                label: "取り消し",
                onClick: () => addBookshelfItem(snapshot),
              },
            });
          }
        }}
        className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center text-ink-300 hover:text-ink-600 transition"
        aria-label="削除"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-cream-100">
          <X className="h-3.5 w-3.5" />
        </span>
      </button>
    </li>
  );
}

// ─── ステータスカード ─────────────────────────
function StatusCard({
  profile,
  statusPoints,
}: {
  profile?: StoredProfile;
  statusPoints: RadarPoint[];
}) {
  const router = useRouter();
  const appScore = useMemo(() => {
    if (statusPoints.length === 0) return 0;
    const vals = statusPoints.map((p) => p.value);
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }, [statusPoints]);

  const deviation = profile?.deviation;

  return (
    <Card as="section" padding="lg">
      <div className="flex items-baseline justify-between">
        <SectionTitle icon={Target} title="ステータス" />
        <span className="text-[10px] text-ink-400">タップで詳細</span>
      </div>

      {/* 数字 (偏差値 / アプリスコア) */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-cream-50/70 p-3">
          <div className="text-[10px] font-medium text-ink-500">偏差値</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold leading-none tabular-nums text-ink-900">
              {deviation ?? "—"}
            </span>
          </div>
        </div>
        <div className="rounded-xl bg-cream-50/70 p-3">
          <div className="text-[10px] font-medium text-ink-500">アプリスコア</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold leading-none tabular-nums text-ink-900">
              {appScore}
            </span>
            <span className="text-[10px] font-medium text-ink-400">/ 100</span>
          </div>
        </div>
      </div>

      {/* 五角形 */}
      <div className="mt-5">
        <RadarChart
          data={statusPoints}
          size={260}
          onPick={(idx) => {
            const a = PRIMARY_AREAS[idx];
            if (a) router.push(`/app/me/subjects/${a}`);
          }}
        />
      </div>

      {/* 9教科グリッド */}
      <ul className="mt-5 grid grid-cols-3 gap-1.5">
        {SUBJECT_AREAS.map((a) => (
          <li key={a.id}>
            <Link
              href={`/app/me/subjects/${a.id}`}
              className="flex w-full items-center gap-1.5 rounded-xl px-2 py-2.5 bg-cream-50/80 text-ink-900 hover:bg-cream-100 active:scale-[0.97] transition"
            >
              <span
                className={cn(
                  "flex h-6 w-6 flex-none items-center justify-center rounded-md text-[10px] font-bold",
                  a.tone,
                )}
              >
                {a.shortName}
              </span>
              <span className="text-[11px] font-bold">{a.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

type TestRecord = ReturnType<typeof useStore>["state"]["tests"][number];

// ─── LV / 経験値 ─────────────────────────────
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

  const profile = state.profile;
  const done = (state.blockLogs ?? []).length;
  let blocksRemainingByHorizon: Record<"exam" | "year" | "quarter", number> | undefined;
  let blocksDoneByHorizon: Record<"exam" | "year" | "quarter", number> | undefined;

  if (profile?.deviation && profile.targetUniversities?.length) {
    const grade = (profile.grade as "h1" | "h2" | "h3" | "ronin") ?? "h2";
    const monthsToExam = defaultRemainingMonths(grade);
    const border = profile.targetDeviationBucket
      ? bucketMid(profile.targetDeviationBucket)
      : Math.min(75, profile.deviation + 10);

    function calcRemaining(months: number): number {
      const remainingWeeks = Math.max(1, Math.round((months * 30) / 7));
      const gap = estimateGoalGap({
        targets: [
          {
            universityId: profile!.targetUniversities![0].universityId,
            priority: 1,
            borderDeviation: border,
            safeDeviation: border + 3,
            stretchDeviation: border + 5,
          },
        ],
        currentTotal: profile!.deviation!,
        currentByArea: {},
        remainingWeeks,
      });
      const req = estimateRequiredBlocks({ gap, remainingWeeks });
      const futureMid =
        (req.futureRequiredHours.lower + req.futureRequiredHours.upper) / 2;
      const futureBlocks = futureMid / HOURS_PER_BLOCK;
      const portion = Math.min(1, months / monthsToExam);
      return Math.max(0, Math.round(futureBlocks * portion - done));
    }

    blocksRemainingByHorizon = {
      exam: calcRemaining(monthsToExam),
      year: calcRemaining(Math.min(12, monthsToExam)),
      quarter: calcRemaining(Math.min(3, monthsToExam)),
    };
    blocksDoneByHorizon = { exam: done, year: done, quarter: done };
  }

  return (
    <LevelCard
      level={lv.level}
      currentLevelExp={lv.currentLevelExp}
      nextLevelExp={lv.nextLevelExp}
      blocksRemainingByHorizon={blocksRemainingByHorizon}
      blocksDoneByHorizon={blocksDoneByHorizon}
    />
  );
}

// ─── ステータス計算 ───
function buildStatusPoints(
  tests: TestRecord[],
  areas: SubjectAreaId[],
): RadarPoint[] {
  // TODO: 計画AI v0.2 で能力値ベース指標に置き換え
  return areas.map((a) => {
    const areaDef = SUBJECT_AREAS.find((x) => x.id === a)!;
    const filtered = tests.filter((t) => guessArea(t.input.subject) === a);
    let value = 0;
    if (filtered.length > 0) {
      const recent = filtered[0];
      value = recent.input.fullScore > 0
        ? Math.round((recent.input.score / recent.input.fullScore) * 100)
        : 0;
    } else {
      value = 0;
    }
    return {
      label: areaDef.name,
      shortLabel: areaDef.shortName,
      value,
    };
  });
}

// ─── 共通 UI ───
function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: typeof Target;
  title: string;
}) {
  const isAscii = /^[\x00-\x7F]+$/.test(title);
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3 w-3 text-ink-400" strokeWidth={2} />
      <h2
        className={
          isAscii
            ? "text-[10px] font-bold uppercase tracking-widest text-ink-500"
            : "text-[11px] font-medium text-ink-500"
        }
      >
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
