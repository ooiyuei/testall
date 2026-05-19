export type Subject = {
  id: string;
  name: string;
  units: string[];
};

export const SUBJECTS: Subject[] = [
  {
    id: "math",
    name: "数学",
    units: [
      "数と式",
      "二次関数",
      "三角比・三角関数",
      "指数・対数",
      "図形と方程式",
      "微分・積分",
      "数列",
      "確率",
      "ベクトル",
      "複素数平面",
    ],
  },
  {
    id: "english",
    name: "英語",
    units: [
      "文法",
      "単語・熟語",
      "長文読解",
      "リスニング",
      "英作文",
      "発音・アクセント",
    ],
  },
  {
    id: "japanese",
    name: "国語",
    units: ["現代文（評論）", "現代文（小説）", "古文", "漢文"],
  },
  {
    id: "physics",
    name: "物理",
    units: ["力学", "熱力学", "波動", "電磁気", "原子"],
  },
  {
    id: "chemistry",
    name: "化学",
    units: ["理論化学", "無機化学", "有機化学", "高分子"],
  },
  {
    id: "biology",
    name: "生物",
    units: ["細胞", "代謝", "遺伝", "発生", "生態系", "進化"],
  },
  {
    id: "history",
    name: "日本史",
    units: ["古代", "中世", "近世", "近代", "現代"],
  },
  {
    id: "world",
    name: "世界史",
    units: ["古代", "中世", "近世", "近代", "現代"],
  },
];

export const TARGET_LEVELS = [
  { id: "national", name: "国公立難関（東大・京大・旧帝大）" },
  { id: "private-top", name: "私立難関（早慶上理）" },
  { id: "marchkk", name: "MARCH・関関同立" },
  { id: "national-mid", name: "国公立中堅" },
  { id: "private-mid", name: "私立中堅（日東駒専・産近甲龍）" },
  { id: "general", name: "一般大学" },
];

export const GRADES = [
  { id: "h1", name: "高1" },
  { id: "h2", name: "高2" },
  { id: "h3", name: "高3" },
  { id: "ronin", name: "浪人" },
];
