"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronRight,
  Clock,
  FileText,
  Globe,
  Home as HomeIcon,
  Lock,
  LogOut,
  Moon,
  Shield,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  clearAll,
  deleteFixedSlot,
  saveFixedSlot,
  setPlanning,
} from "@/lib/store";
import type { FixedSlot } from "@/lib/store";
import { nanoid } from "nanoid";
import { useStore } from "@/lib/hooks/useStore";
import { useAuth } from "@/lib/hooks/useAuth";

export function SettingsView() {
  const { state, hydrated } = useStore();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [confirmStep, setConfirmStep] = useState<0 | 1 | 2>(0);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      router.push("/signin");
    } catch {
      setSigningOut(false);
    }
  }

  function handleDelete() {
    if (confirmStep === 0) {
      setConfirmStep(1);
      return;
    }
    if (confirmStep === 1) {
      setConfirmStep(2);
      return;
    }
    clearAll();
    setConfirmStep(0);
    alert("ローカルデータをすべて削除しました。");
  }

  return (
    <div className="px-5 pb-8 pt-3 space-y-5">
      {/* アプリ設定 */}
      <section>
        <SectionTitle>アプリ</SectionTitle>
        <SettingsGroup>
          <SettingsRow
            icon={Bell}
            tone="bg-sky-100 text-sky-600"
            label="通知"
            value="近日対応"
            disabled
          />
          <SettingsRow
            icon={Moon}
            tone="bg-ink-200 text-ink-700"
            label="外観"
            value="ライト"
            disabled
          />
          <SettingsRow
            icon={Globe}
            tone="bg-mint-100 text-mint-600"
            label="言語"
            value="日本語"
            disabled
          />
        </SettingsGroup>
      </section>

      {/* プロフィール / 学習 */}
      <section>
        <SectionTitle>プロフィール</SectionTitle>
        <SettingsGroup>
          <SettingsLink
            href="/onboarding"
            icon={ChevronRight}
            tone="bg-cream-100 text-ink-700"
            label="学年・志望校・偏差値を編集"
          />
          <SettingsLink
            href="/app/search"
            icon={ChevronRight}
            tone="bg-cream-100 text-ink-700"
            label="参考書を追加・削除"
          />
        </SettingsGroup>
      </section>

      {/* 固定スロット (食事/お風呂など) */}
      <section>
        <SectionTitle>固定の予定</SectionTitle>
        <FixedSlotsEditor />
      </section>

      {/* 1日の予定 */}
      <section>
        <SectionTitle>1日の予定</SectionTitle>
        <PlanningEditor />
      </section>

      {/* 法務 */}
      <section>
        <SectionTitle>サポート</SectionTitle>
        <SettingsGroup>
          <SettingsLink
            href="/terms"
            icon={FileText}
            tone="bg-cream-100 text-ink-700"
            label="利用規約"
          />
          <SettingsLink
            href="/privacy"
            icon={Shield}
            tone="bg-cream-100 text-ink-700"
            label="プライバシーポリシー"
          />
          <SettingsRow
            icon={Lock}
            tone="bg-cream-100 text-ink-700"
            label="バージョン"
            value="0.4.0"
            disabled
          />
        </SettingsGroup>
      </section>

      {/* アカウント / 危険ゾーン */}
      <section>
        <SectionTitle danger>アカウント</SectionTitle>
        {user ? (
          <p className="mb-2 px-1 text-[11px] text-ink-500">{user.email}</p>
        ) : null}
        <SettingsGroup>
          <li>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-cream-100",
                signingOut && "opacity-60",
              )}
            >
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-cream-100 text-ink-700">
                <LogOut className="h-4 w-4" />
              </span>
              <span className="flex-1 text-sm font-bold text-ink-900">
                {signingOut ? "サインアウト中…" : "サインアウト"}
              </span>
            </button>
          </li>
        </SettingsGroup>

        <details className="mt-3 rounded-3xl border border-coral-300/40 bg-coral-300/5 p-1">
          <summary className="flex cursor-pointer items-center gap-2 rounded-2xl px-3 py-3 text-sm font-bold text-coral-500 hover:bg-coral-300/10">
            <TriangleAlert className="h-4 w-4" />
            危険な操作を表示
          </summary>
          <div className="px-3 pb-3 pt-1">
            <p className="text-[11px] text-ink-500">
              保存されているプロフィール・テスト履歴・ブロック記録・予定を
              <strong className="text-ink-900">すべて</strong>削除します。
              一度実行すると元に戻せません。
            </p>

            <button
              type="button"
              onClick={handleDelete}
              disabled={!hydrated}
              className={cn(
                "mt-3 flex h-11 w-full items-center justify-center gap-1.5 rounded-2xl text-sm font-black transition",
                confirmStep === 0
                  ? "border-2 border-coral-300/60 bg-white text-coral-500"
                  : confirmStep === 1
                  ? "border-2 border-coral-400 bg-coral-300/20 text-coral-500"
                  : "bg-coral-500 text-white",
              )}
            >
              <Trash2 className="h-4 w-4" />
              {confirmStep === 0
                ? "ローカルデータをすべて消す"
                : confirmStep === 1
                ? "本当に削除しますか？（タップで確認）"
                : "本当の本当に削除（最後の確認）"}
            </button>
            {confirmStep > 0 ? (
              <button
                type="button"
                onClick={() => setConfirmStep(0)}
                className="mt-2 flex h-9 w-full items-center justify-center text-[11px] font-bold text-ink-500"
              >
                やっぱりやめる
              </button>
            ) : null}

            {hydrated ? (
              <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-white p-3 text-center text-[10px] text-ink-500">
                <div>
                  <div className="text-base font-black text-ink-900 tabular-nums">
                    {state.tests.length}
                  </div>
                  <div>テスト</div>
                </div>
                <div>
                  <div className="text-base font-black text-ink-900 tabular-nums">
                    {state.blockLogs.length}
                  </div>
                  <div>記録</div>
                </div>
                <div>
                  <div className="text-base font-black text-ink-900 tabular-nums">
                    {(state.events ?? []).length}
                  </div>
                  <div>予定</div>
                </div>
              </div>
            ) : null}
          </div>
        </details>
      </section>
    </div>
  );
}

