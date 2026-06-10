// ISBN から書籍情報を引く API
// 1) ローカル textbook DB に登録済みなら Textbook をそのまま返す
// 2) Supabase の community_textbooks (UGC) にあればそれを返す
// 3) なければ OpenBD (https://api.openbd.jp) で照会して title/author/publisher/cover を返す
// 4) ヒットしたら community_textbooks に upsert (次のユーザーで使える)
// 5) 見つからなければ { ok: false, error: "not_found" }
//
// OpenBD は無料・API キー不要・国内書籍カバー率が高い

import { NextResponse } from "next/server";
import { TEXTBOOKS, findByIsbn } from "@/lib/master/textbooks";
import type { Textbook } from "@/lib/master";
import {
  fetchCommunityTextbook,
  upsertCommunityTextbook,
  guessSubjectFromTitle,
} from "@/lib/master/community-textbooks";

export const runtime = "nodejs";
export const maxDuration = 15;

type CustomBook = {
  isbn: string;
  title: string;
  author?: string;
  publisher?: string;
  pubdate?: string;
  coverUrl?: string;
};

type OkExisting = { ok: true; source: "local"; textbook: Textbook };
type OkCustom = { ok: true; source: "openbd" | "community"; custom: CustomBook };
type Fail = { ok: false; error: string };

// カバー画像 URL のサニタイズ — UGC (community DB) 由来の値が
// javascript:/data: 等のスキームだった場合に <img src> へ流さない
function safeHttpUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    if (u.protocol === "https:" || u.protocol === "http:") return url;
  } catch {
    /* invalid URL */
  }
  return undefined;
}

// ISBN を 13桁正規化 (ハイフン除去・10桁→13桁変換)
function normalizeIsbn(raw: string): string | null {
  const s = raw.replace(/[^0-9Xx]/g, "");
  if (s.length === 13) return /^[0-9]{13}$/.test(s) ? s : null;
  if (s.length === 10) return isbn10To13(s);
  return null;
}

function isbn10To13(isbn10: string): string | null {
  if (!/^[0-9]{9}[0-9Xx]$/.test(isbn10)) return null;
  const core = "978" + isbn10.slice(0, 9);
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const n = Number(core[i]);
    sum += i % 2 === 0 ? n : n * 3;
  }
  const check = (10 - (sum % 10)) % 10;
  return core + String(check);
}

// 簡易タイトル正規化 (ファジーマッチ用)
function normalizeTitle(t: string): string {
  return t
    .toLowerCase()
    .replace(/[\s　・·]/g, "")
    .replace(/[（(].*?[)）]/g, "")
    .replace(/[!！?？.,、。:：;；'"`]/g, "");
}

function fuzzyFindByTitle(title: string): Textbook | undefined {
  const target = normalizeTitle(title);
  if (target.length < 3) return undefined;
  return TEXTBOOKS.find((t) => {
    const candidate = normalizeTitle(t.name);
    return (
      candidate === target ||
      candidate.includes(target) ||
      target.includes(candidate)
    );
  });
}

type OpenBdHit = {
  summary?: {
    isbn?: string;
    title?: string;
    volume?: string;
    series?: string;
    publisher?: string;
    pubdate?: string;
    cover?: string;
    author?: string;
  };
};

async function fetchOpenBd(isbn: string): Promise<CustomBook | null> {
  const url = `https://api.openbd.jp/v1/get?isbn=${encodeURIComponent(isbn)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    // OpenBD は CDN 配信なので軽くキャッシュ
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!res.ok) return null;
  const body = (await res.json()) as Array<OpenBdHit | null>;
  const hit = Array.isArray(body) ? body[0] : null;
  const s = hit?.summary;
  if (!s || !s.title) return null;
  return {
    isbn,
    title: s.title,
    author: s.author || undefined,
    publisher: s.publisher || undefined,
    pubdate: s.pubdate || undefined,
    coverUrl: safeHttpUrl(s.cover),
  };
}

export async function GET(
  req: Request,
): Promise<NextResponse<OkExisting | OkCustom | Fail>> {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("isbn") ?? "";
  const isbn = normalizeIsbn(raw);
  if (!isbn) {
    return NextResponse.json(
      { ok: false, error: "invalid_isbn" },
      { status: 400 },
    );
  }

  // 1) 既存 DB マッチ
  const local = findByIsbn(isbn);
  if (local) {
    return NextResponse.json({ ok: true, source: "local", textbook: local });
  }

  // 2) Supabase の community_textbooks (UGC) — 過去にユーザーが追加した書籍
  const community = await fetchCommunityTextbook(isbn);
  if (community) {
    const custom: CustomBook = {
      isbn,
      title: community.title,
      author: community.author ?? undefined,
      publisher: community.publisher ?? undefined,
      coverUrl: safeHttpUrl(community.cover_url),
    };
    // 使われた回数を増やす (fire-and-forget)
    upsertCommunityTextbook({
      isbn,
      title: community.title,
      author: community.author,
      publisher: community.publisher,
      cover_url: community.cover_url,
      pages: community.pages,
      subject_hint: community.subject_hint,
    }).catch(() => {});
    return NextResponse.json({ ok: true, source: "community", custom });
  }

  // 3) OpenBD
  let openbd: CustomBook | null = null;
  try {
    openbd = await fetchOpenBd(isbn);
  } catch (e) {
    console.error("[isbn-lookup] openbd failed:", e);
  }

  if (!openbd) {
    return NextResponse.json(
      { ok: false, error: "not_found" },
      { status: 404 },
    );
  }

  // 4) OpenBD でヒットしたタイトルで DB ファジーマッチ
  const fuzzy = fuzzyFindByTitle(openbd.title);
  if (fuzzy) {
    return NextResponse.json({ ok: true, source: "local", textbook: fuzzy });
  }

  // 5) Community DB に保存 (次のユーザーで使える、fire-and-forget)
  upsertCommunityTextbook({
    isbn,
    title: openbd.title,
    author: openbd.author,
    publisher: openbd.publisher,
    cover_url: openbd.coverUrl,
    subject_hint: guessSubjectFromTitle(openbd.title),
  }).catch(() => {});

  return NextResponse.json({ ok: true, source: "openbd", custom: openbd });
}
