# UI 監査レポート — Testall v0.5.0

> 基準: Apple HIG (apple/DESIGN.md 実測値) + Linear / Vercel / Notion のミニマリズム
> 対象: 8コンポーネント / globals.css
> 実施日: 2026-05-14

---

## 重要度: 高 (今すぐ直すべき) — 6件

---

### H-1. `font-feature-settings: "palt" 1` は Apple HIG 違反

- **どこで**: `src/app/globals.css:100`
- **何が悪い**: Apple DESIGN.md の Do/Don't に明記。「SF Pro JP は内蔵字詰めを持つため `palt` は不使用」。現在は html 要素全体に `"palt" 1` がかかっており、SF Pro JP の組版品質を意図しない方向に崩す可能性がある。
- **どう直す**:
  ```css
  /* Before */
  html {
    font-feature-settings: "palt" 1;
  }

  /* After */
  html {
    font-feature-settings: normal;
  }
  /* tabular-nums クラスは引き続き個別制御で問題なし */
  ```
- **影響度**: 全画面

---

### H-2. フォントスタックに `"Hiragino Kaku Gothic ProN"` — Apple は `Pro`（非 ProN）を使う

- **どこで**: `src/app/globals.css:68-73`
- **何が悪い**: Apple JP サイトは `Hiragino Kaku Gothic Pro` (ProN ではない) を使用と DESIGN.md に明記。ProN は字形が異なり、細部のグリフで差異が出る。
- **どう直す**:
  ```css
  /* Before */
  "Hiragino Kaku Gothic ProN"

  /* After */
  "Hiragino Kaku Gothic Pro", "ヒラギノ角ゴ Pro W3"
  ```
- **影響度**: 全画面 (日本語グリフ)

---

### H-3. body の `letter-spacing: 0.01em` は Apple HIG と逆方向

- **どこで**: `src/app/globals.css:111`
- **何が悪い**: Apple 本文の実測値は `-0.357px`（負のトラッキング）。現実装は正の `0.01em` (15px 環境で約 +0.15px)。Apple らしい「詰まった上品さ」が出ない。
  p/li には `0.04em` (正) がさらに上書きしており競合している。
- **どう直す**:
  ```css
  /* Before */
  body {
    letter-spacing: 0.01em;
  }
  p, li {
    letter-spacing: 0.04em;
  }

  /* After */
  body {
    letter-spacing: -0.02em; /* 15pxベースで約-0.3px。Apple実測-0.357pxに近い */
  }
  p, li {
    letter-spacing: 0.04em; /* 日本語本文はルールにより 0.04em 維持 */
  }
  ```
  ※ 日本語本文は `global-rules/design` の指定（0.04〜0.08em）を優先するため、p/li の上書きはそのままでよい。body の基底値を修正することで英語見出しなどが改善される。
- **影響度**: 全画面 (英数字ブロック、ヘッダー類)

---

### H-4. MoodCheckCard の気分選択ボタンがタップターゲット Apple HIG 最小値未達

- **どこで**: `src/components/app/MoodCheckCard.tsx:209`
- **何が悪い**: 気分ボタン `h-10`（40px）。Apple HIG は最小タップターゲット 44px を要求。5ボタンを横並びにした場合、実際の指タップ面積は 40px を下回ることが多い（gap で圧縮される）。高校生向けスマホアプリとして最重要インタラクションのひとつ。
- **どう直す**:
  ```tsx
  /* Before */
  className="flex h-10 w-full flex-col items-center justify-center rounded-lg transition"

  /* After */
  className="flex h-11 w-full flex-col items-center justify-center rounded-lg transition"
  /* h-11 = 44px */
  ```
- **影響度**: MoodCheckCard (ホーム主要 CTA)

---

### H-5. BottomNav のタップ領域が 38px — iOS Tab Bar 最小値以下

