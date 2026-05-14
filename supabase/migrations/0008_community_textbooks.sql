-- Community Textbooks: UGC でバーコード追加した書籍を全ユーザーで共有
-- ISBN ベースで一意。OpenBD でも見つからなかった書籍をユーザーが手動追加した場合も含む。

create table if not exists community_textbooks (
  isbn         text primary key,        -- ISBN-13 (978/979 から始まる)
  title        text not null,
  author       text,
  publisher    text,
  cover_url    text,
  pages        int,
  subject_hint text,                    -- "math" / "english" 等 (タイトルから推定)
  added_by     uuid,                    -- auth.uid()。null なら system
  use_count    int default 1,           -- 何人が本棚に追加したか (人気指標)
  first_added  timestamptz default now(),
  last_seen    timestamptz default now()
);

create index if not exists idx_community_textbooks_use_count
  on community_textbooks (use_count desc);

create index if not exists idx_community_textbooks_subject
  on community_textbooks (subject_hint);

-- RLS
alter table community_textbooks enable row level security;

-- 誰でも read (anon を含む)
drop policy if exists "read_all" on community_textbooks;
create policy "read_all" on community_textbooks
  for select using (true);

-- 認証ユーザーのみ insert
drop policy if exists "insert_auth" on community_textbooks;
create policy "insert_auth" on community_textbooks
  for insert with check (auth.uid() is not null);

-- 認証ユーザーは use_count をインクリメントできる
drop policy if exists "update_auth" on community_textbooks;
create policy "update_auth" on community_textbooks
  for update using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- upsert + use_count++ を行う rpc
create or replace function community_textbook_upsert(
  p_isbn        text,
  p_title       text,
  p_author      text default null,
  p_publisher   text default null,
  p_cover_url   text default null,
  p_pages       int default null,
  p_subject_hint text default null
) returns void
language plpgsql
security invoker
as $$
begin
  insert into community_textbooks (isbn, title, author, publisher, cover_url, pages, subject_hint, added_by)
  values (p_isbn, p_title, p_author, p_publisher, p_cover_url, p_pages, p_subject_hint, auth.uid())
  on conflict (isbn) do update set
    use_count = community_textbooks.use_count + 1,
    last_seen = now(),
    -- 既存より良いデータが来たら上書き (null じゃないものだけ)
    title = coalesce(excluded.title, community_textbooks.title),
    author = coalesce(excluded.author, community_textbooks.author),
    publisher = coalesce(excluded.publisher, community_textbooks.publisher),
    cover_url = coalesce(excluded.cover_url, community_textbooks.cover_url),
    pages = coalesce(excluded.pages, community_textbooks.pages),
    subject_hint = coalesce(excluded.subject_hint, community_textbooks.subject_hint);
end;
$$;

grant execute on function community_textbook_upsert to anon, authenticated;
