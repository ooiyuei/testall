// カリキュラム階層 — 受験戦略OS の根幹
//
// 構造:
//   教科 (subject_area)  例: 数学・国語・英語・理科・地歴・公民・情報
//   ├─ 科目 (subject)     例: 数学Ⅰ / 数学A / 古文 / リーディング / 物理基礎
//   │   └─ 領域 (domain) 例: ベクトル / 三角関数 / 評論 / 力学
//   │       └─ 単元 (unit) 例: 空間ベクトル / 平面ベクトル
//   │           └─ 能力 (ability) 例: 図形把握力 / 条件整理力
//
// テスト入力・診断・参考書フィルタの全てがこの階層で繋がる。

export type GradeId = "h1" | "h2" | "h3" | "ronin";

// ── 教科（大分類） ─────────────────────────────
export type SubjectAreaId =
  | "japanese"
  | "math"
  | "english"
  | "science"
  | "history"   // 地歴
  | "civics"    // 公民
  | "info";

export type SubjectArea = {
  id: SubjectAreaId;
  name: string;        // 国語
  shortName: string;   // 国
  tone: string;        // tailwind
  iconKey: string;     // lucide
  category: "humanities" | "sciences" | "common"; // 文/理/共通
};

export const SUBJECT_AREAS: SubjectArea[] = [
  { id: "japanese", name: "国語", shortName: "国", tone: "bg-coral-100 text-coral-500", iconKey: "BookOpen", category: "common" },
  { id: "math",     name: "数学", shortName: "数", tone: "bg-sky-100 text-sky-700",     iconKey: "Calculator", category: "common" },
  { id: "english",  name: "英語", shortName: "英", tone: "bg-mint-100 text-mint-600",   iconKey: "MessageSquare", category: "common" },
  { id: "science",  name: "理科", shortName: "理", tone: "bg-sun-200 text-ink-900",     iconKey: "FlaskConical", category: "sciences" },
  { id: "history",  name: "地歴", shortName: "歴", tone: "bg-coral-300/40 text-coral-500", iconKey: "Globe2", category: "humanities" },
  { id: "civics",   name: "公民", shortName: "公", tone: "bg-cream-200 text-ink-700",    iconKey: "Scale", category: "humanities" },
  { id: "info",     name: "情報", shortName: "情", tone: "bg-ink-200 text-ink-700",     iconKey: "Cpu", category: "common" },
];

export function getSubjectArea(id: SubjectAreaId): SubjectArea | undefined {
  return SUBJECT_AREAS.find((a) => a.id === id);
}

// ── 能力値 ──────────────────────────────────
export const ABILITIES = [
  "計算力",
  "式変形力",
  "図形把握力",
  "条件整理力",
  "論理構成力",
  "推論力",
  "抽象化力",
  "暗記力",
  "読解力",
  "速読力",
  "英文構造把握力",
  "和文英訳力",
  "発想力",
  "リスニング力",
  "因果関係把握力",
  "歴史的思考力",
  "地理的思考力",
  "データ分析力",
  "実験考察力",
] as const;
export type Ability = (typeof ABILITIES)[number];

// ── 階層型データ ────────────────────────────
export type Unit = {
  id: string;
  name: string;
  abilities?: Ability[];      // 主要に必要な能力
  examFrequency?: "high" | "mid" | "low";
};

export type Domain = {
  id: string;
  name: string;
  units: Unit[];
};

export type Subject = {
  id: string;
  area: SubjectAreaId;
  name: string;          // 数学C
  shortName: string;     // 数C
  grades: GradeId[];     // 標準履修学年
  mextCode?: string;     // 学習指導要領コード
  domains: Domain[];
};

// ヘルパー: ID 生成
const sid = (s: string, d: string, u: string) => `${s}::${d}::${u}`;

