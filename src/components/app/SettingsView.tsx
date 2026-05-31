"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bath,
  Bell,
  BookOpen,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  FileText,
  Globe,
  HelpCircle,
  Home as HomeIcon,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Moon,
  Plus,
  Shield,
  Sparkles,
  Trash2,
  TriangleAlert,
  Upload,
  User,
  Utensils,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  clearAll,
  deleteFixedSlot,
  readStore,
  saveFixedSlot,
  setPlanning,
  writeStore,
} from "@/lib/store";
import type { FixedSlot } from "@/lib/store";
import { nanoid } from "nanoid";
import { useStore } from "@/lib/hooks/useStore";
import { useAuth } from "@/lib/hooks/useAuth";
import { IconBadge } from "@/components/ui/IconBadge";
import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { toast } from "@/components/ui/Toast";
import { haptic } from "@/lib/haptic";
import { sound } from "@/lib/sound";
import { notify } from "@/lib/notify";
import { Vibrate, Volume2, BellRing } from "lucide-react";

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
      toast.error("サインアウトに失敗しました");
    }
  }

  function handleDelete() {
    if (confirmStep === 0) { setConfirmStep(1); return; }
    if (confirmStep === 1) { setConfirmStep(2); return; }
    clearAll();
    setConfirmStep(0);
    toast.success("削除しました", "ローカルデータをすべて削除しました");
  }

  return (
    <div className="px-5 pb-10 pt-2 space-y-5">
      {/* Header */}
      <h1
        className="text-[28px] font-extrabold tracking-[-0.025em] text-ink-900"
        style={{ fontFamily: "var(--font-display)" }}
      >
        設定
      </h1>

      {/* アクセシビリティ */}
      <section>
        <SectionLabel title="アクセシビリティ" className="mb-2" />
        <SettingsGroup>
          <HapticToggleRow />
          <SoundToggleRow />
          <NotifyToggleRow />
        </SettingsGroup>
      </section>

      {/* 学習 — ブロック時間 / 休憩時間 を含む */}
      <section>
        <SectionLabel title="学習" className="mb-2" />
        <PlanningEditor />
      </section>

      {/* プロフィール詳細 */}
      <section>
        <SectionLabel title="プロフィール" className="mb-2" />
        <SettingsGroup>
          <SettingsLink href="/onboarding" icon={ChevronRight} tone="neutral" label="学年・志望校・偏差値を編集" />
          <SettingsLink href="/app/search" icon={ChevronRight} tone="neutral" label="参考書を追加・削除" />
        </SettingsGroup>
      </section>

      {/* 固定の予定 */}
      <section>
        <SectionLabel title="固定の予定" className="mb-2" />
        <FixedSlotsEditor />
      </section>

      {/* データ */}
      <section>
        <SectionLabel title="データ" className="mb-2" />
        <DataExportImport />
      </section>

      {/* サポート */}
      <section>
        <SectionLabel title="サポート" className="mb-2" />
        <SettingsGroup>
          <SettingsLink href="/app/help" icon={HelpCircle} tone="primary" label="ヘルプ・使い方" />
          <SettingsLink href="/terms" icon={FileText} tone="neutral" label="利用規約" />
          <SettingsLink href="/privacy" icon={Shield} tone="neutral" label="プライバシーポリシー" />
          <SettingsRow icon={Lock} tone="neutral" label="バージョン" value="0.6.0" disabled />
        </SettingsGroup>
      </section>

      {/* アカウント（現在は表示のみ・編集は順次対応） */}
      <section>
        <SectionLabel title="アカウント" className="mb-2" />
        <SettingsGroup>
          <SettingsRow icon={Mail} tone="primary" label="メールアドレス" value={user?.email ?? "—"} disabled />
          <SettingsRow icon={User} tone="neutral" label="表示名" value={state.profile?.name ?? "—"} disabled />
          <SettingsRow icon={Sparkles} tone="success" label="連携サービス" value="Google" disabled />
        </SettingsGroup>
      </section>

      {/* 通知（準備中） */}
      <section>
        <SectionLabel title="通知（準備中）" className="mb-2" />
        <SettingsGroup>
          <SettingsRow icon={Bell} tone="primary" label="毎日のリマインド" value="近日対応" disabled />
          <SettingsRow icon={Clock} tone="neutral" label="ブロック開始通知" value="近日対応" disabled />
          <SettingsRow icon={FileText} tone="neutral" label="週次レポート" value="近日対応" disabled />
        </SettingsGroup>
      </section>

      {/* プラン */}
      <section>
        <SectionLabel title="プラン" className="mb-2" />
        <SettingsGroup>
          <SettingsRow icon={Zap} tone="primary" label="現在のプラン" value="Free" disabled />
          <SettingsRow icon={CreditCard} tone="neutral" label="支払い方法" value="—" disabled />
        </SettingsGroup>
      </section>

      {/* サインアウト + 危険ゾーン */}
      <section>
        <SectionLabel title="セッション" className="mb-2" />
        <SettingsGroup>
          <li>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className={cn(
                "flex w-full min-h-[52px] items-center gap-3 px-4 py-3 text-left active:bg-cream-100 transition-colors",
                signingOut && "opacity-60",
              )}
            >
              <IconBadge tone="neutral" size="sm">
                <LogOut />
              </IconBadge>
              <span className="flex-1 text-sm font-medium text-ink-700">
                {signingOut ? "サインアウト中…" : "サインアウト"}
              </span>
            </button>
          </li>
        </SettingsGroup>

        {/* 危険ゾーン */}
        <DangerZone
          confirmStep={confirmStep}
          hydrated={hydrated}
          state={state}
          onDelete={handleDelete}
          onCancel={() => setConfirmStep(0)}
        />
      </section>
    </div>
  );
}

