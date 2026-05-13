// 学年別の科目・単元データ（高1/2/3 + 浪人）
// 2022年新課程ベース。実際の履修順は学校により異なるが、標準的な配列。

export type GradeId = "h1" | "h2" | "h3" | "ronin";

// 5大カテゴリ — マイページの実力パラメーターと連動
export type SubjectCategory =
  | "japanese"
  | "math"
  | "english"
  | "science"
  | "social"
  | "info";

export const CATEGORY_DEFS: {
  id: SubjectCategory;
  name: string;
  shortName: string;
  tone: string; // tailwind utility
  iconKey: "BookOpen" | "Calculator" | "MessageSquare" | "FlaskConical" | "Globe2" | "Cpu";
}[] = [
  {
    id: "japanese",
    name: "国語",
    shortName: "国",
    tone: "bg-peach-100 text-peach-500",
    iconKey: "BookOpen",
  },
  {
    id: "math",
    name: "数学",
    shortName: "数",
    tone: "bg-sky-100 text-sky-700",
    iconKey: "Calculator",
  },
  {
    id: "english",
    name: "英語",
    shortName: "英",
    tone: "bg-mint-100 text-mint-600",
    iconKey: "MessageSquare",
  },
  {
    id: "science",
    name: "理科",
    shortName: "理",
    tone: "bg-sun-200 text-ink-900",
    iconKey: "FlaskConical",
  },
  {
    id: "social",
    name: "社会",
    shortName: "社",
    tone: "bg-coral-300/50 text-coral-500",
    iconKey: "Globe2",
  },
  {
    id: "info",
    name: "情報",
    shortName: "情",
    tone: "bg-ink-200 text-ink-700",
    iconKey: "Cpu",
  },
];

export function getCategoryDef(id: SubjectCategory) {
  return CATEGORY_DEFS.find((c) => c.id === id) ?? CATEGORY_DEFS[0];
}

export type SubjectId =
  | "math1a"
  | "math2bc"
  | "math3c"
  | "english-comm"
  | "english-logic"
  | "japanese-modern"
  | "japanese-classic"
  | "physics-basic"
  | "physics"
  | "chemistry-basic"
  | "chemistry"
  | "biology-basic"
  | "biology"
  | "earth-basic"
  | "earth"
  | "history-general"
  | "japanese-history"
  | "world-history"
  | "geography-general"
  | "geography"
  | "civics-public"
  | "civics-politics"
  | "civics-ethics"
  | "info1";

export type SubjectDef = {
  id: SubjectId;
  name: string;
  shortName: string;
  category: SubjectCategory;
  // 通常履修される学年（メイン）
  grades: GradeId[];
  units: string[];
};

export function subjectsForCategory(
  category: SubjectCategory,
  grade?: GradeId,
): SubjectDef[] {
  return SUBJECTS_V2.filter(
    (s) => s.category === category && (!grade || s.grades.includes(grade)),
  );
}