// ── 全カリキュラム ───────────────────────────
export const CURRICULUM: Subject[] = [
  // ══════ 国語 ══════
  {
    id: "japanese-modern",
    area: "japanese",
    name: "現代文",
    shortName: "現文",
    grades: ["h1", "h2", "h3", "ronin"],
    mextCode: "JP-MOD",
    domains: [
      {
        id: "jp-modern-evaluation",
        name: "評論",
        units: [
          { id: sid("jp-mod","eval","logic"), name: "論理展開の把握", abilities: ["論理構成力","読解力"], examFrequency: "high" },
          { id: sid("jp-mod","eval","keyword"), name: "キーワード抽出", abilities: ["抽象化力","読解力"], examFrequency: "high" },
          { id: sid("jp-mod","eval","summary"), name: "要約", abilities: ["抽象化力","論理構成力"], examFrequency: "mid" },
        ],
      },
      {
        id: "jp-modern-novel",
        name: "小説",
        units: [
          { id: sid("jp-mod","nov","emotion"), name: "心情把握", abilities: ["読解力","推論力"], examFrequency: "high" },
          { id: sid("jp-mod","nov","scene"), name: "場面・描写", abilities: ["読解力"], examFrequency: "mid" },
        ],
      },
      {
        id: "jp-modern-essay",
        name: "随筆・実用文",
        units: [
          { id: sid("jp-mod","ess","intent"), name: "筆者の意図", abilities: ["読解力","推論力"], examFrequency: "mid" },
          { id: sid("jp-mod","ess","practical"), name: "実用文・図表", abilities: ["データ分析力","読解力"], examFrequency: "high" },
        ],
      },
    ],
  },
  {
    id: "japanese-classic",
    area: "japanese",
    name: "古文",
    shortName: "古",
    grades: ["h1", "h2", "h3", "ronin"],
    mextCode: "JP-CLA",
    domains: [
      {
        id: "jp-classic-grammar",
        name: "文法",
        units: [
          { id: sid("jp-cla","gra","verb"), name: "動詞の活用", abilities: ["暗記力"], examFrequency: "high" },
          { id: sid("jp-cla","gra","aux"), name: "助動詞", abilities: ["暗記力","条件整理力"], examFrequency: "high" },
          { id: sid("jp-cla","gra","particle"), name: "助詞", abilities: ["暗記力"], examFrequency: "mid" },
          { id: sid("jp-cla","gra","keigo"), name: "敬語", abilities: ["暗記力","推論力"], examFrequency: "high" },
        ],
      },
      { id: "jp-classic-vocab", name: "古文単語", units: [
        { id: sid("jp-cla","voc","core"), name: "頻出単語", abilities: ["暗記力"], examFrequency: "high" },
      ]},
      { id: "jp-classic-reading", name: "読解", units: [
        { id: sid("jp-cla","read","narrative"), name: "物語", abilities: ["読解力"], examFrequency: "high" },
        { id: sid("jp-cla","read","diary"), name: "日記・随筆", abilities: ["読解力"], examFrequency: "mid" },
      ]},
      { id: "jp-classic-waka", name: "和歌・韻文", units: [
        { id: sid("jp-cla","waka","rhetoric"), name: "修辞技法", abilities: ["暗記力","推論力"], examFrequency: "mid" },
      ]},
    ],
  },
  {
    id: "japanese-kanbun",
    area: "japanese",
    name: "漢文",
    shortName: "漢",
    grades: ["h1", "h2", "h3", "ronin"],
    mextCode: "JP-KAN",
    domains: [
      { id: "jp-kanbun-syntax", name: "句法", units: [
        { id: sid("jp-kan","syn","negation"), name: "否定形", abilities: ["暗記力"], examFrequency: "high" },
        { id: sid("jp-kan","syn","passive"), name: "受身・使役", abilities: ["暗記力","条件整理力"], examFrequency: "high" },
        { id: sid("jp-kan","syn","interrogative"), name: "疑問・反語", abilities: ["暗記力"], examFrequency: "high" },
      ]},
      { id: "jp-kanbun-vocab", name: "漢字・語彙", units: [
        { id: sid("jp-kan","voc","core"), name: "重要語", abilities: ["暗記力"], examFrequency: "high" },
      ]},
      { id: "jp-kanbun-reading", name: "読解", units: [
        { id: sid("jp-kan","read","story"), name: "故事・説話", abilities: ["読解力","推論力"], examFrequency: "high" },
        { id: sid("jp-kan","read","poem"), name: "漢詩", abilities: ["読解力"], examFrequency: "mid" },
      ]},
    ],
  },

  // ══════ 数学 ══════
  {
    id: "math-1",
    area: "math",
    name: "数学Ⅰ",
    shortName: "数Ⅰ",
    grades: ["h1", "h2", "h3", "ronin"],
    mextCode: "MA-I",
    domains: [
      { id: "math1-expr", name: "数と式", units: [
        { id: sid("m1","exp","calc"), name: "整式の計算", abilities: ["計算力","式変形力"], examFrequency: "high" },
        { id: sid("m1","exp","factor"), name: "因数分解", abilities: ["式変形力","計算力"], examFrequency: "high" },
        { id: sid("m1","exp","real"), name: "実数・絶対値", abilities: ["条件整理力"], examFrequency: "mid" },
      ]},
      { id: "math1-quadratic", name: "二次関数", units: [
        { id: sid("m1","qd","graph"), name: "グラフ", abilities: ["図形把握力","式変形力"], examFrequency: "high" },
        { id: sid("m1","qd","max"), name: "最大・最小", abilities: ["条件整理力","計算力"], examFrequency: "high" },
        { id: sid("m1","qd","ineq"), name: "二次不等式", abilities: ["計算力","条件整理力"], examFrequency: "high" },
      ]},
      { id: "math1-trig", name: "図形と計量", units: [
        { id: sid("m1","tri","ratio"), name: "三角比", abilities: ["図形把握力","計算力"], examFrequency: "high" },
        { id: sid("m1","tri","sin-cos-law"), name: "正弦・余弦定理", abilities: ["図形把握力","計算力"], examFrequency: "high" },
      ]},
      { id: "math1-data", name: "データの分析", units: [
        { id: sid("m1","data","mean-var"), name: "平均・分散・標準偏差", abilities: ["計算力","データ分析力"], examFrequency: "mid" },
        { id: sid("m1","data","corr"), name: "相関係数", abilities: ["データ分析力"], examFrequency: "mid" },
      ]},
      { id: "math1-set", name: "集合と命題", units: [
        { id: sid("m1","set","set"), name: "集合", abilities: ["条件整理力","論理構成力"], examFrequency: "mid" },
        { id: sid("m1","set","prop"), name: "命題と論理", abilities: ["論理構成力"], examFrequency: "mid" },
      ]},
    ],
  },
  {
    id: "math-a",
    area: "math",
    name: "数学A",
    shortName: "数A",
    grades: ["h1", "h2", "h3", "ronin"],
    mextCode: "MA-A",
    domains: [
      { id: "matha-count", name: "場合の数", units: [
        { id: sid("mA","ct","perm"), name: "順列", abilities: ["条件整理力","計算力"], examFrequency: "high" },
        { id: sid("mA","ct","comb"), name: "組合せ", abilities: ["条件整理力","計算力"], examFrequency: "high" },
      ]},
      { id: "matha-prob", name: "確率", units: [
        { id: sid("mA","pr","basic"), name: "確率の基本", abilities: ["条件整理力","推論力"], examFrequency: "high" },
        { id: sid("mA","pr","cond"), name: "条件付き確率", abilities: ["条件整理力","推論力"], examFrequency: "high" },
      ]},
      { id: "matha-geom", name: "図形の性質", units: [
        { id: sid("mA","geo","tri"), name: "三角形の性質", abilities: ["図形把握力"], examFrequency: "mid" },
        { id: sid("mA","geo","circ"), name: "円の性質", abilities: ["図形把握力"], examFrequency: "mid" },
      ]},
      { id: "matha-int", name: "整数の性質", units: [
        { id: sid("mA","int","euclid"), name: "ユークリッド互除法", abilities: ["条件整理力"], examFrequency: "high" },
        { id: sid("mA","int","ndim"), name: "n進法", abilities: ["条件整理力","計算力"], examFrequency: "mid" },
      ]},
    ],
  },
  {
    id: "math-2",
    area: "math",
    name: "数学Ⅱ",
    shortName: "数Ⅱ",
    grades: ["h2", "h3", "ronin"],
    mextCode: "MA-II",
    domains: [
      { id: "math2-expr", name: "式と証明", units: [
        { id: sid("m2","exp","binom"), name: "二項定理", abilities: ["計算力","式変形力"], examFrequency: "mid" },
        { id: sid("m2","exp","proof"), name: "等式・不等式の証明", abilities: ["論理構成力","式変形力"], examFrequency: "mid" },
      ]},
      { id: "math2-cplx", name: "複素数と方程式", units: [
        { id: sid("m2","cpl","calc"), name: "複素数の計算", abilities: ["計算力","式変形力"], examFrequency: "mid" },
        { id: sid("m2","cpl","poly"), name: "高次方程式", abilities: ["式変形力","条件整理力"], examFrequency: "high" },
      ]},
      { id: "math2-geom", name: "図形と方程式", units: [
        { id: sid("m2","fg","line"), name: "直線・円の方程式", abilities: ["図形把握力","計算力"], examFrequency: "high" },
        { id: sid("m2","fg","locus"), name: "軌跡と領域", abilities: ["図形把握力","条件整理力"], examFrequency: "high" },
      ]},
      { id: "math2-trig", name: "三角関数", units: [
        { id: sid("m2","trig","sum"), name: "加法定理", abilities: ["式変形力","計算力"], examFrequency: "high" },
        { id: sid("m2","trig","graph"), name: "三角関数のグラフ", abilities: ["図形把握力"], examFrequency: "mid" },
      ]},
      { id: "math2-explog", name: "指数・対数関数", units: [
        { id: sid("m2","el","exp"), name: "指数関数", abilities: ["計算力"], examFrequency: "high" },
        { id: sid("m2","el","log"), name: "対数関数", abilities: ["式変形力","計算力"], examFrequency: "high" },
      ]},
      { id: "math2-diff", name: "微分法・積分法", units: [
        { id: sid("m2","di","diff"), name: "微分（多項式）", abilities: ["計算力"], examFrequency: "high" },
        { id: sid("m2","di","int"), name: "積分（多項式）", abilities: ["計算力"], examFrequency: "high" },
      ]},
    ],
  },
  {
    id: "math-b",
    area: "math",
    name: "数学B",
    shortName: "数B",
    grades: ["h2", "h3", "ronin"],
    mextCode: "MA-B",
    domains: [
      { id: "mathb-seq", name: "数列", units: [
        { id: sid("mB","seq","arith"), name: "等差・等比数列", abilities: ["計算力","条件整理力"], examFrequency: "high" },
        { id: sid("mB","seq","sum"), name: "Σの計算", abilities: ["計算力","式変形力"], examFrequency: "high" },
        { id: sid("mB","seq","induction"), name: "数学的帰納法", abilities: ["論理構成力"], examFrequency: "high" },
      ]},
      { id: "mathb-stat", name: "統計的な推測", units: [
        { id: sid("mB","st","sample"), name: "標本調査・推定", abilities: ["データ分析力","推論力"], examFrequency: "mid" },
        { id: sid("mB","st","test"), name: "仮説検定", abilities: ["論理構成力","データ分析力"], examFrequency: "low" },
      ]},
    ],
  },
  {
    id: "math-3",
    area: "math",
    name: "数学Ⅲ",
    shortName: "数Ⅲ",
    grades: ["h3", "ronin"],
    mextCode: "MA-III",
    domains: [
      { id: "math3-limit", name: "極限", units: [
        { id: sid("m3","lm","seq"), name: "数列の極限", abilities: ["推論力","式変形力"], examFrequency: "high" },
        { id: sid("m3","lm","func"), name: "関数の極限", abilities: ["式変形力"], examFrequency: "high" },
      ]},
      { id: "math3-diff", name: "微分法", units: [
        { id: sid("m3","df","calc"), name: "導関数の計算", abilities: ["計算力","式変形力"], examFrequency: "high" },
        { id: sid("m3","df","app"), name: "微分の応用（最大最小・接線・グラフ）", abilities: ["図形把握力","条件整理力"], examFrequency: "high" },
      ]},
      { id: "math3-int", name: "積分法", units: [
        { id: sid("m3","in","calc"), name: "積分の計算", abilities: ["計算力","式変形力"], examFrequency: "high" },
        { id: sid("m3","in","app"), name: "積分の応用（面積・体積・長さ）", abilities: ["図形把握力","計算力"], examFrequency: "high" },
      ]},
    ],
  },
  {
    id: "math-c",
    area: "math",
    name: "数学C",
    shortName: "数C",
    grades: ["h2", "h3", "ronin"],
    mextCode: "MA-C",
    domains: [
      { id: "mathc-vec", name: "ベクトル", units: [
        { id: sid("mC","vec","plane"), name: "平面ベクトル", abilities: ["図形把握力","式変形力"], examFrequency: "high" },
        { id: sid("mC","vec","space"), name: "空間ベクトル", abilities: ["図形把握力","条件整理力","式変形力"], examFrequency: "high" },
      ]},
      { id: "mathc-curve", name: "平面上の曲線", units: [
        { id: sid("mC","cu","conic"), name: "二次曲線", abilities: ["図形把握力"], examFrequency: "mid" },
        { id: sid("mC","cu","polar"), name: "極座標・媒介変数", abilities: ["図形把握力","式変形力"], examFrequency: "mid" },
      ]},
      { id: "mathc-cplx", name: "複素数平面", units: [
        { id: sid("mC","cp","basic"), name: "複素数平面の基本", abilities: ["図形把握力","式変形力"], examFrequency: "high" },
        { id: sid("mC","cp","demoivre"), name: "ド・モアブルの定理", abilities: ["式変形力"], examFrequency: "mid" },
      ]},
    ],
  },

  // ══════ 英語 ══════
  {
    id: "english-reading",
    area: "english",
    name: "リーディング",
    shortName: "R",
    grades: ["h1", "h2", "h3", "ronin"],
    mextCode: "EN-R",
    domains: [
      { id: "eng-r-short", name: "短文・段落理解", units: [
        { id: sid("eR","sh","main-idea"), name: "主旨把握", abilities: ["読解力"], examFrequency: "high" },
        { id: sid("eR","sh","detail"), name: "詳細把握", abilities: ["読解力"], examFrequency: "high" },
      ]},
      { id: "eng-r-long", name: "長文読解", units: [
        { id: sid("eR","lg","logical"), name: "論理的読解", abilities: ["読解力","論理構成力"], examFrequency: "high" },
        { id: sid("eR","lg","speed"), name: "速読", abilities: ["速読力","読解力"], examFrequency: "high" },
      ]},
      { id: "eng-r-discourse", name: "談話・パラグラフ", units: [
        { id: sid("eR","ds","cohesion"), name: "結束性・指示語", abilities: ["読解力","推論力"], examFrequency: "mid" },
        { id: sid("eR","ds","summary"), name: "要約", abilities: ["抽象化力","読解力"], examFrequency: "mid" },
      ]},
    ],
  },
  {
    id: "english-listening",
    area: "english",
    name: "リスニング",
    shortName: "L",
    grades: ["h1", "h2", "h3", "ronin"],
    mextCode: "EN-L",
    domains: [
      { id: "eng-l-dialog", name: "対話", units: [
        { id: sid("eL","dl","short"), name: "短い対話", abilities: ["リスニング力"], examFrequency: "high" },
        { id: sid("eL","dl","long"), name: "長い対話", abilities: ["リスニング力","推論力"], examFrequency: "high" },
      ]},
      { id: "eng-l-mono", name: "モノローグ", units: [
        { id: sid("eL","mo","narr"), name: "ナレーション", abilities: ["リスニング力"], examFrequency: "high" },
        { id: sid("eL","mo","lec"), name: "講義・図表", abilities: ["リスニング力","データ分析力"], examFrequency: "high" },
      ]},
    ],
  },
  {
    id: "english-writing",
    area: "english",
    name: "英作文",
    shortName: "W",
    grades: ["h2", "h3", "ronin"],
    mextCode: "EN-W",
    domains: [
      { id: "eng-w-jp-en", name: "和文英訳", units: [
        { id: sid("eW","je","short"), name: "短文英訳", abilities: ["和文英訳力","暗記力"], examFrequency: "high" },
        { id: sid("eW","je","long"), name: "長文英訳", abilities: ["和文英訳力","論理構成力"], examFrequency: "mid" },
      ]},
      { id: "eng-w-free", name: "自由英作文", units: [
        { id: sid("eW","fr","opinion"), name: "意見論述", abilities: ["論理構成力","和文英訳力"], examFrequency: "high" },
        { id: sid("eW","fr","summary"), name: "要約英作文", abilities: ["抽象化力","和文英訳力"], examFrequency: "mid" },
      ]},
    ],
  },
  {
    id: "english-grammar",
    area: "english",
    name: "文法・語法",
    shortName: "G",
    grades: ["h1", "h2", "h3", "ronin"],
    mextCode: "EN-G",
    domains: [
      { id: "eng-g-tense", name: "時制・態", units: [
        { id: sid("eG","tn","tense"), name: "時制", abilities: ["条件整理力"], examFrequency: "high" },
        { id: sid("eG","tn","passive"), name: "受動態", abilities: ["条件整理力"], examFrequency: "mid" },
      ]},
      { id: "eng-g-clause", name: "節・関係詞", units: [
        { id: sid("eG","cl","rel"), name: "関係詞", abilities: ["条件整理力"], examFrequency: "high" },
        { id: sid("eG","cl","sub"), name: "従位接続詞", abilities: ["条件整理力"], examFrequency: "mid" },
      ]},
      { id: "eng-g-verbal", name: "準動詞", units: [
        { id: sid("eG","vb","inf"), name: "不定詞", abilities: ["条件整理力"], examFrequency: "high" },
        { id: sid("eG","vb","gerund"), name: "動名詞", abilities: ["条件整理力"], examFrequency: "high" },
        { id: sid("eG","vb","part"), name: "分詞", abilities: ["条件整理力"], examFrequency: "high" },
      ]},
      { id: "eng-g-mood", name: "仮定法・比較", units: [
        { id: sid("eG","md","cond"), name: "仮定法", abilities: ["条件整理力","推論力"], examFrequency: "high" },
        { id: sid("eG","md","comp"), name: "比較", abilities: ["条件整理力"], examFrequency: "high" },
      ]},
      { id: "eng-g-usage", name: "語法・イディオム", units: [
        { id: sid("eG","us","idiom"), name: "イディオム", abilities: ["暗記力"], examFrequency: "high" },
      ]},
    ],
  },
  {
    id: "english-parsing",
    area: "english",
    name: "英文解釈",
    shortName: "P",
    grades: ["h2", "h3", "ronin"],
    mextCode: "EN-P",
    domains: [
      { id: "eng-p-structure", name: "SVOC把握", units: [
        { id: sid("eP","st","basic"), name: "基本五文型", abilities: ["英文構造把握力"], examFrequency: "high" },
        { id: sid("eP","st","complex"), name: "複雑な文の解析", abilities: ["英文構造把握力","読解力"], examFrequency: "high" },
      ]},
      { id: "eng-p-rhetoric", name: "構文・意訳", units: [
        { id: sid("eP","rh","construct"), name: "重要構文", abilities: ["英文構造把握力","暗記力"], examFrequency: "high" },
        { id: sid("eP","rh","translate"), name: "意訳・自然な日本語", abilities: ["読解力","和文英訳力"], examFrequency: "mid" },
      ]},
    ],
  },

  // ══════ 理科 ══════
  ...basicScience(),
  ...advancedScience(),

  // ══════ 地歴 ══════
  ...history(),

  // ══════ 公民 ══════
  ...civics(),

  // ══════ 情報 ══════
  {
    id: "info-1",
    area: "info",
    name: "情報Ⅰ",
    shortName: "情Ⅰ",
    grades: ["h1", "h2", "h3", "ronin"],
    mextCode: "INFO-I",
    domains: [
      { id: "info1-society", name: "情報社会の問題解決", units: [
        { id: sid("i1","so","ethic"), name: "情報モラル・法", abilities: ["暗記力"], examFrequency: "mid" },
      ]},
      { id: "info1-design", name: "コミュニケーションと情報デザイン", units: [
        { id: sid("i1","de","encoding"), name: "情報の表現と圧縮", abilities: ["条件整理力","計算力"], examFrequency: "high" },
      ]},
      { id: "info1-prog", name: "コンピュータとプログラミング", units: [
        { id: sid("i1","pg","algo"), name: "アルゴリズムとプログラミング", abilities: ["論理構成力","計算力"], examFrequency: "high" },
      ]},
      { id: "info1-data", name: "情報通信ネットワークとデータの活用", units: [
        { id: sid("i1","dt","net"), name: "ネットワークの仕組み", abilities: ["暗記力","条件整理力"], examFrequency: "mid" },
        { id: sid("i1","dt","db"), name: "データベース・統計", abilities: ["データ分析力"], examFrequency: "high" },
      ]},
    ],
  },
];

