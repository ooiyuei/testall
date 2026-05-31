# Testall UI/UX 統合レビュー — 実装ロードマップ (2026-05-31)

> 6次元の専門レビュー（ビジュアル/演出/UXフロー/モバイルPWA/和文コピー/a11y）を実コード精読で実施。
> 基準: 「動くか」でなく「東京の高校生が友達に見せて“え、これすごい”と言うか／Apple・Duolingo・Linear・Thingsと並べて遜色ないか」。
> 対象コミット: main @ 199b6c4。

## 0. 総評
6次元中 **Polish=A / 他5次元=B**。トークン設計・和文組版・haptic・FocusRun没入・モーダルa11y土台は「17歳の作」を超え、Apple/Linear級の“素地”が既に揃っている。
**最大の伸びしろ＝「揃った点を主役に結線する」こと**——レベルアップ/EXP/完走の祝祭（全部材料はあるのに繋がっていない）、AIコーチSaraの人格（裏で定義済みなのに表に出ていない）、`viewport-fit:cover` 1行（safe-area資産が全部死んでいる）。新規実装より「結線と1行修正」で例外的に届く距離。今のブロッカーは派手な欠落でなく“無色レンダリングする実バグ・偽の更新・読み上げ破壊”といった信頼を削る地雷。

## 1. 次元別スコアカード
| dimension | grade | 一言 |
|---|---|---|
| ビジュアル設計と仕上げ | **A** | トークン設計は本物。未定義カラー実バグとハードコード氾濫が「例外的」を妨げる |
| インタラクション/快感 | **B** | 基盤はA級。だが祝祭（レベルアップ/EXP/完走）が演出ゼロでDuolingoの中毒性に未達 |
| UXフロー/初回体験 | **B** | 骨格は世界水準近い。“アハ体験の一撃”が無く、IAでテスト/AIがタブから消えている |
| モバイル/PWA | **B** | 触り心地はアプリ級。viewport-fit欠落でsafe-area資産が全死、PTRが偽物、キーボード未対策 |
| 日本語コピー/声 | **B** | 和文組版はApple水準。Saraの人格不在、敬語⇄タメ口の二重人格、エラー文が事務的 |
| アクセシビリティ/堅牢性 | **B** | モーダルa11yは一級。タイマーaria-liveが毎秒読み上げSR破壊、下部ナビ2.47:1で落第 |

## 2. 既に“例外的”な強み Top5（消すな・伸ばせ）
1. **globals.css のトークン/和文基盤** — Apple実測 -0.357px字間、SF Pro JPでpalt不使用・tnumのみ、prefers-reduced-motion二重セーフティネット、(hover:none)で :active scale 自動付与。世界水準の理解度。
2. **HomeView の縦タイムライン（done/now/next）** — now だけ ring付きグローに昇格、他は引き算。Things/Linearの「1画面1主役」。
3. **FocusRun 没入** — dark背景＋RingTimer が進捗で色相変化(sky→mint→sun)、Wake Lock、実時間逆算、700ms長押し終了。Forest級。
4. **MiniFocusBar** — Spotify Now Playing式に BottomNav 上に浮き、全画面追従。並のWebアプリは絶対やらない。
5. **haptic.ts 5段階 ＋ sound.ts 自前生成** — Web AudioでADSR付きchimeを依存ゼロ生成。国内学習アプリ上位1%。

