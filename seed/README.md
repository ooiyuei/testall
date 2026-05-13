# Seed CSV

Supabase マスターテーブルへの初期データ投入用 CSV。
TypeScript の `src/lib/master/*/data.ts` と同じレコードを表現する。

## 投入手順（後日）

```bash
# Supabase ローカル
supabase db reset                                  # マイグレーション再適用
psql $DATABASE_URL -c "\copy universities from 'seed/universities.csv' csv header"
psql $DATABASE_URL -c "\copy university_faculties from 'seed/university_faculties.csv' csv header"
psql $DATABASE_URL -c "\copy highschools from 'seed/highschools.csv' csv header"
psql $DATABASE_URL -c "\copy textbooks from 'seed/textbooks.csv' csv header"
psql $DATABASE_URL -c "\copy mock_exams from 'seed/mock_exams.csv' csv header"
psql $DATABASE_URL -c "\copy subjects_master from 'seed/subjects.csv' csv header"
psql $DATABASE_URL -c "\copy units_master from 'seed/units.csv' csv header"
```

## ファイル一覧

| ファイル | 対応テーブル | 件数の目安 |
|---|---|---|
| `universities.csv` | universities | 100+ |
| `university_faculties.csv` | university_faculties | 500+ |
| `highschools.csv` | highschools | 100+（拡張可） |
| `textbooks.csv` | textbooks | 30+ |
| `mock_exams.csv` | mock_exams | 25+ |
| `subjects.csv` | subjects_master | 24 |
| `units.csv` | units_master | 200+ |

## TypeScript シードからの書き出し

`pnpm dlx tsx scripts/export-seed.ts`（後日作成）で `src/lib/master/*/data.ts` から
CSV を生成できる。