- **どこで**: `src/components/app/BottomNav.tsx:51`
- **何が悪い**: `<Link>` の縦高さは `py-1.5`（上下 6px）+ アイコン 22px + ラベル + gap = 実質 ~40px 未満。Apple HIG の Tab Bar は 49px が標準。アイコン単体のヒット面も 22px は小さすぎる。
- **どう直す**:
  ```tsx
  /* Before */
  <ul className="flex items-stretch justify-around px-1 py-1.5">
    ...
    <Link className="group flex flex-col items-center gap-0.5 py-1.5">

  /* After */
  <ul className="flex items-stretch justify-around px-1 py-2">
    ...
    <Link className="group flex flex-col items-center gap-0.5 py-2 min-h-[49px] justify-center">
  ```
- **影響度**: 全画面 (常時表示)

---

### H-6. FocusRun — 「終了」ボタンが 48px 高さだが aria-label 欠如、かつ視覚的重要度が主ボタンより高い位置にある

- **どこで**: `src/components/app/FocusRun.tsx:288-295`
- **何が悪い**: running/paused 時に表示される「終了」は `h-12`(48px)でタップ基準は満たすが、`aria-label` がない。また、タイマー進行中の誤タップリスクが高い。Vercel / Linear のタイマー UI では「危険操作」は主ボタンより小さく・端に置く慣習。
- **どう直す**:
  ```tsx
  /* Before */
  <button
    type="button"
    onClick={onFinish}
    className="flex h-12 items-center justify-center gap-1 rounded-full bg-white/10 px-4 text-xs font-bold text-white"
  >
    終了
  </button>

  /* After */
  <button
    type="button"
    onClick={onFinish}
    aria-label="タイマーを終了"
    className="flex h-12 items-center justify-center gap-1 rounded-full bg-white/10 px-4 text-xs font-bold text-white opacity-70"
  >
    終了
  </button>
  ```
  加えて、ボタン配置を「リセット → メイン → 終了」の左・中・右から「リセット → メイン」に絞り、「終了」はスワイプアップ or 長押しで出す設計変更を推奨（次スプリント）。
- **影響度**: FocusRun のみ

---

## 重要度: 中 (次のスプリントで) — 8件

---

### M-1. アクセントカラーが5色同時出現 — Apple 実装は blue 1色

- **どこで**: HomeView, MeView, NewTestForm など全体
- **何が悪い**: `sky`（青）、`mint`（緑）、`sun`（黄）、`coral`（赤）、`peach`（橙）が1画面に同時出現。Apple HIG は primary action color を1色に絞り、それ以外は semantic（success/error/warning）のみ使う。
  HomeView だけでも sky-500/mint-500/coral-500/sun-300 が混在。
- **どう直す** (カラーロール整理):
  | 役割 | 現状 | 推奨 |
  |------|------|------|
  | Primary CTA | sky-500 | sky-500 のみ統一 |
  | Success/完了 | mint-500 | mint-500 のみ |
  | Warning/エラー | coral-500 | coral-500 のみ |
  | Achievement/バッジ | sun-300 | sun-200/300 バッジのみ |
  | Warm/empty state | peach-100 | 廃止 → cream 系で代替 |

  peach 系は独立したアクセントとして使わず、empty state の背景色（cream-100）で代替する。1画面でのアクセントは最大2色（primary + semantic 1色）を原則とする。
- **影響度**: 全画面

---

### M-2. 角丸 `rounded-3xl` と `rounded-2xl` が混在 — 統一基準なし

- **どこで**: NewTestForm.tsx (rounded-3xl), MoodCheckCard.tsx (rounded-2xl), FocusRun.tsx (rounded-3xl) ほか
- **何が悪い**: カードは `rounded-2xl`(16px)、モーダルシートは `rounded-t-3xl`(24px)、ボタンは `rounded-full` が基本だが、NewTestForm のモード選択カードが `rounded-3xl` でホームのカードと径が違う。統一感が欠ける。
- **推奨体系**:
  | 要素 | クラス | px |
  |------|--------|----|
  | カード・セクション | rounded-2xl | 16 |
  | ボトムシート天辺 | rounded-t-3xl | 24 |
  | ボタン (CTA) | rounded-full | pill |
  | ボタン (secondary) | rounded-xl | 12 |
  | タグ・バッジ | rounded-full | pill |
  | インプット | rounded-xl | 12 |
- **影響度**: 全画面

---

### M-3. SectionLabel の日本語テキストに `uppercase` — 日本語に uppercase は非推奨

