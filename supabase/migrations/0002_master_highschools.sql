-- 高校マスター
-- 文科省「学校コード検索システム」由来の 13桁コードを基礎 ID として利用
-- 学期制・定期テスト日程・偏差値はユーザー入力で補完

create table if not exists master_highschools_raw (
  school_code      text primary key,
  source           text not null,               -- 'mext' | 'manual'
  raw_data         jsonb not null,
  fetched_at       timestamptz default now(),
  notes            text
);

create index if not exists idx_master_highschools_raw_source
  on master_highschools_raw (source);

create table if not exists highschools (
  id               text primary key,            -- 例: "hs-tk-hibiya"
  school_code      text references master_highschools_raw(school_code) on delete set null,
  name             text not null,
  kana             text,
  aliases          text[] default '{}',
  prefecture       text not null,
  city             text,
  type             text not null check (type in ('national','public','private')),
  deviation        numeric(4,1),
  semester_system  text check (semester_system in ('2-term','3-term','quarter','unknown')),
  regular_test_dates jsonb,                     -- [{term, start_date, end_date}]
  homepage         text,
  source           text not null default 'seed',
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  search_text      text generated always as (
    lower(coalesce(name,'') || ' ' || coalesce(kana,'') || ' ' ||
          coalesce(array_to_string(aliases,' '), '') || ' ' ||
          coalesce(prefecture,'') || ' ' || coalesce(city,''))
  ) stored
);

create index if not exists idx_highschools_search_text
  on highschools using gin (to_tsvector('simple', search_text));
create index if not exists idx_highschools_school_code
  on highschools (school_code);
create index if not exists idx_highschools_prefecture
  on highschools (prefecture);
