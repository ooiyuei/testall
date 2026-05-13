// 主要大学の kana / aliases / schoolCode 補完辞書
// 既存 UNIVERSITIES データに対して、検索性向上のために重ねる
// TODO: 大学ポートレートAPIから学校コードを一括取得して置換

export type UniversityAliasEntry = {
  kana?: string;
  aliases?: string[];
  schoolCode?: string;
  homepage?: string;
};

export const UNIVERSITY_ALIASES: Record<string, UniversityAliasEntry> = {
  "u-tokyo": {
    kana: "とうきょうだいがく",
    aliases: ["東大", "U.Tokyo", "Todai"],
    schoolCode: "8300001",
    homepage: "https://www.u-tokyo.ac.jp/",
  },
  "u-kyoto": {
    kana: "きょうとだいがく",
    aliases: ["京大", "Kyodai"],
    schoolCode: "8300002",
    homepage: "https://www.kyoto-u.ac.jp/",
  },
  hitotsubashi: {
    kana: "ひとつばしだいがく",
    aliases: ["一橋", "一橋大"],
  },
  titech: {
    kana: "とうきょうこうぎょうだいがく",
    aliases: ["東工大", "Tokyo Tech"],
  },
  osaka: {
    kana: "おおさかだいがく",
    aliases: ["阪大"],
  },
  tohoku: {
    kana: "とうほくだいがく",
    aliases: ["東北大"],
  },
  nagoya: {
    kana: "なごやだいがく",
    aliases: ["名大"],
  },
  hokkaido: {
    kana: "ほっかいどうだいがく",
    aliases: ["北大"],
  },
  kyushu: {
    kana: "きゅうしゅうだいがく",
    aliases: ["九大"],
  },
  kobe: {
    kana: "こうべだいがく",
    aliases: ["神大"],
  },
  tsukuba: {
    kana: "つくばだいがく",
  },
  yokohama: {
    kana: "よこはまこくりつだいがく",
    aliases: ["横国"],
  },
  ochanomizu: {
    kana: "おちゃのみずじょしだいがく",
    aliases: ["お茶大"],
  },
  tokyogeidai: {
    kana: "とうきょうげいじゅつだいがく",
    aliases: ["芸大", "東京藝大"],
  },
  todai_no_keio: {
    kana: "けいおうぎじゅくだいがく",
    aliases: ["慶應", "慶應義塾"],
  },
  keio: {
    kana: "けいおうぎじゅくだいがく",
    aliases: ["慶應", "慶大", "Keio"],
  },
  waseda: {
    kana: "わせだだいがく",
    aliases: ["早大", "Waseda"],
  },
  sophia: {
    kana: "じょうちだいがく",
    aliases: ["上智", "Sophia"],
  },
  icu: {
    kana: "こくさいきりすときょうだいがく",
    aliases: ["ICU"],
  },
  meiji: {
    kana: "めいじだいがく",
    aliases: ["明大"],
  },
  aoyama: {
    kana: "あおやまがくいんだいがく",
    aliases: ["青学"],
  },
  rikkyo: {
    kana: "りっきょうだいがく",
    aliases: ["立教"],
  },
  chuo: {
    kana: "ちゅうおうだいがく",
    aliases: ["中大"],
  },
  hosei: {
    kana: "ほうせいだいがく",
    aliases: ["法大"],
  },
  gakushuin: {
    kana: "がくしゅういんだいがく",
  },
  kansai: {
    kana: "かんさいだいがく",
    aliases: ["関大"],
  },
  kansei: {
    kana: "かんせいがくいんだいがく",
    aliases: ["関学"],
  },
  doshisha: {
    kana: "どうししゃだいがく",
  },
  ritsumei: {
    kana: "りつめいかんだいがく",
    aliases: ["立命"],
  },
  rikadai: {
    kana: "とうきょうりかだいがく",
    aliases: ["理科大"],
  },
};