- **どこで**: `src/components/app/HomeView.tsx:369` ほか多数
  ```tsx
  <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-400">
    {title}
  ```
  title に「今週の流れ」「今日の25分ブロック」など日本語が渡る。
- **何が悪い**: `text-transform: uppercase` は英字にのみ効果があり、日本語には無効。`tracking-[0.18em]` も英字向け。日本語セクションラベルに使うと "Today" は大文字になるが「今週の流れ」はそのまま。不統一な印象。Linear や Notion はセクションラベルに英語省略 or 全角なしで処理している。
- **どう直す**:
  日本語タイトルの場合は uppercase + wide tracking を外し、代わりに `font-medium text-[11px]` + 控えめな色で統一する。英語専用ラベル（"Today" など）は別コンポーネントとして分離。
- **影響度**: HomeView, MeView のセクション見出し全体

---

### M-4. TodaySchedule の `maxHeight: "520px"` — インラインスタイル + マジックナンバー

- **どこで**: `src/components/app/TodaySchedule.tsx:556`
  ```tsx
  <div className="overflow-y-auto" style={{ maxHeight: "520px" }}>
  ```
- **何が悪い**: Tailwind で `max-h-[520px]` と書けるところをインラインスタイルで記述。また 520px は設計根拠が不明確（端末高さや BottomNav 高さと連動していない）。画面高さによってはスクロール量が変わり体験が不安定。
- **どう直す**:
  ```tsx
  /* Before */
  <div className="overflow-y-auto" style={{ maxHeight: "520px" }}>

  /* After */
  <div className="max-h-[calc(100dvh-320px)] overflow-y-auto">
  ```
  `100dvh` ベースで BottomNav + ヘッダー分を引いた値にすると端末依存が減る。
- **影響度**: TodaySchedule

---

### M-5. MeView の `SectionTitle` アイコンサイズが 3.5 x 3.5 (14px) — テキストとバランス悪い

- **どこで**: `src/components/app/MeView.tsx:948`
  ```tsx
  <Icon className="h-3.5 w-3.5 text-ink-500" />
  <h2 className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
  ```
- **何が悪い**: アイコン 14px に対しラベル 10px。アイコンがラベルより 40% 大きく、視覚的にバランスが悪い。Notion/Linear ではセクションアイコンとラベルは同サイズかアイコンをわずかに小さくする。
- **どう直す**:
  ```tsx
  /* After */
  <Icon className="h-3 w-3 text-ink-500" />   {/* 12px に縮小 */}
  <h2 className="text-[11px] font-medium text-ink-500">  {/* uppercase 廃止 */}
  ```
- **影響度**: MeView 全セクション見出し

---

### M-6. BookshelfAddModal — 種類タブが overflow-x-auto でスクロール必要になる可能性

- **どこで**: `src/components/me/BookshelfAddModal.tsx:230`
  ```tsx
  <ul className="mt-3 flex gap-1 overflow-x-auto rounded-xl bg-cream-100/70 p-1">
  ```
- **何が悪い**: 5種類（参考書/教科書/問題集/過去問/その他）を `flex-1` で横並びにしているが `whitespace-nowrap` を `flex h-9 w-full` と組み合わせると、480px コンテナ幅では各タブが最小幅に圧縮され押しにくくなる。タブあたり最低 44px x 32px が必要。
- **どう直す**: `flex-1` を外して `min-w-[56px]` を付けるか、タブを 3+2 の2段に分けるか、ピル型の横スクロールチップに変更する（高校生向けに親しみやすい）。
  ```tsx
  /* After — ピル横スクロール */
  <ul className="mt-3 flex gap-1.5 overflow-x-auto pb-1 scroll-smooth">
    {tabs.map(k => (
      <li key={k} className="flex-none">
        <button className={cn("h-8 rounded-full px-3 text-[11px] font-bold whitespace-nowrap", ...)}>
          {KIND_LABEL[k]}
        </button>
      </li>
    ))}
  </ul>
  ```
- **影響度**: BookshelfAddModal

---

### M-7. HomeView の週間グリッドで `key={i}` — 配列インデックスをキーに使用