## 3. 🔥 最優先で直す Top10
1. **【実バグ・済】未定義カラートークンが無色レンダリング** — `coral-50/100/600/700`・`sun-600` を約80箇所で使用するのに @theme 未定義 → 締切・苦手の赤警告が透明。`globals.css` の @theme に追加。✅実装済み
2. **【1行で大量蘇生・済】viewport-fit:cover 欠落で safe-area 全死** — `layout.tsx viewport` に `viewportFit:'cover'`。pb-safe/pt-safe/BottomNav/BottomSheet が一斉に蘇る。✅実装済み
3. **【SR破壊・済】25分タイマーの aria-live が毎秒読み上げ** — FocusRun の countdown から `aria-live` 除去＋分単位 sr-only live region。VoiceOver連呼を停止。✅実装済み
4. **【偽の成功表示】PullToRefresh が再取得せず toast だけ** — Home/Me/Plan/TestDetail の onRefresh が `toast.success` のみ。useStore に `reload()` を用意し `await reload()` に差替。無ければPTRごと撤去。
5. **【WCAG落第】下部ナビ非アクティブが 2.47:1** — BottomNav `text-ink-300`→`text-ink-400`(5.17:1)、`text-[10px]`→`[11px]`。
6. **【二重PTR/ゴム化】overscroll-behavior 0件** — html,body に `overscroll-behavior-y: contain`。AiCoachView にも。
7. **【祝祭の結線】レベルアップ演出が完全に不在** — `prevLevel/levelUp/confetti` 全0件。`recentExpGain` prop は LevelCard 定義済みなのに MeView で未配線。prevLevel永続化→`useLevelUp`→全画面 LevelUpOverlay。
8. **【iOS見切れ】min-h-screen(100vh)のまま 9箇所** — AppShell/loading を `min-h-svh` へ。
9. **【ズーム禁止=WCAG違反・済の一部】maximumScale:1/userScalable:false** — 解除済み＋ `touch-action:manipulation` で遅延も除去。✅実装済み
10. **【白文字AA不合格】mint-500/coral-500 ボタン** — Button secondary `bg-mint-500`→`mint-600`、destructive 暗化。「白文字は600番台から」ルール化。

## 4. 🎁 署名体験(Signature Moments) Top3
**① Victory Sequence** — 完走→EXP→レベルアップを0.1秒も途切れさせない1本の連鎖。材料(haptic/chime/EXP/level)は全部揃って繋がっていない。RingTimer完成ストローク→紙吹雪burst＋chime＋haptic.success→`+50 EXP`がXPバーへ流入→満タンでLv数字spring＋上昇アルペジオ。`lib/confetti.ts`＋`useExpFloat`＋`useLevelUp` の3ファイル＋配線。**今週の主役・最大ROI。**
**② Saraを表に出す** — 裏(api/chat)で「Sara」人格定義済みなのに表示は「AIコーチ」。ヘッダーを「Sara」＋アバター＋オンライン点、introを名乗り型、声を「Sara=タメ口/受容、システム=丁寧」で話者分離。文言統一＋SVG1枚でブランド体験が別物に。
**③ 初回30秒「主行動先払い」** — 重いフォームを後回し、最初の25分ブロックを大写し→タップで `/focus/run` 即起動→戻ると「初日1ブロック完了🔥 ストリーク1日」。TestDetail着地で偏差値を useCountUp で動かす。

## 5. 沼（やり過ぎ注意）
- ダークモード全面対応(高effort・夜モードは①祝祭結線の後)／apple-touch-startup-image 全解像度生成／SwipeableRow 全リスト展開／空状態カスタムSVG全画面分／初回専用パスの過剰ヘルパー。

## 6. 実装順序
- **今日（低effort・地雷除去）**: ①無色トークン ②viewport-fit/ズーム解除 ③タイマーaria — **全て実装・型チェック済み**。
- **今週（B→A-）**: PTR reload結線／BottomNav contrast＋min-h-svh＋overscroll／ボタンAA／**Victory Sequence結線（署名体験①）**。
- **来週以降（wow）**: Saraの人格貫通／初回30秒先払い＋useCountUp／IA再編（テスト/AI昇格 or 中央FAB）／radius・shadowハードコード集約／空状態EmptyState統一。

**結論**: 今日の3つは信頼を削る地雷で即修正済み。今週のVictory Sequence結線が最大ROI——新規実装でなく“揃った点の結線”で、17歳のアプリが一気に「え、これすごい」に入る。