function basicScience(): Subject[] {
  const a: Subject[] = [
    {
      id: "physics-basic", area: "science", name: "物理基礎", shortName: "物基",
      grades: ["h1","h2","h3","ronin"], mextCode: "SCI-PH-B",
      domains: [
        { id: "phb-mech", name: "運動とエネルギー", units: [
          { id: sid("phB","mech","kine"), name: "運動の表し方", abilities: ["計算力","式変形力"], examFrequency: "high" },
          { id: sid("phB","mech","energy"), name: "仕事とエネルギー", abilities: ["条件整理力","計算力"], examFrequency: "high" },
        ]},
        { id: "phb-thermal", name: "熱", units: [
          { id: sid("phB","th","heat"), name: "熱と温度", abilities: ["計算力"], examFrequency: "mid" },
        ]},
        { id: "phb-wave", name: "波", units: [
          { id: sid("phB","wv","sound"), name: "波の性質・音", abilities: ["図形把握力","計算力"], examFrequency: "mid" },
        ]},
        { id: "phb-elec", name: "電気", units: [
          { id: sid("phB","el","circuit"), name: "電流・回路", abilities: ["計算力","条件整理力"], examFrequency: "high" },
        ]},
      ],
    },
    {
      id: "chemistry-basic", area: "science", name: "化学基礎", shortName: "化基",
      grades: ["h1","h2","h3","ronin"], mextCode: "SCI-CH-B",
      domains: [
        { id: "chb-comp", name: "物質の構成", units: [
          { id: sid("chB","cp","atom"), name: "原子・電子配置", abilities: ["暗記力","条件整理力"], examFrequency: "high" },
          { id: sid("chB","cp","bond"), name: "化学結合", abilities: ["条件整理力"], examFrequency: "high" },
        ]},
        { id: "chb-quant", name: "物質量と化学反応式", units: [
          { id: sid("chB","qt","mol"), name: "molの計算", abilities: ["計算力"], examFrequency: "high" },
          { id: sid("chB","qt","eq"), name: "化学反応式と量計算", abilities: ["計算力","条件整理力"], examFrequency: "high" },
        ]},
        { id: "chb-react", name: "化学反応", units: [
          { id: sid("chB","rx","acid"), name: "酸と塩基", abilities: ["条件整理力","計算力"], examFrequency: "high" },
          { id: sid("chB","rx","redox"), name: "酸化還元", abilities: ["条件整理力","計算力"], examFrequency: "high" },
        ]},
      ],
    },
    {
      id: "biology-basic", area: "science", name: "生物基礎", shortName: "生基",
      grades: ["h1","h2","h3","ronin"], mextCode: "SCI-BI-B",
      domains: [
        { id: "bib-cell", name: "生物の特徴", units: [
          { id: sid("biB","cl","cell"), name: "細胞・代謝", abilities: ["暗記力"], examFrequency: "high" },
        ]},
        { id: "bib-gene", name: "遺伝子とその働き", units: [
          { id: sid("biB","gn","dna"), name: "DNAとタンパク質合成", abilities: ["暗記力","推論力"], examFrequency: "high" },
        ]},
        { id: "bib-body", name: "生体の調節", units: [
          { id: sid("biB","bd","homeo"), name: "ホメオスタシス・免疫", abilities: ["暗記力","因果関係把握力"], examFrequency: "high" },
        ]},
        { id: "bib-eco", name: "生態系", units: [
          { id: sid("biB","ec","biome"), name: "バイオームと植生", abilities: ["暗記力"], examFrequency: "mid" },
        ]},
      ],
    },
    {
      id: "earth-basic", area: "science", name: "地学基礎", shortName: "地基",
      grades: ["h1","h2","h3","ronin"], mextCode: "SCI-ES-B",
      domains: [
        { id: "esb-earth", name: "地球", units: [
          { id: sid("esB","er","interior"), name: "地球の内部", abilities: ["暗記力"], examFrequency: "mid" },
          { id: sid("esB","er","plate"), name: "プレートテクトニクス", abilities: ["因果関係把握力"], examFrequency: "high" },
        ]},
        { id: "esb-weather", name: "大気と海洋", units: [
          { id: sid("esB","wt","atmos"), name: "大気の構造", abilities: ["暗記力"], examFrequency: "mid" },
        ]},
        { id: "esb-universe", name: "宇宙", units: [
          { id: sid("esB","un","star"), name: "恒星と銀河", abilities: ["暗記力"], examFrequency: "mid" },
        ]},
      ],
    },
  ];
  return a;
}

