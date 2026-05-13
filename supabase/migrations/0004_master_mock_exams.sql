-- 模試マスター
-- 河合塾・駿台・東進・代ゼミの公式ページが原典
-- 進研模試など学校実施系はユーザー入力で補完

create table if not exists master_mock_exams_raw (
  id               text primary key,            -- provider + year + slug
  provider         text not null,               -- kawai/sundai/toshin/yozemi/...
  raw_data         jsonb not null,
  fetched_at       timestamptz default now(),
  official_url     text
);

create index if not exists idx_master_mock_exams_raw_provider
  on master_mock_exams_raw (provider);

create table if not exists mock_exams (
  id               text primary key,            -- 例: "me-kawai-zenkoku-1"
  provider         text not null check (provider in (
    'kawai','sundai','toshin','yozemi','benesse','shinken','school','other'
  )),
  name             text not null,
  kana             text,
  aliases          text[] default '{}',
  year             integer not null,
  exam_date        date,
  deadline         date,
  target_grades    text[] not null default '{}', -- h1/h2/h3/ronin
  format           text not null check (format in (
    'mark','descriptive','mark-descriptive','common-test-trial','univ-specific'
  )),
  official_url     text,
  target_university_ids text[] default '{}',    -- 冠模試の場合
  notes            text,
  source           text not null default 'seed',
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  search_text      text generated always as (
    lower(coalesce(name,'') || ' ' || coalesce(kana,'') || ' ' ||
          coalesce(array_to_string(aliases,' '), '') || ' ' ||
          coalesce(provider,''))
  ) stored
);

create index if not exists idx_mock_exams_search_text
  on mock_exams using gin (to_tsvector('simple', search_text));
create index if not exists idx_mock_exams_provider
  on mock_exams (provider);
create index if not exists idx_mock_exams_exam_date
  on mock_exams (exam_date);
