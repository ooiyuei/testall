-- 0009: master系テーブルのRLS有効化
-- 目的: Supabase Security Advisor の rls_disabled_in_public 警告を解消し、
--       anonキーでのマスターデータ改ざん(偏差値/大学名の書換え)を防ぐ。
-- 方針:
--   公開マスタ      : anon/authenticated は SELECT のみ。書込は service_role のみ(=書込ポリシー無し)。
--   取込ステージング: RLS有効・ポリシー無し = service_role 専用(外部から不可視)。
--   user_master_additions: 本人のみ自分の行を管理 + status='approved' は公開read。
-- 適用後: get_advisors(security) で rls_disabled_in_public が消えること、
--         かつアプリで大学/参考書一覧が従来通り表示されることを確認する。

-- ── 公開read マスタ ──────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'highschools', 'universities', 'university_faculties',
    'textbooks', 'mock_exams', 'subjects_master', 'units_master'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "public_read" on public.%I;', t);
    execute format('create policy "public_read" on public.%I for select using (true);', t);
  end loop;
end $$;

-- ── 取込ステージング (service_role 専用 = ポリシー無し) ──
do $$
declare t text;
begin
  foreach t in array array[
    'master_highschools_raw', 'master_universities_raw',
    'master_textbooks_raw', 'master_mock_exams_raw'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;

-- ── user_master_additions ───────────────────────
alter table public.user_master_additions enable row level security;

drop policy if exists "users_manage_own" on public.user_master_additions;
create policy "users_manage_own"
  on public.user_master_additions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "read_approved" on public.user_master_additions;
create policy "read_approved"
  on public.user_master_additions
  for select
  using (status = 'approved');