export const SUBJECTS_V2: SubjectDef[] = [
  // ── 数学 ──
  {
    id: "math1a",
    name: "数学Ⅰ・A",
    shortName: "数IA",
    category: "math",
    grades: ["h1", "h2", "h3", "ronin"],
    units: [
      "数と式",
      "集合と命題",
      "二次関数",
      "図形と計量（三角比）",
      "データの分析",
      "場合の数",
      "確率",
      "図形の性質",
      "整数の性質",
    ],
  },
  {
    id: "math2bc",
    name: "数学Ⅱ・B・C",
    shortName: "数IIBC",
    category: "math",
    grades: ["h2", "h3", "ronin"],
    units: [
      "式と証明",
      "複素数と方程式",
      "図形と方程式",
      "三角関数",
      "指数関数・対数関数",
      "微分法（II）",
      "積分法（II）",
      "数列",
      "統計的な推測",
      "ベクトル",
      "平面上の曲線・複素数平面",
    ],
  },
  {
    id: "math3c",
    name: "数学Ⅲ・C",
    shortName: "数IIIC",
    category: "math",
    grades: ["h3", "ronin"],
    units: [
      "極限",
      "微分法（III）",
      "微分法の応用",
      "積分法（III）",
      "積分法の応用",
      "複素数平面（応用）",
      "式と曲線",
      "ベクトル（応用）",
    ],
  },
  // ── 英語 ──
  {
    id: "english-comm",
    name: "英語コミュニケーション",
    shortName: "英コミュ",
    category: "english",
    grades: ["h1", "h2", "h3", "ronin"],
    units: [
      "単語・熟語",
      "リーディング（基礎）",
      "リーディング（長文）",
      "リスニング",
      "発音・アクセント",
      "会話表現",
    ],
  },
  {
    id: "english-logic",
    name: "論理・表現",
    shortName: "英表現",
    category: "english",
    grades: ["h1", "h2", "h3", "ronin"],
    units: [
      "文法（時制）",
      "文法（助動詞・仮定法）",
      "文法（不定詞・動名詞）",
      "文法（分詞・関係詞）",
      "文法（比較・倒置）",
      "英作文（和文英訳）",
      "英作文（自由英作）",
      "ディスカッション・スピーキング",
    ],
  },
  // ── 国語 ──
  {
    id: "japanese-modern",
    name: "現代の国語・論理国語・文学国語",
    shortName: "現代文",
    category: "japanese",
    grades: ["h1", "h2", "h3", "ronin"],
    units: [
      "評論文（読解）",
      "評論文（要約）",
      "小説（読解）",
      "随筆・エッセイ",
      "実用的文章",
      "漢字・語彙",
    ],
  },
  {
    id: "japanese-classic",
    name: "言語文化・古典探究",
    shortName: "古典",
    category: "japanese",
    grades: ["h1", "h2", "h3", "ronin"],
    units: [
      "古文単語",
      "古文文法（用言）",
      "古文文法（助動詞）",
      "古文文法（敬語）",
      "古文読解",
      "和歌・俳句",
      "漢文句法",
      "漢文単語",
      "漢文読解",
    ],
  },
  // ── 理科 基礎 ──
  {
    id: "physics-basic",
    name: "物理基礎",
    shortName: "物基",
    category: "science",
    grades: ["h1", "h2"],
    units: [
      "運動とエネルギー",
      "波動（基礎）",
      "電気（基礎）",
      "熱（基礎）",
      "エネルギーとその利用",
    ],
  },
  {
    id: "chemistry-basic",
    name: "化学基礎",
    shortName: "化基",
    category: "science",
    grades: ["h1", "h2"],
    units: [
      "物質の構成",
      "物質量と化学反応式",
      "酸と塩基",
      "酸化還元",
      "化学が拓く世界",
    ],
  },
  {
    id: "biology-basic",
    name: "生物基礎",
    shortName: "生基",
    category: "science",
    grades: ["h1", "h2"],
    units: [
      "生物の特徴",
      "遺伝子とその働き",
      "ヒトの体の調節",
      "植生の多様性と分布",
      "生態系とその保全",
    ],
  },
  {
    id: "earth-basic",
    name: "地学基礎",
    shortName: "地基",
    category: "science",
    grades: ["h1", "h2"],
    units: [
      "地球の構成と内部",
      "活動する地球",
      "大気と海洋",
      "宇宙の中の地球",
      "古生物の変遷と地球環境",
    ],
  },
  // ── 理科 発展 ──
  {
    id: "physics",
    name: "物理",
    shortName: "物理",
    category: "science",
    grades: ["h2", "h3", "ronin"],
    units: [
      "力学（運動方程式）",
      "力学（エネルギー保存）",
      "力学（円運動・単振動）",
      "力学（万有引力）",
      "熱力学",
      "波動（波の性質）",
      "波動（音・光）",
      "電磁気（電場・電位）",
      "電磁気（電流・回路）",
      "電磁気（電磁誘導・交流）",
      "原子",
    ],
  },
  {
    id: "chemistry",
    name: "化学",
    shortName: "化学",
    category: "science",
    grades: ["h2", "h3", "ronin"],
    units: [
      "物質の状態と気体",
      "溶液と平衡",
      "化学反応と熱",
      "電池と電気分解",
      "反応速度と化学平衡",
      "無機化学（典型元素）",
      "無機化学（遷移元素）",
      "有機化学（脂肪族）",
      "有機化学（芳香族）",
      "高分子化合物",
    ],
  },
  {
    id: "biology",
    name: "生物",
    shortName: "生物",
    category: "science",
    grades: ["h2", "h3", "ronin"],
    units: [
      "細胞と分子",
      "代謝（呼吸・光合成）",
      "遺伝情報の発現",
      "発生と分化",
      "動物の反応と行動",
      "植物の環境応答",
      "生態と環境",
      "生命の進化と系統",
    ],
  },
  {
    id: "earth",
    name: "地学",
    shortName: "地学",
    category: "science",
    grades: ["h2", "h3", "ronin"],
    units: [
      "地球の構造",
      "地球の歴史",
      "大気と海洋",
      "宇宙の構造",
      "地球の環境",
    ],
  },
  // ── 社会 ──
  {
    id: "history-general",
    name: "歴史総合",
    shortName: "歴総",
    category: "social",
    grades: ["h1"],
    units: ["近代化と私たち", "国際秩序の変化", "グローバル化と私たち"],
  },
  {
    id: "japanese-history",
    name: "日本史探究",
    shortName: "日史",
    category: "social",
    grades: ["h2", "h3", "ronin"],
    units: [
      "古代（旧石器〜平安）",
      "中世（鎌倉〜室町）",
      "近世（戦国〜江戸）",
      "近代（明治〜大正）",
      "現代（昭和〜平成）",
      "テーマ史（外交・文化）",
    ],
  },
  {
    id: "world-history",
    name: "世界史探究",
    shortName: "世史",
    category: "social",
    grades: ["h2", "h3", "ronin"],
    units: [
      "古代オリエント・地中海",
      "古代中国・南アジア",
      "中世ヨーロッパ",
      "イスラーム世界",
      "大航海時代・近世",
      "近代ヨーロッパ・産業革命",
      "帝国主義と世界大戦",
      "現代史（戦後〜冷戦〜現代）",
      "テーマ史",
    ],
  },
  {
    id: "geography-general",
    name: "地理総合",
    shortName: "地総",
    category: "social",
    grades: ["h1"],
    units: ["地図・GIS", "国際理解と国際協力", "防災と地域づくり"],
  },
  {
    id: "geography",
    name: "地理探究",
    shortName: "地理",
    category: "social",
    grades: ["h2", "h3", "ronin"],
    units: [
      "自然環境（地形・気候）",
      "資源と産業",
      "人口・都市・村落",
      "民族・宗教・言語",
      "現代世界の諸地域",
      "地誌（アジア・ヨーロッパ・アメリカ）",
    ],
  },
  {
    id: "civics-public",
    name: "公共",
    shortName: "公共",
    category: "social",
    grades: ["h1", "h2"],
    units: ["主体的な公共社会の形成", "公共空間における基本原理", "経済の働き"],
  },
  {
    id: "civics-politics",
    name: "政治・経済",
    shortName: "政経",
    category: "social",
    grades: ["h3", "ronin"],
    units: [
      "民主政治の原理と機構",
      "日本国憲法と基本的人権",
      "国会・内閣・裁判所",
      "経済主体と市場",
      "国民所得と財政",
      "国際経済・国際政治",
    ],
  },
  {
    id: "civics-ethics",
    name: "倫理",
    shortName: "倫理",
    category: "social",
    grades: ["h3", "ronin"],
    units: [
      "青年期と自己形成",
      "源流思想（ギリシア・キリスト・仏教）",
      "中国思想",
      "日本思想",
      "近代思想（西洋）",
      "現代思想",
    ],
  },
  // ── 情報 ──
  {
    id: "info1",
    name: "情報Ⅰ",
    shortName: "情I",
    category: "info",
    grades: ["h1", "h2", "h3", "ronin"],
    units: [
      "情報社会と問題解決",
      "コミュニケーションと情報デザイン",
      "コンピュータとプログラミング",
      "情報通信ネットワークとデータ活用",
    ],
  },
];