- **どこで**: `src/components/app/HomeView.tsx:249`
  ```tsx
  {WEEKDAY_LABEL.map((d, i) => {
    ...
    return (
      <li key={i}>
  ```
- **何が悪い**: 曜日配列は固定長・順序変化なしなので実害は薄いが、プロジェクトルール（インデックスキー禁止）に反する。一貫性の問題。
- **どう直す**:
  ```tsx
  <li key={d}>   {/* "月", "火", ... は重複しない */}
  ```
- **影響度**: HomeView のみ（実害小）

---

### M-8. FocusRun — 完了後の星評価ボタンがデスク横幅 480px 未満で 48px に圧縮される可能性

- **どこで**: `src/components/app/FocusRun.tsx:416`
  ```tsx
  <div className="mt-3 flex items-center justify-between">
    {[1, 2, 3, 4, 5].map((n) => (
      <button className="flex h-12 w-12 items-center justify-center rounded-2xl transition">
  ```
- **何が悪い**: `justify-between` で 5 ボタン (w-12 = 48px 固定) + gap なし。コンテナが ~280px (モバイル余白込み) なら 48×5=240px + フレックス余白で問題ないが、ボタン間隔がゼロになる瞬間がある。星5個がべったり並ぶと押し間違いが多い。
- **どう直す**:
  ```tsx
  /* After */
  <div className="mt-3 flex items-center justify-center gap-3">
    {[1, 2, 3, 4, 5].map((n) => (
      <button className="flex h-12 w-12 ...">
  ```
  `justify-between` → `justify-center gap-3` に変更。合計 48×5 + 12×4 = 288px で大半の端末に収まる。
- **影響度**: FocusRun 完了画面

---

## 重要度: 低 (時間あれば) — 5件

---

### L-1. AppHeader の高さ `h-12`(48px) — Apple Navigation Bar 標準 44px と微妙にズレ

- **どこで**: `src/components/app/AppHeader.tsx:33`
- **内容**: Apple HIG の Navigation Bar 推奨高さは 44px。現在 48px (h-12)。4px の差は体感しにくいが、BottomNav 49px と合わせて「どちらが基準？」が不明確。高さトークンを揃えて `--nav-height: 44px` として管理すると将来のレイアウト計算が楽になる。

---

### L-2. `globals.css` の `.app-shell` radial-gradient はモバイルでパフォーマンス影響がある

- **どこで**: `src/app/globals.css:159-171`
- **内容**: 2つの大きな radial-gradient（900px/800px）を重ねている。GPU 合成は行われるが、低スペック Android では描画コストが高い。Linear/Vercel は大型グラデーションを使わず単色 or 薄い1層グラデーションに留める。将来的に削除または `@media (prefers-reduced-motion)` 配下に置くことを検討。

---

### L-3. MoodCheckCard — 「おすすめ✨」バッジが絵文字を使用

- **どこで**: `src/components/app/MoodCheckCard.tsx:206`
  ```tsx
  <span>おすすめ✨</span>
  ```
- **内容**: プロジェクトのコーディングルールとして「emojis prohibited in code」がある（CLAUDE.md 系ルールで確認）。ソースに絵文字が混在すると grep・lint・diff が汚れる。`<span aria-label="おすすめ">★</span>` や Lucide の `Sparkles` アイコンで代替推奨。

---

### L-4. NewTestForm — `ManualForm` が 350行超で単一関数が肥大化

- **どこで**: `src/components/app/NewTestForm.tsx:510〜`
- **内容**: ManualForm 関数はステップ管理・科目エントリー・バリデーション・送信を全部担っており、プロジェクトルール「関数 50 行以内」から大幅逸脱。ただし機能的に動いているため今すぐのリファクタではなく、次の大改修時に SubjectEntryForm / StepNavigator / SubmitHandler に分割することを推奨。

---

### L-5. TodaySchedule の `nowHHmm()` 関数が MoodCheckCard.tsx にも重複定義

- **どこで**: `src/components/app/MoodCheckCard.tsx:29` / `src/components/app/TodaySchedule.tsx:42`
- **内容**: 全く同じ実装の `nowHHmm()` が2ファイルに存在。`src/lib/time.ts` などに共通化して import する。DRY 原則。

