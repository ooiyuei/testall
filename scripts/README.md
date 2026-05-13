# scripts/

外部データソース取り込み用のオフライン CLI スクリプト群。
全て TypeScript で、`pnpm dlx tsx` で実行する。

## sync-textbooks.ts

参考書 ISBN → openBD（一次） → NDL Search（フォールバック）から書誌取得。

```bash
# 単発
pnpm dlx tsx scripts/sync-textbooks.ts 9784010347027 9784410104213

# ファイル一括（1行1ISBN）
pnpm dlx tsx scripts/sync-textbooks.ts --file my-isbns.txt
```

出力:
- `seed/textbooks_raw.json` — 取得元の生データ（master_textbooks_raw 投入用）
- `seed/textbooks_enrichment.json` — title / author / cover_url の辞書

注意:
- 本文や問題文は取得・保存しない
- 書影 URL は openBD 提供のもののみ

## import-highschools.ts

文部科学省「学校コード検索システム」由来の CSV/Excel を正規化。

データ取得元:
- https://www.mext.go.jp/b_menu/toukei/mext_01087.html
- 「学校コード（高等学校）」をダウンロード

```bash
# 文科省CSVを変換（UTF-8前提。SJIS の場合は事前に変換）
pnpm dlx tsx scripts/import-highschools.ts ~/Downloads/h_school.csv
```

出力:
- `seed/highschools_full.csv` — Supabase `highschools` テーブル投入用
- `seed/highschools_raw.json` — `master_highschools_raw` 投入用

Supabase へは：

```bash
psql $DATABASE_URL -c "\copy highschools (id,school_code,name,kana,aliases,prefecture,city,type,deviation,source) from 'seed/highschools_full.csv' csv header"
```

## 今後追加予定

- `sync-universities.ts` — 大学ポートレートAPIから取得
- `sync-mock-exams.ts` — 河合塾/駿台/東進/代ゼミの公式ページから年度更新
- `validate-master.ts` — シードデータの重複・欠損チェック
