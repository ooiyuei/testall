// テスト科目名のテキストから SubjectAreaId を推定する
// 旧テストデータ（subject フィールドが自由テキスト）との互換のため

import type { SubjectAreaId } from "./hierarchy";

export function guessArea(name: string): SubjectAreaId {
  if (/数学|数IA|数IIBC|数IIIC|数Ⅰ|数Ⅱ|数Ⅲ|数A|数B|数C/.test(name)) return "math";
  if (/英語|英コミュ|英表現|リーディング|リスニング|英作|英解/.test(name)) return "english";
  if (/国語|現代文|古文|古典|漢文/.test(name)) return "japanese";
  if (/物理|化学|生物|地学|理科/.test(name)) return "science";
  if (/日本史|世界史|地理|歴総|地総/.test(name)) return "history";
  if (/公共|倫理|政治経済|政経|社会/.test(name)) return "civics";
  if (/情報/.test(name)) return "info";
  return "math";
}

export const PRIMARY_AREAS: SubjectAreaId[] = [
  "japanese",
  "math",
  "english",
  "science",
  "history",
];