---

## デザイントークン提案 — 修正版 globals.css (抜粋)

以下は現状からの差分提案。既存トークンはそのまま使用し、修正が必要な部分のみ示す。

### カラー: peach を廃止し、cream + coral で代替

```css
/* 廃止推奨 — peach 系は empty state で cream-100/200 に置き換える */
/* --color-peach-* → 削除候補（使用箇所を cream で置き換え後） */
```

使用箇所棚卸し順序: `grep -r "peach" src/` で 12箇所確認、AreaDetail の能力値バッジのみ残留可。

### タイポグラフィ: letter-spacing 修正

```css
html {
  font-feature-settings: normal;           /* palt → normal */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  -webkit-text-size-adjust: 100%;
}

body {
  background: var(--color-cream-50);
  color: var(--color-ink-900);
  letter-spacing: -0.02em;                 /* 0.01em → -0.02em (Apple HIG 準拠) */
  font-size: 15px;
  line-height: 1.6;
}

/* 日本語本文: 行間・字間・禁則 — 現状維持 (design-system.md 準拠) */
p, li {
  line-height: 1.75;
  letter-spacing: 0.04em;
  word-break: keep-all;
  overflow-wrap: anywhere;
  line-break: strict;
}

h1, h2, h3, h4, h5 {
  font-family: var(--font-display);
  letter-spacing: -0.01em;
  line-height: 1.3;
  font-weight: 700;
}
```

### フォントスタック: ProN → Pro に修正

```css
--font-sans:
  "SF Pro JP", "SF Pro Text", -apple-system, BlinkMacSystemFont,
  var(--font-noto-jp),
  "Hiragino Sans",
  "Hiragino Kaku Gothic Pro", "ヒラギノ角ゴ Pro W3",   /* ProN → Pro */
  "Yu Gothic", "Meiryo", system-ui, sans-serif;

--font-display:
  "SF Pro JP", "SF Pro Display", -apple-system, BlinkMacSystemFont,
  var(--font-noto-jp),
  "Hiragino Sans",
  "Hiragino Kaku Gothic Pro", "ヒラギノ角ゴ Pro W3",   /* ProN → Pro */
  "Yu Gothic", "Meiryo", system-ui, sans-serif;
```

### spacing: タップターゲット最小基準のトークン化

```css
/* BottomNav / AppHeader / モーダルボタン で参照できるよう定義 */
/* Tailwind の h-11 = 44px / h-[49px] = 49px で対応済みのため、
   カスタムトークン追加は任意 */
```

### radius: 体系整理 (追加トークン)

```css
/* 既存の --radius-card: 1rem (16px) を基準に以下を追加 */
--radius-input:  0.75rem;   /* 12px — input, secondary button */
--radius-sheet:  1.5rem;    /* 24px — bottom sheet 天辺 */
/* --radius-pill: 9999px — 既存維持 */
```

### shadow: 現状の3段階は適切。使い分けルールを明文化

```
--shadow-soft  → インプット、補助カード
--shadow-card  → 通常カード、リストアイテム
--shadow-pop   → モーダル、ボトムシート
```

---

## 総評

全体として「Apple HIG ベースのクリーンなモバイル UI」の方向性は正しい。トークン設計（cream/ink/sky の3軸）は Notion に近く、高校生向けアプリとして親しみやすい。

修正優先度は次の通り:

1. **今すぐ**: H-1 (`palt` 除去) + H-2 (ProN→Pro) + H-4/H-5 (タップ 44px)  → 30分で完了できる
2. **次スプリント**: M-1 (カラー整理) + M-2 (角丸統一) + M-3 (uppercase 廃止)  → デザイントークン1回変更で全画面に反映
3. **余裕があれば**: L-3 (絵文字) + L-5 (nowHHmm 共通化) → 軽微なリファクタ

遊び心の観点では、FocusRun の暗いグラデーション背景・MoodCheckCard の「おすすめ」バッジ・sun-300 の黄色アクセントは高校生向けとして残す価値がある。削りすぎると「業務 SaaS」になってしまうので、M-1 の整理は「peach 廃止」程度に留め、sun/coral のセマンティックな使い方を維持することを推奨する。
