-- 科目・単元マスター
-- 文科省 学習指導要領コード（mext_code）が標準コード
-- Testall 独自の受験用単元タグは testall_tags に分離

create table if not exists subjects_master (
  id               text primary key,            -- 例: "math1a"
  mext_code        text,                        -- 学習指導要領コード
  category         text not null,               -- japanese/math/english/science/social/info
  name             text not null,
  short_name       text,
  kana             text,
  grades           text[] not null default '{}', -- h1/h2/h3/ronin
  source           text not null default 'mext',
  created_at       timestamptz default now(),
  search_text      text generated always as (
    lower(coalesce(name,'') || ' ' || coalesce(short_name,'') || ' ' ||
          coalesce(kana,'') || ' ' || coalesce(mext_code,''))
  ) stored
);

create index if not exists idx_subjects_master_category
  on subjects_master (category);
create index if not exists idx_subjects_master_mext_code
  on subjects_master (mext_code);

create table if not exists units_master (
  id               text primary key,            -- 例: "math1a::0"
  subject_id       text not null references subjects_master(id) on delete cascade,
  mext_code        text,
  name             text not null,
  testall_tags     text[] default '{}',         -- Testall 独自タグ（頻出/難関頻出/共通テストなど）
  exam_frequency   text check (exam_frequency in ('high','mid','low')),
  source           text not null default 'mext',
  created_at       timestamptz default now(),
  search_text      text generated always as (
    lower(coalesce(name,'') || ' ' ||
          coalesce(array_to_string(testall_tags,' '), ''))
  ) stored
);

create index if not exists idx_units_master_subject
  on units_master (subject_id);
create index if not exists idx_units_master_search_text
  on units_master using gin (to_tsvector('simple', search_text));