function advancedScience(): Subject[] {
  return [
    {
      id: "physics", area: "science", name: "物理", shortName: "物",
      grades: ["h2","h3","ronin"], mextCode: "SCI-PH",
      domains: [
        { id: "ph-mech", name: "力学", units: [
          { id: sid("ph","mc","newton"), name: "運動方程式", abilities: ["計算力","条件整理力"], examFrequency: "high" },
          { id: sid("ph","mc","energy"), name: "エネルギー・運動量保存", abilities: ["条件整理力","計算力"], examFrequency: "high" },
          { id: sid("ph","mc","circular"), name: "円運動・単振動", abilities: ["式変形力","図形把握力"], examFrequency: "high" },
          { id: sid("ph","mc","gravity"), name: "万有引力", abilities: ["式変形力"], examFrequency: "mid" },
        ]},
        { id: "ph-thermal", name: "熱力学", units: [
          { id: sid("ph","th","ideal"), name: "理想気体の状態方程式", abilities: ["計算力"], examFrequency: "high" },
          { id: sid("ph","th","cycle"), name: "熱サイクル・内部エネルギー", abilities: ["条件整理力","計算力"], examFrequency: "high" },
        ]},
        { id: "ph-wave", name: "波動", units: [
          { id: sid("ph","wv","interfere"), name: "干渉・回折", abilities: ["図形把握力","計算力"], examFrequency: "high" },
          { id: sid("ph","wv","doppler"), name: "ドップラー効果", abilities: ["式変形力","計算力"], examFrequency: "high" },
        ]},
        { id: "ph-em", name: "電磁気", units: [
          { id: sid("ph","em","field"), name: "電場・電位", abilities: ["条件整理力","計算力"], examFrequency: "high" },
          { id: sid("ph","em","circuit"), name: "コンデンサ・直流回路", abilities: ["計算力","条件整理力"], examFrequency: "high" },
          { id: sid("ph","em","magnet"), name: "電磁誘導", abilities: ["式変形力","条件整理力"], examFrequency: "high" },
        ]},
        { id: "ph-atomic", name: "原子", units: [
          { id: sid("ph","at","photon"), name: "光電効果・原子構造", abilities: ["計算力","暗記力"], examFrequency: "mid" },
        ]},
      ],
    },
    {
      id: "chemistry", area: "science", name: "化学", shortName: "化",
      grades: ["h2","h3","ronin"], mextCode: "SCI-CH",
      domains: [
        { id: "ch-theo", name: "理論化学", units: [
          { id: sid("ch","th","thermo"), name: "化学反応とエネルギー", abilities: ["計算力","条件整理力"], examFrequency: "high" },
          { id: sid("ch","th","eq"), name: "化学平衡", abilities: ["条件整理力","計算力"], examFrequency: "high" },
          { id: sid("ch","th","electro"), name: "電気分解・電池", abilities: ["条件整理力","計算力"], examFrequency: "high" },
        ]},
        { id: "ch-inorg", name: "無機化学", units: [
          { id: sid("ch","in","typical"), name: "典型元素", abilities: ["暗記力"], examFrequency: "high" },
          { id: sid("ch","in","trans"), name: "遷移元素", abilities: ["暗記力"], examFrequency: "mid" },
        ]},
        { id: "ch-org", name: "有機化学", units: [
          { id: sid("ch","og","aliphatic"), name: "脂肪族化合物", abilities: ["暗記力","推論力"], examFrequency: "high" },
          { id: sid("ch","og","aromatic"), name: "芳香族化合物", abilities: ["暗記力","推論力"], examFrequency: "high" },
          { id: sid("ch","og","struct"), name: "構造決定", abilities: ["推論力","条件整理力"], examFrequency: "high" },
        ]},
        { id: "ch-poly", name: "高分子化合物", units: [
          { id: sid("ch","po","natural"), name: "天然高分子", abilities: ["暗記力"], examFrequency: "mid" },
          { id: sid("ch","po","synth"), name: "合成高分子", abilities: ["暗記力"], examFrequency: "mid" },
        ]},
      ],
    },
    {
      id: "biology", area: "science", name: "生物", shortName: "生",
      grades: ["h2","h3","ronin"], mextCode: "SCI-BI",
      domains: [
        { id: "bi-cell", name: "細胞と分子", units: [
          { id: sid("bi","cl","metab"), name: "代謝とATP", abilities: ["暗記力","因果関係把握力"], examFrequency: "high" },
        ]},
        { id: "bi-gene", name: "遺伝情報の発現", units: [
          { id: sid("bi","gn","exp"), name: "遺伝子発現の調節", abilities: ["暗記力","因果関係把握力"], examFrequency: "high" },
          { id: sid("bi","gn","bio-tech"), name: "バイオテクノロジー", abilities: ["暗記力","推論力"], examFrequency: "high" },
        ]},
        { id: "bi-evo", name: "進化と系統", units: [
          { id: sid("bi","ev","evol"), name: "進化のしくみ", abilities: ["因果関係把握力"], examFrequency: "mid" },
        ]},
        { id: "bi-eco", name: "生態", units: [
          { id: sid("bi","ec","pop"), name: "個体群・群集", abilities: ["データ分析力"], examFrequency: "mid" },
        ]},
      ],
    },
    {
      id: "earth", area: "science", name: "地学", shortName: "地",
      grades: ["h2","h3","ronin"], mextCode: "SCI-ES",
      domains: [
        { id: "es-earth", name: "地球", units: [
          { id: sid("es","er","seismo"), name: "地震波・地球内部", abilities: ["計算力","因果関係把握力"], examFrequency: "high" },
        ]},
        { id: "es-history", name: "地球の歴史", units: [
          { id: sid("es","hs","strata"), name: "地層と化石", abilities: ["暗記力"], examFrequency: "mid" },
        ]},
        { id: "es-weather", name: "大気と海洋", units: [
          { id: sid("es","wt","circ"), name: "大気・海洋の大循環", abilities: ["因果関係把握力"], examFrequency: "high" },
        ]},
        { id: "es-universe", name: "宇宙", units: [
          { id: sid("es","un","galaxy"), name: "銀河系", abilities: ["暗記力"], examFrequency: "mid" },
        ]},
      ],
    },
  ];
}

