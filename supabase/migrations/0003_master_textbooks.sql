-- 参考書マスター
-- 書誌情報: 国立国会図書館サーチ・openBD
-- 用途タグ・難易度・対応単元・周回数・使い方: Testall 独自タグ
-- 本文や問題文は一切保持しない

create table if not exists master_textbooks_raw (
  isbn             text primary key,            -- 13桁優先（NDL は ISBN/JP-eNo）
  isbn10           text,
  source           text not null,               -- 'ndl' | 'openbd' | 'manual'
  raw_data         jsonb not null,
  cover_url        text,
  fetched_at       timestamptz default now()
);

create index if not exists idx_master_textbooks_raw_source
  on master_textbooks_raw (source);

create table if not exists textbooks (
  id               text primary key,            -- 例: "tb-math-yellow-chart"
  isbn             text references master_textbooks_raw(isbn) on delete set null,
  isbn10           text,
  name             text not null,
  kana             text,
  aliases          text[] default '{}',
  author           text,
  publisher        text not null,
  cover_url        text,
  -- Testall 独自タグ
  subject          text not null,               -- curriculum category id
  subject_detail   text,                        -- 数IA / 物基 など
  level            text not null check (level in ('basic','standard','advanced','top')),
  usage_tags       text[] default '{}',         -- comprehensive/drill/input/...
  for_grades       text[] default '{}',         -- h1/h2/h3/ronin
  target_unit_ids  text[] default '{}',         -- units.id への参照
  recommended_reps integer,
  usage_notes      text,
  description      text,
  legacy_tags      text[] default '{}',
  source           text not null default 'seed',
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  search_text      text generated always as (
    lower(coalesce(name,'') || ' ' || coalesce(kana,'') || ' ' ||
          coalesce(author,'') || ' ' || coalesce(publisher,'') || ' ' ||
          coalesce(array_to_string(aliases,' '), '') || ' ' ||
          coalesce(array_to_string(legacy_tags,' '), ''))
  ) stored
);

create index if not exists idx_textbooks_search_text
  on textbooks using gin (to_tsvector('simple', search_text));
create index if not exists idx_textbooks_isbn
  on textbooks (isbn);
create index if not exists idx_textbooks_subject
  on textbooks (subject);
