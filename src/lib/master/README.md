# Testall マスターデータ層

外部データソース（文科省 / NDL / openBD / 各予備校公式）を取り込み、アプリ内検索で使える正規化済みデータに変換する。

## 全体像

```
外部ソース ─► raw 層 (jsonb) ─► 正規化層 (検索インデックス付き) ─► アプリ
                                          ▲
                                          │ merge
                          ユーザー手入力 (user_master_additions)
```

## ファイル構成

| パス | 役割 |
|---|---|
| `types.ts` | 全マスターの型定義 + `buildSearchText()` |
| `universities/` | 大学（既存 universities.ts を拡張） |
| `highschools/` | 高校（新規・100校シード） |
| `textbooks/` | 参考書（既存 textbooks.ts を拡張・Testall独自タグ追加） |
| `mockexams/` | 模試（新規・河合/駿台/東進/代ゼミ/ベネッセ） |
| `subjects/` | 科目・単元（既存 curriculum.ts を拡張・mextコード追加） |
| `search.ts` | 横断検索 (`unifiedSearch`) |
| `userAdditions.ts` | ユーザー手入力（sessionStorage、Supabase接続後にDB化） |
| `index.ts` | 公開エクスポート |

## データソース対応表

| エンティティ | 基礎ID | 詳細情報 | Testall独自 |
|---|---|---|---|
| 大学 | 文科省 学校コード | 大学ポートレート | 入試科目/配点/偏差値（手動追加） |
| 高校 | 文科省 学校コード | 学校コード検索Excel | 2学期/3学期、定期テスト日程、偏差値（ユーザー入力） |
| 参考書 | ISBN-13 | NDLサーチ + openBD（書影） | 用途タグ・難易度・対応単元・周回数・使い方 |
| 模試 | provider+year+slug | 各予備校公式ページ | 進研模試など学校実施型はユーザー入力 |
| 科目・単元 | 学習指導要領コード（mext） | — | 受験用単元タグ（頻出/難関頻出/共通テスト） |

## 検索

```ts
import { unifiedSearch } from "@/lib/master";

const result = unifiedSearch({
  query: "東大",
  limit: 5,
  kinds: ["university", "mock-exam"], // 省略時は全カテゴリ
});

result.universities  // SearchHit<University>[]
result.mockExams     // SearchHit<MockExam>[]
```

`searchText` は全エンティティで `name / kana / aliases / shortName` を結合した小文字列。
Supabase 側では生成列 + GIN インデックスで全文検索する。

## ユーザー手入力

見つからない大学・高校・参考書・模試はユーザーが追加できる。
現状は sessionStorage に保持し、`mergedUniversities()` などでシードデータと統合される。

```ts
import { addUniversity, mergedUniversities, UNIVERSITIES } from "@/lib/master";

addUniversity({
  name: "○○大学",
  type: "private",
  region: "関東",
  faculties: [],
});

const all = mergedUniversities(UNIVERSITIES); // ユーザー追加分が先頭に来る
```

## Supabase スキーマ

`supabase/migrations/` に対応する DDL がある。
ローカル開発用に Supabase CLI で `supabase db reset` すれば再構築できる。

| migration | テーブル |
|---|---|
| 0001 | master_universities_raw / universities / university_faculties |
| 0002 | master_highschools_raw / highschools |
| 0003 | master_textbooks_raw / textbooks |
| 0004 | master_mock_exams_raw / mock_exams |
| 0005 | subjects_master / units_master |
| 0006 | user_master_additions |

## CSV シード

`seed/` に CSV 形式のシード（最小限）。
TypeScript 側の `data.ts` が「正本」。CSV は Supabase 投入用のサブセット。

## 今後の拡張

1. NDLサーチ + openBD のフェッチスクリプト（`scripts/sync-textbooks.ts`）
2. 文科省学校コード Excel → CSV 変換スクリプト
3. 各予備校公式の年度更新スクリプト
4. 管理画面（user_master_additions のレビュー）
5. RLS ポリシー（Supabase Auth 接続後）
