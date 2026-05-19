-- ユーザー手入力マスターデータ
-- ユーザーが「見つからなかった」大学・高校・参考書・模試を追加するためのワークテーブル
-- 管理者がレビューして本テーブルに反映する想定

create table if not exists user_master_additions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid,                        -- 後で auth.users への参照を追加
  kind             text not null check (kind in (
    'university','highschool','textbook','mock-exam','subject','unit'
  )),
  data             jsonb not null,              -- 該当エンティティの Partial<>
  status           text not null default 'draft' check (status in (
    'draft','pending','approved','rejected'
  )),
  review_note      text,
  reviewed_by      uuid,
  reviewed_at      timestamptz,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index if not exists idx_user_master_additions_kind
  on user_master_additions (kind);
create index if not exists idx_user_master_additions_status
  on user_master_additions (status);
create index if not exists idx_user_master_additions_user
  on user_master_additions (user_id);

-- RLS（Row Level Security）方針:
-- - 本人のみ自分の draft/pending を読み書き
-- - approved は全員参照可（マスターと同等）
-- 詳細は Supabase Auth 接続後に追加