function history(): Subject[] {
  return [
    {
      id: "japanese-history", area: "history", name: "日本史", shortName: "日史",
      grades: ["h2","h3","ronin"], mextCode: "HIS-JH",
      domains: [
        { id: "jh-ancient", name: "原始・古代", units: [
          { id: sid("jH","an","jomon"), name: "縄文〜大和", abilities: ["暗記力"], examFrequency: "mid" },
          { id: sid("jH","an","heian"), name: "飛鳥〜平安", abilities: ["暗記力","歴史的思考力"], examFrequency: "high" },
        ]},
        { id: "jh-medieval", name: "中世", units: [
          { id: sid("jH","md","kamakura"), name: "鎌倉・室町", abilities: ["暗記力"], examFrequency: "high" },
        ]},
        { id: "jh-early-modern", name: "近世", units: [
          { id: sid("jH","em","edo"), name: "江戸時代", abilities: ["暗記力","歴史的思考力"], examFrequency: "high" },
        ]},
        { id: "jh-modern", name: "近代", units: [
          { id: sid("jH","mo","meiji"), name: "明治・大正", abilities: ["暗記力","因果関係把握力"], examFrequency: "high" },
          { id: sid("jH","mo","showa"), name: "昭和（戦前）", abilities: ["暗記力","因果関係把握力"], examFrequency: "high" },
        ]},
        { id: "jh-contemporary", name: "現代", units: [
          { id: sid("jH","co","postwar"), name: "戦後", abilities: ["暗記力"], examFrequency: "mid" },
        ]},
      ],
    },
    {
      id: "world-history", area: "history", name: "世界史", shortName: "世史",
      grades: ["h2","h3","ronin"], mextCode: "HIS-WH",
      domains: [
        { id: "wh-ancient", name: "古代", units: [
          { id: sid("wH","an","civil"), name: "古代文明・ギリシャローマ", abilities: ["暗記力"], examFrequency: "high" },
        ]},
        { id: "wh-medieval", name: "中世", units: [
          { id: sid("wH","md","europe"), name: "中世ヨーロッパ・イスラム", abilities: ["暗記力","因果関係把握力"], examFrequency: "high" },
        ]},
        { id: "wh-early-modern", name: "近世", units: [
          { id: sid("wH","em","reformation"), name: "ルネサンス・宗教改革", abilities: ["暗記力","歴史的思考力"], examFrequency: "high" },
          { id: sid("wH","em","absolute"), name: "絶対王政・市民革命", abilities: ["因果関係把握力"], examFrequency: "high" },
        ]},
        { id: "wh-modern", name: "近代", units: [
          { id: sid("wH","mo","industrial"), name: "産業革命・帝国主義", abilities: ["因果関係把握力"], examFrequency: "high" },
          { id: sid("wH","mo","ww"), name: "両大戦", abilities: ["因果関係把握力","歴史的思考力"], examFrequency: "high" },
        ]},
        { id: "wh-contemporary", name: "現代", units: [
          { id: sid("wH","co","coldwar"), name: "冷戦と現代", abilities: ["因果関係把握力"], examFrequency: "mid" },
        ]},
      ],
    },
    {
      id: "geography", area: "history", name: "地理", shortName: "地理",
      grades: ["h2","h3","ronin"], mextCode: "HIS-GE",
      domains: [
        { id: "ge-systematic", name: "系統地理", units: [
          { id: sid("ge","sy","natural"), name: "自然環境", abilities: ["地理的思考力","因果関係把握力"], examFrequency: "high" },
          { id: sid("ge","sy","industry"), name: "産業・資源", abilities: ["データ分析力","地理的思考力"], examFrequency: "high" },
          { id: sid("ge","sy","population"), name: "人口・都市", abilities: ["データ分析力"], examFrequency: "high" },
        ]},
        { id: "ge-regional", name: "地誌", units: [
          { id: sid("ge","rg","asia"), name: "アジア", abilities: ["暗記力","地理的思考力"], examFrequency: "high" },
          { id: sid("ge","rg","europe"), name: "ヨーロッパ", abilities: ["暗記力","地理的思考力"], examFrequency: "high" },
          { id: sid("ge","rg","americas"), name: "南北アメリカ", abilities: ["暗記力","地理的思考力"], examFrequency: "mid" },
        ]},
        { id: "ge-map", name: "地図と地理情報", units: [
          { id: sid("ge","mp","gis"), name: "地図・GIS", abilities: ["データ分析力","図形把握力"], examFrequency: "mid" },
        ]},
      ],
    },
  ];
}