// ── ハプティック ON/OFF スイッチ ────────────────
function HapticToggleRow() {
  const [enabled, setEnabled] = useState<boolean>(true);

  useEffect(() => {
    setEnabled(haptic.isOn());
  }, []);

  function toggle() {
    const next = !enabled;
    if (next) {
      haptic.enable();
      haptic.medium();
      toast.success("ハプティックを有効にしました");
    } else {
      haptic.disable();
      toast.success("ハプティックを無効にしました");
    }
    setEnabled(next);
  }

  return (
    <ToggleRow
      icon={<Vibrate />}
      tone="info"
      title="ハプティック（振動）"
      body="タップ・完了・エラーの瞬間に微振動でフィードバック"
      checked={enabled}
      onChange={toggle}
    />
  );
}

// ── サウンド ON/OFF スイッチ ───────────────────
function SoundToggleRow() {
  const [enabled, setEnabled] = useState<boolean>(true);

  useEffect(() => {
    setEnabled(sound.isOn());
  }, []);

  function toggle() {
    const next = !enabled;
    if (next) {
      sound.enable();
      sound.success();
      toast.success("サウンドを有効にしました");
    } else {
      sound.disable();
      toast.success("サウンドを無効にしました");
    }
    setEnabled(next);
  }

  return (
    <ToggleRow
      icon={<Volume2 />}
      tone="success"
      title="サウンド"
      body="タイマー完走や成功時に上品な chime"
      checked={enabled}
      onChange={toggle}
    />
  );
}

