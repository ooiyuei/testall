-- 大学マスター
-- 設計方針:
-- 1) raw テーブル: 外部ソース(文科省/ポートレート)の生データを保持
-- 2) 正規化テーブル: アプリで使う構造化データ。raw への source_id で逆引き可
-- 3) search_text: 全文検索用の生成列（name + kana + aliases + shortName）

-- ─── Raw 層 ──────────────────────────────────────────
create table if not exists master_universities_raw (
  school_code      text primary key,            -- 文科省学校コード
  source           text not null,               -- 'mext' | 'univ-portrait' | 'manual'
  raw_data         jsonb not null,
  fetched_at       timestamptz default now(),
  notes            text
);

create index if not exists idx_master_universities_raw_source
  on master_universities_raw (source);

-- ─── 正規化 ──────────────────────────────────────────
create table if not exists universities (
  id               text primary key,            -- 例: "u-tokyo"
  school_code      text references master_universities_raw(school_code) on delete set null,
  name             text not null,
  short_name       text,
  kana             text,
  aliases          text[] default '{}',
  type             text not null check (type in ('national','public','private')),
  region           text not null,
  tier             text check (tier in ('S','A','B','C','D')),
  homepage         text,
  source           text not null default 'seed',
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  search_text      text generated always as (
    lower(coalesce(name,'') || ' ' || coalesce(kana,'') || ' ' ||
          coalesce(short_name,'') || ' ' ||
          coalesce(array_to_string(aliases,' '), ''))
  ) stored
);

create index if not exists idx_universities_search_text
  on universities using gin (to_tsvector('simple', search_text));
create index if not exists idx_universities_school_code
  on universities (school_code);
create index if not exists idx_universities_region
  on universities (region);

-- 学部
create table if not exists university_faculties (
  id               text primary key,            -- 例: "u-tokyo-0"
  university_id    text not null references universities(id) on delete cascade,
  name             text not null,
  category         text not null,               -- letters/law/economics/...
  deviation        numeric(4,1),                -- 偏差値（手動追加）
  exam_subjects    jsonb,                       -- [{subject_id, required, weight, notes}]
  notes            text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index if not exists idx_university_faculties_uid
  on university_faculties (university_id);