function civics(): Subject[] {
  return [
    {
      id: "civics-public", area: "civics", name: "公共", shortName: "公共",
      grades: ["h1","h2","h3","ronin"], mextCode: "CIV-PB",
      domains: [
        { id: "cv-pb-society", name: "現代社会の特質", units: [
          { id: sid("cv","ps","mod"), name: "現代社会の課題", abilities: ["論理構成力"], examFrequency: "mid" },
        ]},
        { id: "cv-pb-democracy", name: "民主政治", units: [
          { id: sid("cv","pd","const"), name: "日本国憲法", abilities: ["暗記力"], examFrequency: "high" },
          { id: sid("cv","pd","govern"), name: "三権分立・選挙", abilities: ["暗記力","条件整理力"], examFrequency: "high" },
        ]},
        { id: "cv-pb-econ", name: "経済社会", units: [
          { id: sid("cv","pe","market"), name: "市場経済", abilities: ["論理構成力"], examFrequency: "high" },
        ]},
        { id: "cv-pb-intl", name: "国際社会", units: [
          { id: sid("cv","pi","intl"), name: "国際機関・国際法", abilities: ["暗記力"], examFrequency: "mid" },
        ]},
      ],
    },
    {
      id: "ethics", area: "civics", name: "倫理", shortName: "倫",
      grades: ["h3","ronin"], mextCode: "CIV-ET",
      domains: [
        { id: "ec-source", name: "源流思想", units: [
          { id: sid("et","sr","greek"), name: "ギリシャ哲学", abilities: ["暗記力","抽象化力"], examFrequency: "high" },
          { id: sid("et","sr","oriental"), name: "東洋思想", abilities: ["暗記力","抽象化力"], examFrequency: "high" },
        ]},
        { id: "ec-western", name: "西洋思想", units: [
          { id: sid("et","wt","modern"), name: "近代哲学", abilities: ["抽象化力","暗記力"], examFrequency: "high" },
          { id: sid("et","wt","contemp"), name: "現代思想", abilities: ["抽象化力"], examFrequency: "mid" },
        ]},
        { id: "ec-japan", name: "日本思想", units: [
          { id: sid("et","jp","trad"), name: "日本の伝統思想", abilities: ["暗記力"], examFrequency: "mid" },
        ]},
      ],
    },
    {
      id: "politics-economics", area: "civics", name: "政治経済", shortName: "政経",
      grades: ["h3","ronin"], mextCode: "CIV-PE",
      domains: [
        { id: "pe-politics", name: "政治分野", units: [
          { id: sid("pe","pl","const"), name: "憲法と人権", abilities: ["暗記力"], examFrequency: "high" },
          { id: sid("pe","pl","govern"), name: "政治制度", abilities: ["暗記力"], examFrequency: "high" },
        ]},
        { id: "pe-econ", name: "経済分野", units: [
          { id: sid("pe","ec","macro"), name: "マクロ経済", abilities: ["論理構成力","データ分析力"], examFrequency: "high" },
          { id: sid("pe","ec","fiscal"), name: "財政・金融", abilities: ["条件整理力","データ分析力"], examFrequency: "high" },
        ]},
        { id: "pe-intl", name: "国際経済", units: [
          { id: sid("pe","in","trade"), name: "貿易・為替", abilities: ["論理構成力","データ分析力"], examFrequency: "high" },
        ]},
      ],
    },
  ];
}

// ── 検索系ユーティリティ ─────────────────────────
export function getSubject(id: string): Subject | undefined {
  return CURRICULUM.find((s) => s.id === id);
}

export function subjectsByArea(area: SubjectAreaId): Subject[] {
  return CURRICULUM.filter((s) => s.area === area);
}

export function allUnits(): { subject: Subject; domain: Domain; unit: Unit }[] {
  const list: { subject: Subject; domain: Domain; unit: Unit }[] = [];
  for (const s of CURRICULUM) {
    for (const d of s.domains) {
      for (const u of d.units) list.push({ subject: s, domain: d, unit: u });
    }
  }
  return list;
}