// ── 通知許可 ─────────────────────────────────
function NotifyToggleRow() {
  const [state, setState] = useState<"unsupported" | "denied" | "default" | "supported">("default");

  useEffect(() => {
    setState(notify.support());
  }, []);

  async function request() {
    if (state === "supported" || state === "denied" || state === "unsupported") return;
    haptic.medium();
    const ok = await notify.requestPermission();
    if (ok) {
      notify.send("通知 ON にしました", { body: "タイマー完走でお知らせします", tag: "notify-test" });
      setState("supported");
      toast.success("通知を有効にしました");
    } else {
      toast.error("通知が拒否されました");
      setState("denied");
    }
  }

  const enabled = state === "supported";
  const disabled = state === "denied" || state === "unsupported";

  return (
    <li className="flex min-h-[52px] items-center gap-3 px-4 py-3">
      <IconBadge tone="primary" size="sm">
        <BellRing />
      </IconBadge>
      <div className="flex-1">
        <div className="text-sm font-medium text-ink-900">通知</div>
        <div className="text-[10px] text-ink-400">
          {state === "supported" && "許可済み — タイマー完走で通知"}
          {state === "default" && "ブラウザに許可を求めます"}
          {state === "denied" && "ブラウザで拒否されています（設定から変更）"}
          {state === "unsupported" && "この環境ではサポートされていません"}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-disabled={disabled}
        onClick={request}
        disabled={disabled}
        className={cn(
          "relative h-7 w-12 flex-none rounded-full transition-colors",
          enabled ? "bg-mint-500" : "bg-ink-200",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
            enabled ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </li>
  );
}

// ── 共通トグル行 ───────────────────────────────
function ToggleRow({
  icon,
  tone,
  title,
  body,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  tone: "primary" | "success" | "warning" | "danger" | "info" | "neutral";
  title: string;
  body: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <li className="flex min-h-[52px] items-center gap-3 px-4 py-3">
      <IconBadge tone={tone} size="sm">
        {icon}
      </IconBadge>
      <div className="flex-1">
        <div className="text-sm font-medium text-ink-900">{title}</div>
        <div className="text-[10px] text-ink-400">{body}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={cn(
          "relative h-7 w-12 flex-none rounded-full transition-colors",
          checked ? "bg-mint-500" : "bg-ink-200",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </li>
  );
}

// ── 設定グループ ───────────────────────────────────
function SettingsGroup({ children }: { children: React.ReactNode }) {
  return (
    <ul className="divide-y divide-ink-100/70 overflow-hidden rounded-2xl border border-ink-100/80 bg-white">
      {children}
    </ul>
  );
}

// ── 設定行 (静的・値表示) ──────────────────────────
function SettingsRow({
  icon: Icon,
  tone,
  label,
  value,
  disabled,
}: {
  icon: typeof Bell;
  tone: "primary" | "success" | "warning" | "danger" | "info" | "neutral";
  label: string;
  value?: string;
  disabled?: boolean;
}) {
  return (
    <li className={cn("flex min-h-[52px] items-center gap-3 px-4 py-3", disabled && "opacity-60")}>
      <IconBadge tone={tone} size="sm">
        <Icon />
      </IconBadge>
      <span className="flex-1 text-sm font-medium text-ink-900">{label}</span>
      {value ? <span className="text-xs text-ink-400">{value}</span> : null}
    </li>
  );
}

// ── 設定行 (リンク) ────────────────────────────────
function SettingsLink({
  href,
  icon: Icon,
  tone,
  label,
}: {
  href: string;
  icon: typeof Bell;
  tone: "primary" | "success" | "warning" | "danger" | "info" | "neutral";
  label: string;
}) {
  return (
    <li>
      <Link href={href} className="flex min-h-[52px] items-center gap-3 px-4 py-3 active:bg-cream-100 transition-colors">
        <IconBadge tone={tone} size="sm">
          <Icon />
        </IconBadge>
        <span className="flex-1 text-sm font-medium text-ink-900">{label}</span>
        <ChevronRight className="h-4 w-4 text-ink-300" />
      </Link>
    </li>
  );
}

// ── 危険ゾーン ─────────────────────────────────────
type DangerZoneProps = {
  confirmStep: 0 | 1 | 2;
  hydrated: boolean;
  state: { tests: unknown[]; blockLogs: unknown[]; events?: unknown[] };
  onDelete: () => void;
  onCancel: () => void;
};

function DangerZone({ confirmStep, hydrated, state, onDelete, onCancel }: DangerZoneProps) {
  return (
    <details className="mt-3 rounded-2xl border border-coral-300/40 bg-coral-300/5 p-1">
      <summary className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium text-coral-500 hover:bg-coral-300/10 transition-colors">
        <TriangleAlert className="h-4 w-4 flex-none" />
        危険な操作を表示
      </summary>

      <div className="px-3 pb-3 pt-1 space-y-3">
        <p className="text-[11px] leading-relaxed text-ink-500">
          保存されているプロフィール・テスト履歴・ブロック記録・予定を
          <strong className="font-bold text-ink-800">すべて</strong>削除します。
          一度実行すると元に戻せません。
        </p>

        {hydrated ? (
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-white p-3 text-center text-[10px] text-ink-500">
            <div>
              <div className="text-base font-black text-ink-900 tabular-nums">{state.tests.length}</div>
              <div>テスト</div>
            </div>
            <div>
              <div className="text-base font-black text-ink-900 tabular-nums">{state.blockLogs.length}</div>
              <div>記録</div>
            </div>
            <div>
              <div className="text-base font-black text-ink-900 tabular-nums">{(state.events ?? []).length}</div>
              <div>予定</div>
            </div>
          </div>
        ) : null}

        <Button
          variant="destructive"
          size="sm"
          fullWidth
          disabled={!hydrated}
          onClick={onDelete}
          iconBefore={<Trash2 className="h-4 w-4" />}
        >
          {confirmStep === 0
            ? "ローカルデータをすべて消す"
            : confirmStep === 1
            ? "本当に削除しますか？（もう一度押して確認）"
            : "最終確認 — 実行すると戻せません"}
        </Button>

        {confirmStep > 0 ? (
          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-full items-center justify-center text-[11px] font-medium text-ink-400"
          >
            キャンセル
          </button>
        ) : null}
      </div>
    </details>
  );
}

// ── 1日の予定エディタ ─────────────────────────────
function PlanningEditor() {
  const { state, hydrated } = useStore();
  const planning = state.planning;

  const [weekdayBlocks, setWeekdayBlocks] = useState(3);
  const [weekendBlocks, setWeekendBlocks] = useState(6);
  const [returnTime, setReturnTime] = useState("18:30");
  const [bedtime, setBedtime] = useState("23:30");
  const [buffer, setBuffer] = useState(60);
  const [saved, setSaved] = useState(false);

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

  function normalizeForInput(t: string): string {
    if (t === "24:00") return "23:30";
    const [h] = t.split(":").map(Number);
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
    setSaved(true);
    toast.success("保存しました", "1日の予定を更新しました");
    setTimeout(() => setSaved(false), 2000);
  }

  if (!hydrated) return null;

  return (
    <div className="divide-y divide-ink-100/70 overflow-hidden rounded-2xl border border-ink-100/80 bg-white">
      <NumberRow icon={Clock} label="平日 基本ブロック" value={weekdayBlocks} min={0} max={10} suffix="ブロック" onChange={setWeekdayBlocks} />
      <NumberRow icon={Clock} label="休日 基本ブロック" value={weekendBlocks} min={0} max={14} suffix="ブロック" onChange={setWeekendBlocks} />
      <TimeRow icon={HomeIcon} label="基本の帰宅時間" value={returnTime} onChange={setReturnTime} />
      <TimeRow icon={Moon} label="就寝時間" value={bedtime} onChange={setBedtime} />
      <NumberRow icon={Clock} label="食事・風呂などのバッファ" value={buffer} min={0} max={300} step={30} suffix="分" onChange={setBuffer} />
      <li className="px-4 py-3">
        <Button
          variant={saved ? "secondary" : "action"}
          size="sm"
          fullWidth
          onClick={save}
        >
          {saved ? "保存しました" : "保存"}
        </Button>
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
    <li className="flex min-h-[52px] items-center gap-3 px-4 py-3">
      <IconBadge tone="neutral" size="sm">
        <Icon />
      </IconBadge>
      <span className="flex-1 text-sm font-medium text-ink-900">{label}</span>
      <div className="flex items-center gap-1 rounded-xl border border-cream-200 bg-cream-50 px-1">
        <button type="button" onClick={() => onChange(Math.max(min, value - step))} className="flex h-7 w-7 items-center justify-center text-ink-600 hover:text-ink-900">−</button>
        <span className="w-9 text-center text-sm font-bold text-ink-900 tabular-nums">{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + step))} className="flex h-7 w-7 items-center justify-center text-ink-600 hover:text-ink-900">+</button>
      </div>
      <span className="w-8 text-[10px] text-ink-400">{suffix}</span>
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
    <li className="flex min-h-[52px] items-center gap-3 px-4 py-3">
      <IconBadge tone="neutral" size="sm">
        <Icon />
      </IconBadge>
      <span className="flex-1 text-sm font-medium text-ink-900">{label}</span>
      <input
        type="time"
        step={1800}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-xl border border-cream-200 bg-cream-50 px-2 text-sm text-ink-900 outline-none focus:border-sky-400 focus:bg-white transition-colors"
      />
    </li>
  );
}

// ── 固定スロット (食事/お風呂など) ────────────────
const SLOT_ICONS: Record<NonNullable<FixedSlot["icon"]>, { Icon: typeof Utensils; label: string }> = {
  meal: { Icon: Utensils, label: "食事" },
  bath: { Icon: Bath, label: "お風呂" },
  club: { Icon: MapPin, label: "部活" },
  prep: { Icon: BookOpen, label: "準備" },
  other: { Icon: Clock, label: "その他" },
};

function SlotIcon({ icon }: { icon?: FixedSlot["icon"] }) {
  const key = icon ?? "meal";
  const { Icon } = SLOT_ICONS[key] ?? SLOT_ICONS.meal;
  return <Icon className="h-4 w-4" />;
}

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
    toast.success("追加しました", `「${draft.label}」を固定の予定に追加しました`);
    setDraft({ label: "夕食", startTime: "19:00", durationMin: 30, weekdays: [], icon: "meal" });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100/80 bg-white">
      {slots.length === 0 && !adding ? (
        <p className="px-4 py-4 text-[12px] leading-relaxed text-ink-500">
          食事・お風呂・部活など、毎日固定の予定をここに登録すると、今日のスケジュールから自動で除外されます。
        </p>
      ) : (
        <ul className="divide-y divide-ink-100/60">
          {slots.map((s) => (
            <li key={s.id} className="flex min-h-[52px] items-center gap-3 px-4 py-3">
              <IconBadge tone="info" size="sm">
                <SlotIcon icon={s.icon} />
              </IconBadge>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-ink-900">{s.label}</div>
                <div className="text-[10px] text-ink-400 tabular-nums">
                  {s.startTime} · {s.durationMin}分
                  {s.weekdays && s.weekdays.length > 0
                    ? " · " + s.weekdays.map((d) => "月火水木金土日"[d]).join("")
                    : " · 毎日"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => deleteFixedSlot(s.id)}
                className="text-[11px] font-medium text-coral-400 hover:text-coral-500"
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <SlotForm
          draft={draft}
          onChange={setDraft}
          onSave={save}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex w-full items-center justify-center gap-1.5 border-t border-ink-100/60 px-4 py-3 text-[13px] font-medium text-sky-500 hover:bg-cream-50 transition-colors"
        >
          <Plus className="h-4 w-4" />
          固定の予定を追加
        </button>
      )}
    </div>
  );
}

function SlotForm({
  draft,
  onChange,
  onSave,
  onCancel,
}: {
  draft: Omit<FixedSlot, "id">;
  onChange: (d: Omit<FixedSlot, "id">) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-3 border-t border-ink-100/60 bg-cream-50/60 p-4">
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-[10px] font-medium text-ink-400">名前</span>
          <input
            value={draft.label}
            onChange={(e) => onChange({ ...draft, label: e.target.value })}
            placeholder="夕食"
            className="mt-1 h-10 w-full rounded-xl border border-ink-100 bg-white px-3 text-[13px] text-ink-900 outline-none focus:border-sky-400 transition-colors"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-medium text-ink-400">開始時刻</span>
          <input
            type="time"
            step={1800}
            value={draft.startTime}
            onChange={(e) => onChange({ ...draft, startTime: e.target.value })}
            className="mt-1 h-10 w-full rounded-xl border border-ink-100 bg-white px-3 text-[13px] text-ink-900 outline-none focus:border-sky-400 transition-colors"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-[10px] font-medium text-ink-400">所要時間</span>
        <div className="mt-1 flex items-center gap-1 rounded-xl border border-ink-100 bg-white px-1">
          <button
            type="button"
            onClick={() => onChange({ ...draft, durationMin: Math.max(15, draft.durationMin - 15) })}
            className="flex h-9 w-9 items-center justify-center text-ink-600"
          >−</button>
          <span className="flex-1 text-center text-[13px] font-bold tabular-nums text-ink-900">{draft.durationMin}分</span>
          <button
            type="button"
            onClick={() => onChange({ ...draft, durationMin: Math.min(240, draft.durationMin + 15) })}
            className="flex h-9 w-9 items-center justify-center text-ink-600"
          >+</button>
        </div>
      </label>

      <div>
        <span className="text-[10px] font-medium text-ink-400">カテゴリ</span>
        <div className="mt-1 flex gap-1.5">
          {(Object.entries(SLOT_ICONS) as [FixedSlot["icon"], { Icon: typeof Utensils; label: string }][]).map(([k, v]) => (
            <button
              key={k}
              type="button"
              onClick={() => onChange({ ...draft, icon: k })}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-[10px] transition-colors",
                draft.icon === k
                  ? "bg-ink-900 text-white"
                  : "border border-ink-100 bg-white text-ink-500",
              )}
            >
              <v.Icon className="h-3.5 w-3.5" />
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="ghost" size="sm" fullWidth onClick={onCancel}>キャンセル</Button>
        <Button variant="action" size="sm" fullWidth onClick={onSave}>追加</Button>
      </div>
    </div>
  );
}

// ─── データ Export / Import ───────────────────────
function DataExportImport() {
  function handleExport() {
    try {
      const state = readStore();
      const payload = { version: 1, exportedAt: new Date().toISOString(), state };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `testall-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("エクスポート完了", "JSON ファイルを保存しました");
    } catch (e) {
      toast.error("エクスポートに失敗しました", e instanceof Error ? e.message : undefined);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const loadingId = toast.loading("読み込み中…");
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { state?: unknown };
      if (!parsed.state || typeof parsed.state !== "object") {
        throw new Error("ファイル形式が正しくありません");
      }
      toast.dismiss(loadingId);
      // @ts-expect-error - 動的な復元なので型はチェック済み
      writeStore(parsed.state);
      toast.success("インポート完了", "ページを再読み込みします");
      setTimeout(() => {
        if (typeof window !== "undefined") window.location.reload();
      }, 800);
    } catch (err) {
      toast.dismiss(loadingId);
      toast.error("インポートに失敗しました", err instanceof Error ? err.message : undefined);
    } finally {
      e.target.value = "";
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100/80 bg-white">
      <button
        type="button"
        onClick={handleExport}
        className="flex w-full min-h-[52px] items-center gap-3 border-b border-ink-100/60 px-4 py-3 text-left active:bg-cream-100 transition-colors"
      >
        <IconBadge tone="success" size="sm">
          <Download />
        </IconBadge>
        <div className="flex-1">
          <div className="text-[13px] font-medium text-ink-900">データをエクスポート</div>
          <div className="text-[10px] text-ink-400">JSON ファイルとして端末に保存</div>
        </div>
        <ChevronRight className="h-4 w-4 text-ink-300" />
      </button>

      <label className="flex w-full cursor-pointer min-h-[52px] items-center gap-3 px-4 py-3 text-left active:bg-cream-100 transition-colors">
        <IconBadge tone="primary" size="sm">
          <Upload />
        </IconBadge>
        <div className="flex-1">
          <div className="text-[13px] font-medium text-ink-900">データをインポート</div>
          <div className="text-[10px] text-ink-400">バックアップから復元（現在のデータを上書き）</div>
        </div>
        <ChevronRight className="h-4 w-4 text-ink-300" />
        <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
      </label>
    </div>
  );
}
