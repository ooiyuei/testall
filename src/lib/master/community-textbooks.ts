// Community Textbooks: ユーザーが追加した書籍データを全ユーザーで共有する UGC レイヤー
// バーコードスキャンで未知の ISBN が現れたら community_textbooks に upsert し、
// 次に同じ ISBN を見た別のユーザーがすぐに使える状態にする。

import { getSupabase } from "../supabase";

export type CommunityTextbook = {
  isbn: string;
  title: string;
  author?: string | null;
  publisher?: string | null;
  cover_url?: string | null;
  pages?: number | null;
  subject_hint?: string | null;
  use_count: number;
  first_added: string;
  last_seen: string;
};

/**
 * 単一 ISBN で community_textbooks を検索。
 * 接続失敗時は null を返す (フォールバック必須)。
 */
export async function fetchCommunityTextbook(
  isbn: string,
): Promise<CommunityTextbook | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("community_textbooks")
      .select("*")
      .eq("isbn", isbn)
      .maybeSingle();
    if (error) {
      console.warn("[community] fetch error:", error.message);
      return null;
    }
    return (data as CommunityTextbook) ?? null;
  } catch (e) {
    console.warn("[community] fetch threw:", e);
    return null;
  }
}

/**
 * ISBN + メタデータを upsert。既存なら use_count をインクリメント。
 * 認証されていない場合は no-op (RLS で弾かれる)。
 */
export async function upsertCommunityTextbook(payload: {
  isbn: string;
  title: string;
  author?: string | null;
  publisher?: string | null;
  cover_url?: string | null;
  pages?: number | null;
  subject_hint?: string | null;
}): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { error } = await supabase.rpc("community_textbook_upsert", {
      p_isbn: payload.isbn,
      p_title: payload.title,
      p_author: payload.author ?? null,
      p_publisher: payload.publisher ?? null,
      p_cover_url: payload.cover_url ?? null,
      p_pages: payload.pages ?? null,
      p_subject_hint: payload.subject_hint ?? null,
    });
    if (error) {
      console.warn("[community] upsert error:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[community] upsert threw:", e);
    return false;
  }
}

/**
 * 人気順 (use_count 降順) で community_textbooks を取得。
 * Search や Recommendations で使える。
 */
export async function listPopularCommunityTextbooks(
  limit = 50,
): Promise<CommunityTextbook[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("community_textbooks")
      .select("*")
      .order("use_count", { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data ?? []) as CommunityTextbook[];
  } catch {
    return [];
  }
}

// タイトルから科目を推定 (master/textbooks の bulk スクリプトと同じロジックの簡易版)
export function guessSubjectFromTitle(title: string): string | null {
  const t = title.toLowerCase();
  if (/数学|チャート|focus gold|フォーカス|微積/.test(t)) return "math";
  if (/英語|英単語|英文法|英文解釈|英作文|リスニング|ターゲット|シス単|duo|ポレポレ|ネクステ|vintage/.test(t)) return "english";
  if (/現代文|古文|漢文|国語|入試現代文/.test(t)) return "japanese";
  if (/物理|化学|生物|地学|理科|新研究|エッセンス|名問|良問/.test(t)) return "science";
  if (/日本史|世界史|地理|政治|経済|倫理|公共|社会|公民|歴史/.test(t)) return "social";
  if (/情報/.test(t)) return "info";
  return null;
}