function SectionTitle({
  children,
  danger,
}: {
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <h2
      className={cn(
        "text-[10px] font-bold uppercase tracking-widest",
        danger ? "text-coral-500" : "text-ink-500",
      )}
    >
      {children}
    </h2>
  );
}

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return (
    <ul className="mt-2 divide-y divide-ink-100/70 overflow-hidden rounded-2xl border border-ink-100/80 bg-white">
      {children}
    </ul>
  );
}

function SettingsRow({
  icon: Icon,
  tone,
  label,
  value,
  disabled,
}: {
  icon: typeof Bell;
  tone: string;
  label: string;
  value?: string;
  disabled?: boolean;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 px-4 py-3.5",
        disabled && "opacity-60",
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 flex-none items-center justify-center rounded-xl",
          tone,
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 text-sm font-bold text-ink-900">{label}</span>
      {value ? (
        <span className="text-xs font-bold text-ink-500">{value}</span>
      ) : null}
    </li>
  );
}

function SettingsLink({
  href,
  icon: Icon,
  tone,
  label,
}: {
  href: string;
  icon: typeof Bell;
  tone: string;
  label: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 px-4 py-3.5 active:bg-cream-100"
      >
        <span
          className={cn(
            "flex h-8 w-8 flex-none items-center justify-center rounded-xl",
            tone,
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="flex-1 text-sm font-bold text-ink-900">{label}</span>
        <ChevronRight className="h-4 w-4 text-ink-400" />
      </Link>
    </li>
  );
}

// ── 1日の予定エディタ ────────────────────────
function PlanningEditor() {
  const { state, hydrated } = useStore();
  const planning = state.planning;

  const [weekdayBlocks, setWeekdayBlocks] = useState(3);
  const [weekendBlocks, setWeekendBlocks] = useState(6);
  const [returnTime, setReturnTime] = useState("18:30");
  const [bedtime, setBedtime] = useState("23:30");
  const [buffer, setBuffer] = useState(60);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // hydrate 後に planning から値を同期 (初回マウント時の sessionStorage 反映)
  useEffect(() => {
    if (!hydrated) return;
    if (planning) {
      setWeekdayBlocks(planning.weekdayBaseBlocks);
      setWeekendBlocks(planning.weekendBaseBlocks);
      setReturnTime(normalizeForInput(planning.defaultReturnTime));
      setBedtime(normalizeForInput(planning.defaultBedtime));
      setBuffer(planning.bufferMinutes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // HTML <input type="time"> は 24:00 を表示できないので 23:59 に丸める
  function normalizeForInput(t: string): string {
    if (t === "24:00") return "23:30";
    const [h, m] = t.split(":").map(Number);
    if (h >= 24) return "23:30";
    return t;
  }

  function save() {
    setPlanning({
      weekdayBaseBlocks: weekdayBlocks,
      weekendBaseBlocks: weekendBlocks,
      defaultReturnTime: returnTime,
      defaultBedtime: bedtime,
      bufferMinutes: buffer,
    });
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2000);
  }

  if (!hydrated) return null;

  return (
    <div className="mt-2 divide-y divide-ink-100/70 overflow-hidden rounded-2xl border border-ink-100/80 bg-white">
      <NumberRow
        icon={Clock}
        label="平日 基本ブロック"
        value={weekdayBlocks}
        min={0}
        max={10}
        suffix="ブロック"
        onChange={setWeekdayBlocks}
      />
      <NumberRow
        icon={Clock}
        label="休日 基本ブロック"
        value={weekendBlocks}
        min={0}
        max={14}
        suffix="ブロック"
        onChange={setWeekendBlocks}
      />
      <TimeRow
        icon={HomeIcon}
        label="基本の帰宅時間"
        value={returnTime}
        onChange={setReturnTime}
      />
      <TimeRow
        icon={Moon}
        label="就寝時間"
        value={bedtime}
        onChange={setBedtime}
      />
      <NumberRow
        icon={Clock}
        label="食事・風呂などのバッファ"
        value={buffer}
        min={0}
        max={300}
        step={30}
        suffix="分"
        onChange={setBuffer}
      />
      <li className="px-4 py-3">
        <button
          type="button"
          onClick={save}
          className={cn(
            "h-10 w-full rounded-xl text-sm font-bold transition",
            savedAt
              ? "bg-mint-500 text-white"
              : "bg-ink-900 text-white",
          )}
        >
          {savedAt ? "✓ 保存しました" : "保存"}
        </button>
      </li>
    </div>
  );
}

function NumberRow({
  icon: Icon,
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  icon: typeof Bell;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix: string;
  onChange: (v: number) => void;
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-cream-100 text-ink-700">
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 text-sm font-bold text-ink-900">{label}</span>
      <div className="flex items-center gap-1 rounded-xl border border-cream-200 bg-cream-50 px-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          className="flex h-7 w-7 items-center justify-center text-ink-700"
        >
          −
        </button>
        <span className="w-10 text-center text-sm font-black text-ink-900 tabular-nums">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + step))}
          className="flex h-7 w-7 items-center justify-center text-ink-700"
        >
          +
        </button>
      </div>
      <span className="text-[10px] text-ink-500">{suffix}</span>
    </li>
  );
}

function TimeRow({
  icon: Icon,
  label,
  value,
  onChange,
}: {
  icon: typeof Bell;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-cream-100 text-ink-700">
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 text-sm font-bold text-ink-900">{label}</span>
      <input
        type="time"
        step={1800}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-xl border border-cream-200 bg-cream-50 px-2 text-sm text-ink-900 outline-none focus:border-sky-400 focus:bg-white"
      />
    </li>
  );
}

// ── 固定スロット (食事/お風呂など) ────────────────
function FixedSlotsEditor() {
  const { state, hydrated } = useStore();
  const slots = state.fixedSlots ?? [];
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Omit<FixedSlot, "id">>({
    label: "夕食",
    startTime: "19:00",
    durationMin: 30,
    weekdays: [],
    icon: "meal",
  });

  if (!hydrated) return null;

  function save() {
    if (!draft.label.trim()) return;
    saveFixedSlot({ id: nanoid(8), ...draft });
    setAdding(false);
    setDraft({
      label: "夕食",
      startTime: "19:00",
      durationMin: 30,
      weekdays: [],
      icon: "meal",
    });
  }

  return (
    <div className="mt-2 overflow-hidden rounded-2xl border border-ink-100/80 bg-white">
      {slots.length === 0 ? (
        <p className="px-4 py-4 text-[12px] text-ink-500">
          食事・お風呂・部活など、毎日固定の予定をここに登録すると、今日のスケジュールから自動で除外されます。
        </p>
      ) : (
        <ul className="divide-y divide-ink-100/60">
          {slots.map((s) => (
            <li key={s.id} className="flex items-center gap-3 px-4 py-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-peach-100 text-peach-500">
                {s.icon === "bath"
                  ? "🛁"
                  : s.icon === "club"
                  ? "🏃"
                  : s.icon === "prep"
                  ? "📚"
                  : "🍽️"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold text-ink-900">{s.label}</div>
                <div className="text-[10px] text-ink-500 tabular-nums">
                  {s.startTime} ・ {s.durationMin}分
                  {s.weekdays && s.weekdays.length > 0
                    ? " ・ " + s.weekdays.map((d) => "月火水木金土日"[d]).join("")
                    : " ・ 毎日"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => deleteFixedSlot(s.id)}
                className="text-[11px] text-coral-500"
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <div className="space-y-2 border-t border-ink-100/60 bg-cream-50/60 p-4">
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                名前
              </span>
              <input
                value={draft.label}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                placeholder="夕食"
                className="mt-1 h-9 w-full rounded-lg border border-ink-100 bg-white px-2 text-[13px] text-ink-900 outline-none focus:border-sky-400"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                時刻
              </span>
              <input
                type="time"
                step={1800}
                value={draft.startTime}
                onChange={(e) => setDraft({ ...draft, startTime: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-ink-100 bg-white px-2 text-[13px] text-ink-900 outline-none focus:border-sky-400"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
              所要時間
            </span>
            <div className="mt-1 flex items-center gap-1 rounded-lg border border-ink-100 bg-white px-1">
              <button
                type="button"
                onClick={() =>
                  setDraft({ ...draft, durationMin: Math.max(15, draft.durationMin - 15) })
                }
                className="flex h-9 w-9 items-center justify-center text-ink-700"
              >
                −
              </button>
              <span className="flex-1 text-center text-[13px] font-bold tabular-nums text-ink-900">
                {draft.durationMin} 分
              </span>
              <button
                type="button"
                onClick={() =>
                  setDraft({ ...draft, durationMin: Math.min(240, draft.durationMin + 15) })
                }
                className="flex h-9 w-9 items-center justify-center text-ink-700"
              >
                +
              </button>
            </div>
          </label>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
              アイコン
            </div>
            <div className="mt-1 flex gap-1">
              {(["meal", "bath", "club", "prep", "other"] as FixedSlot["icon"][]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setDraft({ ...draft, icon: k })}
                  className={cn(
                    "h-9 flex-1 rounded-lg text-base",
                    draft.icon === k
                      ? "bg-ink-900 text-white"
                      : "bg-white border border-ink-100",
                  )}
                >
                  {k === "bath"
                    ? "🛁"
                    : k === "club"
                    ? "🏃"
                    : k === "prep"
                    ? "📚"
                    : k === "other"
                    ? "📌"
                    : "🍽️"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="h-10 flex-1 rounded-xl bg-cream-100 text-[12px] font-bold text-ink-700"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={save}
              className="h-10 flex-1 rounded-xl bg-ink-900 text-[12px] font-bold text-white"
            >
              追加
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex w-full items-center justify-center gap-1 border-t border-ink-100/60 px-4 py-3 text-[12px] font-bold text-sky-500"
        >
          ＋ 固定の予定を追加
        </button>
      )}
    </div>
  );
}
