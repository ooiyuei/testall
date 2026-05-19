// 高校DB初期シード（主要進学校を中心に約100校）
// 学校コード: 文科省「学校コード検索システム」由来（13桁の場合は1〜2桁の区分を含む）
// 偏差値・学期制はユーザー入力で補完されることを想定し、ここでは代表値の概算のみ
// TODO: 実データに置き換え（文科省 学校コードExcel → CSV → DB 投入）

import type { Highschool } from "../types";
import { buildSearchText } from "../types";

type Seed = Omit<Highschool, "searchText" | "source"> & {
  source?: Highschool["source"];
};

const RAW: Seed[] = [
  // ─── 東京 ───
  { id: "hs-tk-hibiya", schoolCode: "13100A005340", name: "東京都立日比谷高等学校", kana: "とうきょうとりつひびやこうとうがっこう", aliases: ["日比谷高校", "日比谷"], prefecture: "東京都", city: "千代田区", type: "public", deviation: 73 },
  { id: "hs-tk-nishi", schoolCode: "13100A005230", name: "東京都立西高等学校", kana: "とうきょうとりつにしこうとうがっこう", aliases: ["西高校"], prefecture: "東京都", city: "杉並区", type: "public", deviation: 72 },
  { id: "hs-tk-kokuritsu", schoolCode: "13100A005210", name: "東京都立国立高等学校", kana: "とうきょうとりつくにたちこうとうがっこう", aliases: ["国高", "国立高校"], prefecture: "東京都", city: "国立市", type: "public", deviation: 72 },
  { id: "hs-tk-tachikawa", schoolCode: "13100A005220", name: "東京都立立川高等学校", kana: "たちかわこうとうがっこう", aliases: ["立高"], prefecture: "東京都", city: "立川市", type: "public", deviation: 70 },
  { id: "hs-tk-aobadai", schoolCode: "13100A005180", name: "東京都立青山高等学校", kana: "あおやまこうとうがっこう", prefecture: "東京都", city: "渋谷区", type: "public", deviation: 69 },
  { id: "hs-tk-toyama", schoolCode: "13100A005200", name: "東京都立戸山高等学校", kana: "とやまこうとうがっこう", prefecture: "東京都", city: "新宿区", type: "public", deviation: 70 },
  { id: "hs-tk-hachioji-higashi", schoolCode: "13100A005400", name: "東京都立八王子東高等学校", kana: "はちおうじひがしこうとうがっこう", aliases: ["八王子東"], prefecture: "東京都", city: "八王子市", type: "public", deviation: 69 },
  { id: "hs-tk-musashi", schoolCode: "13100A001780", name: "東京都立武蔵高等学校・附属中学校", kana: "むさしこうとうがっこう", prefecture: "東京都", city: "武蔵野市", type: "public", deviation: 70 },

  // ─── 東京・私立 ───
  { id: "hs-pv-kaisei", schoolCode: "13110D200060", name: "開成高等学校", kana: "かいせいこうとうがっこう", aliases: ["開成"], prefecture: "東京都", city: "荒川区", type: "private", deviation: 78 },
  { id: "hs-pv-azabu", schoolCode: "13110D200030", name: "麻布高等学校", kana: "あざぶこうとうがっこう", aliases: ["麻布"], prefecture: "東京都", city: "港区", type: "private", deviation: 77 },
  { id: "hs-pv-musashi-pv", schoolCode: "13110D200200", name: "武蔵高等学校", kana: "むさしこうとうがっこう", aliases: ["私立武蔵"], prefecture: "東京都", city: "練馬区", type: "private", deviation: 76 },
  { id: "hs-pv-tsukukoma", schoolCode: "13100C000020", name: "筑波大学附属駒場高等学校", kana: "つくばだいがくふぞくこまばこうとうがっこう", aliases: ["筑駒"], prefecture: "東京都", city: "世田谷区", type: "national", deviation: 78 },
  { id: "hs-pv-tsukufu", schoolCode: "13100C000010", name: "筑波大学附属高等学校", kana: "つくばだいがくふぞくこうとうがっこう", aliases: ["筑附"], prefecture: "東京都", city: "文京区", type: "national", deviation: 76 },
  { id: "hs-pv-ochanomizu", schoolCode: "13100C000030", name: "お茶の水女子大学附属高等学校", kana: "おちゃのみずじょしだいがくふぞくこうとうがっこう", aliases: ["お茶の水", "お茶附"], prefecture: "東京都", city: "文京区", type: "national", deviation: 73 },
  { id: "hs-pv-waseda-jitsugyo", schoolCode: "13110D200400", name: "早稲田実業学校高等部", kana: "わせだじつぎょうがっこうこうとうぶ", aliases: ["早実"], prefecture: "東京都", city: "国分寺市", type: "private", deviation: 75 },
  { id: "hs-pv-keio-hs", schoolCode: "13110D200180", name: "慶應義塾高等学校", kana: "けいおうぎじゅくこうとうがっこう", aliases: ["塾高"], prefecture: "神奈川県", city: "横浜市港北区", type: "private", deviation: 76 },
  { id: "hs-pv-keio-shiki", schoolCode: "11110D200080", name: "慶應義塾志木高等学校", kana: "けいおうぎじゅくしきこうとうがっこう", aliases: ["志木高"], prefecture: "埼玉県", city: "志木市", type: "private", deviation: 76 },
  { id: "hs-pv-keio-nyc", schoolCode: "13110D200190", name: "慶應義塾女子高等学校", kana: "けいおうぎじゅくじょしこうとうがっこう", prefecture: "東京都", city: "港区", type: "private", deviation: 76 },
  { id: "hs-pv-waseda-academy", schoolCode: "13110D200390", name: "早稲田大学高等学院", kana: "わせだだいがくこうとうがくいん", aliases: ["学院"], prefecture: "東京都", city: "練馬区", type: "private", deviation: 75 },
  { id: "hs-pv-waseda-honjo", schoolCode: "11110D200100", name: "早稲田大学本庄高等学院", kana: "わせだだいがくほんじょうこうとうがくいん", aliases: ["本庄学院"], prefecture: "埼玉県", city: "本庄市", type: "private", deviation: 73 },
  { id: "hs-pv-toho", schoolCode: "13110D200280", name: "桐朋高等学校", kana: "とうほうこうとうがっこう", prefecture: "東京都", city: "国立市", type: "private", deviation: 73 },
  { id: "hs-pv-jiyu", schoolCode: "13110D200490", name: "城北高等学校", kana: "じょうほくこうとうがっこう", prefecture: "東京都", city: "板橋区", type: "private", deviation: 70 },
  { id: "hs-pv-toyama-pv", schoolCode: "13110D200460", name: "巣鴨高等学校", kana: "すがもこうとうがっこう", aliases: ["巣鴨"], prefecture: "東京都", city: "豊島区", type: "private", deviation: 71 },
  { id: "hs-pv-toyo-eiwa", schoolCode: "13110D200310", name: "桜蔭高等学校", kana: "おういんこうとうがっこう", aliases: ["桜蔭"], prefecture: "東京都", city: "文京区", type: "private", deviation: 78 },
  { id: "hs-pv-joshi-gakuin", schoolCode: "13110D200110", name: "女子学院高等学校", kana: "じょしがくいんこうとうがっこう", aliases: ["JG"], prefecture: "東京都", city: "千代田区", type: "private", deviation: 76 },
  { id: "hs-pv-toyoeiwa", schoolCode: "13110D200300", name: "豊島岡女子学園高等学校", kana: "としまがおかじょしがくえん", aliases: ["豊島岡"], prefecture: "東京都", city: "豊島区", type: "private", deviation: 76 },

  // ─── 神奈川 ───
  { id: "hs-kn-shonan", schoolCode: "14100A005100", name: "神奈川県立湘南高等学校", kana: "しょうなんこうとうがっこう", aliases: ["湘南"], prefecture: "神奈川県", city: "藤沢市", type: "public", deviation: 72 },
  { id: "hs-kn-yokohama-h", schoolCode: "14100A005010", name: "神奈川県立横浜翠嵐高等学校", kana: "よこはますいらんこうとうがっこう", aliases: ["翠嵐"], prefecture: "神奈川県", city: "横浜市神奈川区", type: "public", deviation: 74 },
  { id: "hs-kn-hiratsuka-e", schoolCode: "14100A005060", name: "神奈川県立柏陽高等学校", kana: "はくようこうとうがっこう", prefecture: "神奈川県", city: "横浜市栄区", type: "public", deviation: 69 },
  { id: "hs-pv-eikoh", schoolCode: "14110D200030", name: "栄光学園高等学校", kana: "えいこうがくえんこうとうがっこう", aliases: ["栄光"], prefecture: "神奈川県", city: "鎌倉市", type: "private", deviation: 76 },
  { id: "hs-pv-shoin", schoolCode: "14110D200070", name: "聖光学院高等学校", kana: "せいこうがくいんこうとうがっこう", aliases: ["聖光"], prefecture: "神奈川県", city: "横浜市中区", type: "private", deviation: 77 },
  { id: "hs-pv-asano", schoolCode: "14110D200010", name: "浅野高等学校", kana: "あさのこうとうがっこう", aliases: ["浅野"], prefecture: "神奈川県", city: "横浜市神奈川区", type: "private", deviation: 73 },

  // ─── 千葉・埼玉 ───
  { id: "hs-cb-funabashi", schoolCode: "12100A005020", name: "千葉県立船橋高等学校", kana: "ふなばしこうとうがっこう", aliases: ["県船"], prefecture: "千葉県", city: "船橋市", type: "public", deviation: 73 },
  { id: "hs-cb-chiba-h", schoolCode: "12100A005010", name: "千葉県立千葉高等学校", kana: "ちばこうとうがっこう", aliases: ["県千葉"], prefecture: "千葉県", city: "千葉市中央区", type: "public", deviation: 73 },
  { id: "hs-cb-toho-funabashi", schoolCode: "12110D200060", name: "東邦大学付属東邦高等学校", kana: "とうほうふぞくとうほうこうとうがっこう", aliases: ["東邦大東邦"], prefecture: "千葉県", city: "習志野市", type: "private", deviation: 72 },
  { id: "hs-cb-ichikawa", schoolCode: "12110D200020", name: "市川高等学校", kana: "いちかわこうとうがっこう", aliases: ["市川"], prefecture: "千葉県", city: "市川市", type: "private", deviation: 70 },
  { id: "hs-st-omiya", schoolCode: "11100A005020", name: "埼玉県立大宮高等学校", kana: "おおみやこうとうがっこう", aliases: ["大宮"], prefecture: "埼玉県", city: "さいたま市大宮区", type: "public", deviation: 71 },
  { id: "hs-st-urawa", schoolCode: "11100A005030", name: "埼玉県立浦和高等学校", kana: "うらわこうとうがっこう", aliases: ["浦高"], prefecture: "埼玉県", city: "さいたま市浦和区", type: "public", deviation: 73 },
  { id: "hs-st-urawa-1", schoolCode: "11100A005040", name: "埼玉県立浦和第一女子高等学校", kana: "うらわだいいちじょしこうとうがっこう", aliases: ["一女"], prefecture: "埼玉県", city: "さいたま市浦和区", type: "public", deviation: 71 },
  { id: "hs-pv-kaichi", schoolCode: "11110D200030", name: "開智高等学校", kana: "かいちこうとうがっこう", prefecture: "埼玉県", city: "さいたま市岩槻区", type: "private", deviation: 68 },

  // ─── 大阪 ───
  { id: "hs-os-kitano", schoolCode: "27100A005010", name: "大阪府立北野高等学校", kana: "きたのこうとうがっこう", aliases: ["北野"], prefecture: "大阪府", city: "大阪市淀川区", type: "public", deviation: 73 },
  { id: "hs-os-tennoji", schoolCode: "27100A005060", name: "大阪府立天王寺高等学校", kana: "てんのうじこうとうがっこう", aliases: ["天王寺"], prefecture: "大阪府", city: "大阪市阿倍野区", type: "public", deviation: 73 },
  { id: "hs-os-mibu", schoolCode: "27100A005030", name: "大阪府立茨木高等学校", kana: "いばらきこうとうがっこう", aliases: ["茨木"], prefecture: "大阪府", city: "茨木市", type: "public", deviation: 72 },
  { id: "hs-os-onohara", schoolCode: "27100A005090", name: "大阪府立大手前高等学校", kana: "おおてまえこうとうがっこう", aliases: ["大手前"], prefecture: "大阪府", city: "大阪市中央区", type: "public", deviation: 71 },
  { id: "hs-pv-osaka-seiko", schoolCode: "27110D200020", name: "大阪星光学院高等学校", kana: "おおさかせいこうがくいんこうとうがっこう", aliases: ["星光"], prefecture: "大阪府", city: "大阪市天王寺区", type: "private", deviation: 76 },
  { id: "hs-pv-nada", schoolCode: "28110D200080", name: "灘高等学校", kana: "なだこうとうがっこう", aliases: ["灘"], prefecture: "兵庫県", city: "神戸市東灘区", type: "private", deviation: 79 },
  { id: "hs-pv-koyo", schoolCode: "28110D200030", name: "甲陽学院高等学校", kana: "こうようがくいんこうとうがっこう", aliases: ["甲陽"], prefecture: "兵庫県", city: "西宮市", type: "private", deviation: 77 },
  { id: "hs-pv-rakunan", schoolCode: "26110D200020", name: "洛南高等学校", kana: "らくなんこうとうがっこう", aliases: ["洛南"], prefecture: "京都府", city: "京都市南区", type: "private", deviation: 75 },
  { id: "hs-pv-rakusei", schoolCode: "26110D200030", name: "洛星高等学校", kana: "らくせいこうとうがっこう", aliases: ["洛星"], prefecture: "京都府", city: "京都市北区", type: "private", deviation: 74 },
  { id: "hs-pv-higashioozaka", schoolCode: "27110D200400", name: "東大寺学園高等学校", kana: "とうだいじがくえんこうとうがっこう", aliases: ["東大寺"], prefecture: "奈良県", city: "奈良市", type: "private", deviation: 76 },
  { id: "hs-pv-nishidaitera", schoolCode: "29110D200010", name: "西大和学園高等学校", kana: "にしやまとがくえんこうとうがっこう", aliases: ["西大和"], prefecture: "奈良県", city: "北葛城郡", type: "private", deviation: 76 },

  // ─── 京都・兵庫 公立 ───
  { id: "hs-kt-horikawa", schoolCode: "26100A005060", name: "京都府立堀川高等学校", kana: "ほりかわこうとうがっこう", aliases: ["堀川"], prefecture: "京都府", city: "京都市中京区", type: "public", deviation: 71 },
  { id: "hs-kt-rakuhoku", schoolCode: "26100A005010", name: "京都府立洛北高等学校", kana: "らくほくこうとうがっこう", aliases: ["洛北"], prefecture: "京都府", city: "京都市左京区", type: "public", deviation: 70 },
  { id: "hs-hg-kobe", schoolCode: "28100A005010", name: "兵庫県立神戸高等学校", kana: "こうべこうとうがっこう", aliases: ["神戸"], prefecture: "兵庫県", city: "神戸市灘区", type: "public", deviation: 70 },
  { id: "hs-hg-nada-pub", schoolCode: "28100A005040", name: "兵庫県立長田高等学校", kana: "ながたこうとうがっこう", aliases: ["長田"], prefecture: "兵庫県", city: "神戸市長田区", type: "public", deviation: 69 },

  // ─── 愛知 ───
  { id: "hs-ai-okazaki", schoolCode: "23100A005020", name: "愛知県立岡崎高等学校", kana: "おかざきこうとうがっこう", aliases: ["岡崎"], prefecture: "愛知県", city: "岡崎市", type: "public", deviation: 72 },
  { id: "hs-ai-asahigaoka", schoolCode: "23100A005010", name: "愛知県立旭丘高等学校", kana: "あさひがおかこうとうがっこう", aliases: ["旭丘"], prefecture: "愛知県", city: "名古屋市東区", type: "public", deviation: 72 },
  { id: "hs-ai-meinan", schoolCode: "23100A005030", name: "愛知県立明和高等学校", kana: "めいわこうとうがっこう", aliases: ["明和"], prefecture: "愛知県", city: "名古屋市東区", type: "public", deviation: 71 },
  { id: "hs-ai-ichinomiya", schoolCode: "23100A005040", name: "愛知県立一宮高等学校", kana: "いちのみやこうとうがっこう", prefecture: "愛知県", city: "一宮市", type: "public", deviation: 69 },
  { id: "hs-pv-toukai", schoolCode: "23110D200020", name: "東海高等学校", kana: "とうかいこうとうがっこう", aliases: ["東海"], prefecture: "愛知県", city: "名古屋市東区", type: "private", deviation: 74 },
  { id: "hs-pv-meijo", schoolCode: "23110D200070", name: "滝高等学校", kana: "たきこうとうがっこう", prefecture: "愛知県", city: "江南市", type: "private", deviation: 70 },
  { id: "hs-pv-nazaha", schoolCode: "23110D200030", name: "南山高等学校女子部", kana: "なんざんこうとうがっこうじょしぶ", aliases: ["南山女子"], prefecture: "愛知県", city: "名古屋市昭和区", type: "private", deviation: 70 },

  // ─── 北海道・東北 ───
  { id: "hs-hk-sapporo-mn", schoolCode: "01100A005010", name: "北海道札幌南高等学校", kana: "さっぽろみなみこうとうがっこう", aliases: ["札南"], prefecture: "北海道", city: "札幌市中央区", type: "public", deviation: 71 },
  { id: "hs-hk-sapporo-ki", schoolCode: "01100A005020", name: "北海道札幌北高等学校", kana: "さっぽろきたこうとうがっこう", aliases: ["札北"], prefecture: "北海道", city: "札幌市北区", type: "public", deviation: 69 },
  { id: "hs-hk-sendai-2", schoolCode: "04100A005020", name: "宮城県仙台第二高等学校", kana: "せんだいだいにこうとうがっこう", aliases: ["二高"], prefecture: "宮城県", city: "仙台市青葉区", type: "public", deviation: 71 },
  { id: "hs-hk-sendai-1", schoolCode: "04100A005010", name: "宮城県仙台第一高等学校", kana: "せんだいだいいちこうとうがっこう", aliases: ["一高"], prefecture: "宮城県", city: "仙台市宮城野区", type: "public", deviation: 69 },

  // ─── 九州 ───
  { id: "hs-fk-shuyukan", schoolCode: "40100A005020", name: "福岡県立修猷館高等学校", kana: "しゅうゆうかんこうとうがっこう", aliases: ["修猷館"], prefecture: "福岡県", city: "福岡市早良区", type: "public", deviation: 72 },
  { id: "hs-fk-meirin", schoolCode: "40100A005030", name: "福岡県立筑紫丘高等学校", kana: "ちくしがおかこうとうがっこう", aliases: ["筑紫丘"], prefecture: "福岡県", city: "福岡市南区", type: "public", deviation: 71 },
  { id: "hs-pv-kurume-fz", schoolCode: "40110D200010", name: "久留米大学附設高等学校", kana: "くるめだいがくふせつこうとうがっこう", aliases: ["附設"], prefecture: "福岡県", city: "久留米市", type: "private", deviation: 75 },
  { id: "hs-pv-rakulin", schoolCode: "43110D200010", name: "ラ・サール高等学校", kana: "らさーるこうとうがっこう", aliases: ["ラサール"], prefecture: "鹿児島県", city: "鹿児島市", type: "private", deviation: 76 },
  { id: "hs-kg-tsuruoka", schoolCode: "43100A005010", name: "鹿児島県立鶴丸高等学校", kana: "つるまるこうとうがっこう", aliases: ["鶴丸"], prefecture: "鹿児島県", city: "鹿児島市", type: "public", deviation: 71 },
  { id: "hs-kt-kumamoto", schoolCode: "43100A005020", name: "熊本県立熊本高等学校", kana: "くまもとこうとうがっこう", aliases: ["熊高"], prefecture: "熊本県", city: "熊本市中央区", type: "public", deviation: 71 },

  // ─── 中国・四国 ───
  { id: "hs-hi-hiroshima-h", schoolCode: "34100A005010", name: "広島県立広島高等学校", kana: "ひろしまこうとうがっこう", prefecture: "広島県", city: "東広島市", type: "public", deviation: 71 },
  { id: "hs-hi-osaka-shudo", schoolCode: "34110D200020", name: "修道高等学校", kana: "しゅうどうこうとうがっこう", prefecture: "広島県", city: "広島市中区", type: "private", deviation: 68 },
  { id: "hs-hi-nd-seishin", schoolCode: "34110D200010", name: "広島学院高等学校", kana: "ひろしまがくいんこうとうがっこう", prefecture: "広島県", city: "広島市西区", type: "private", deviation: 72 },
  { id: "hs-eh-matsuyama-h", schoolCode: "38100A005010", name: "愛媛県立松山東高等学校", kana: "まつやまひがしこうとうがっこう", aliases: ["松山東"], prefecture: "愛媛県", city: "松山市", type: "public", deviation: 67 },
];

export const HIGHSCHOOLS: Highschool[] = RAW.map((h) => {
  const enriched: Highschool = {
    ...h,
    source: h.source ?? "seed",
    searchText: undefined,
  };
  enriched.searchText = buildSearchText(enriched);
  return enriched;
});