export function subjectsForGrade(grade: GradeId): SubjectDef[] {
  return SUBJECTS_V2.filter((s) => s.grades.includes(grade));
}

export function getSubject(id: SubjectId): SubjectDef | undefined {
  return SUBJECTS_V2.find((s) => s.id === id);
}

export function findSubjectByName(name: string): SubjectDef | undefined {
  return SUBJECTS_V2.find((s) => s.name === name || s.shortName === name);
}

// 模試・テストの種類（学校系 / 全国模試系）
export const TEST_KINDS = [
  { id: "midterm", name: "中間テスト", scope: "school" },
  { id: "final", name: "期末テスト", scope: "school" },
  { id: "school-mock", name: "校内模試", scope: "school" },
  { id: "national-mock", name: "全国模試", scope: "national" },
  { id: "kawai-mock", name: "河合塾 全統模試", scope: "national" },
  { id: "sundai-mock", name: "駿台模試", scope: "national" },
  { id: "toshin-mock", name: "東進 共通テスト本番レベル模試", scope: "national" },
  { id: "benesse-mock", name: "ベネッセ 進研模試", scope: "national" },
  { id: "common-test", name: "共通テスト（本番）", scope: "national" },
  { id: "univ-exam", name: "大学個別試験", scope: "exam" },
  { id: "other", name: "その他", scope: "school" },
] as const;

export type TestKindId = (typeof TEST_KINDS)[number]["id"];
